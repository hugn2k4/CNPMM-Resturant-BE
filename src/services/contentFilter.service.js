"use strict";

class ContentFilterService {
  constructor() {
    this.badWords = [
      'địt', 'đụ', 'lồn', 'buồi', 'cặc', 'đéo', 'đcm', 'đkm',
      'vl', 'vcl', 'vcc', 'clgt', 'clmm', 'dm', 'đmm',
      'đjt', 'đjt mẹ', 'đjt bố', 'chó', 'súc vật', 'ngu',
      'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy',
      'f*ck', 'sh*t', 'b*tch', 'd*ck', 'đ*t', 'l*n', 'c*c'
    ];

    this.foodSensitiveWords = [
      'ngộ độc', 'đau bụng', 'tiêu chảy', 'nhập viện',
      'có dòi', 'có gián', 'có ruồi', 'có sâu', 'có tóc',
      'thiu', 'hư', 'thối', 'mốc', 'chua loét',
      'cám lợn', 'như hạch', 'kinh tởm', 'ói', 'buồn nôn'
    ];

    this.spamKeywords = [
      'tuyển dụng', 'việc nhẹ', 'lương cao', 'kiếm tiền',
      'shopeefood', 'grabfood', 'beamin', 'goviet',
      'kết bạn zalo', 'ib zalo', 'nhấn vào link', 'click tại đây'
    ];
  }

  /**
   * Kiểm tra và lọc nội dung
   * @param {string} content
   */
  filterContent(content) {
    if (!content || typeof content !== 'string') return this.createErrorResult();

    const result = {
      isValid: true,           // Cho phép đăng hay không
      filteredContent: content,// Nội dung sau khi che dấu *
      violations: [],          // Danh sách lỗi vi phạm
      needsReview: false,      // True nếu cần Admin duyệt thủ công (quan trọng cho shop ăn uống)
      flags: []                // Các nhãn cảnh báo (vd: 'food_safety', 'spam')
    };

    let processedContent = content;
    const lowerContent = content.toLowerCase();

    // --- BƯỚC 1: LỌC TỪ TỤC TĨU (Che ***) ---
    const foundBadWords = this.findMatches(lowerContent, this.badWords);
    if (foundBadWords.length > 0) {
      result.violations.push(`Ngôn từ không phù hợp: ${foundBadWords.join(', ')}`);
      processedContent = this.maskWords(processedContent, foundBadWords);
    }

    // --- BƯỚC 2: QUÉT TỪ KHÓA VỆ SINH AN TOÀN (Gắn cờ báo động) ---
    const foundSensitive = this.findMatches(lowerContent, this.foodSensitiveWords);
    if (foundSensitive.length > 0) {
      result.needsReview = true; 
      result.flags.push('FOOD_SAFETY_RISK'); // Gắn nhãn rủi ro
      // Ở đây mình chọn giữ nguyên để Admin thấy mức độ nghiêm trọng, nhưng báo vi phạm
      result.violations.push(`Nội dung nhạy cảm về vệ sinh/chất lượng: ${foundSensitive.join(', ')}`);
    }

    // --- BƯỚC 3: CHẶN SPAM & SỐ ĐIỆN THOẠI (Chống cướp khách) ---
    // Regex tìm số điện thoại VN (đơn giản)
    const phoneRegex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/g;
    if (phoneRegex.test(content)) {
      result.violations.push('Không được chia sẻ số điện thoại công khai');
      processedContent = processedContent.replace(phoneRegex, '***'); // Che số điện thoại
      result.flags.push('PHONE_NUMBER_DETECTED');
    }

    const foundSpam = this.findMatches(lowerContent, this.spamKeywords);
    if (foundSpam.length > 0) {
      result.violations.push(`Nghi vấn Spam/Quảng cáo: ${foundSpam.join(', ')}`);
      processedContent = this.maskWords(processedContent, foundSpam);
      result.needsReview = true;
    }

    // --- BƯỚC 4: KIỂM TRA ĐỘ DÀI ---
    if (processedContent.trim().length < 3) {
      result.isValid = false;
      result.violations.push('Nội dung quá ngắn');
    }
    if (content.length > 1000) {
      result.isValid = false;
      result.violations.push('Nội dung quá dài');
    }

    result.filteredContent = processedContent;

    // Nếu vi phạm quá nặng thì chặn luôn
    if (result.violations.length > 0 && result.flags.includes('PHONE_NUMBER_DETECTED')) {
        // Ví dụ: Chặn luôn nếu tung số điện thoại
        result.isValid = false; 
    }

    return result;
  }

  // Helper: Tìm từ khóa trong văn bản
  findMatches(text, wordList) {
    return wordList.filter(word => {
      const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
      return regex.test(text);
    });
  }

  // Helper: Thay thế từ khóa bằng dấu *
  maskWords(text, wordsToMask) {
    let newText = text;
    wordsToMask.forEach(word => {
      const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
      newText = newText.replace(regex, '*'.repeat(word.length));
    });
    return newText;
  }

  createErrorResult() {
    return { isValid: false, filteredContent: '', violations: ['Lỗi dữ liệu đầu vào'], needsReview: false, flags: [] };
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default new ContentFilterService();