"use strict";

import nodemailer from "nodemailer";

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    // No SMTP configured — return null and callers can fallback to logging
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const getHtmlContent = (otp) => {
  return `<!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <style>
          body {
            background-color: #f0f4f8; /* nền tổng thể nhẹ nhàng */
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
          }
          .email-wrapper {
            max-width: 700px;
            margin: 50px auto;
            padding: 20px;
          }
          .email-container {
            background: linear-gradient(326deg, #86ffe799, #d6aeffd4);
            border-radius: 14px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 30px;
            color: #1a1a1a; /* chữ đen hiện đại */
          }
          .intro {
            font-size: 16px;
            color: #333333;
            line-height: 1.6;
            margin-bottom: 25px;
          }
          .otp-container {
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            display: inline-block;
            font-size: 38px;
            font-weight: bold;
            color: #ff6f20; /* cam rực rỡ */
            background: #fff7f0; /* nền nhẹ cho OTP */
            padding: 20px 50px;
            border-radius: 12px;
            letter-spacing: 5px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .instructions {
            font-size: 15px;
            color: #555555;
            line-height: 1.6;
            margin-top: 20px;
            text-align: center;
          }
          .button-container {
            text-align: center;
            margin-top: 35px;
          }
          .footer {
            text-align: center;
            margin-top: 45px;
            font-size: 13px;
            color: #888888;
            line-height: 1.5;
          }
        </style>
        </head>
        <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <h1>Mã xác nhận OTP</h1>
            </div>
            <div class="intro">
              Xin chào,<br/><br/>
              Chúng tôi đã nhận được yêu cầu của bạn.
              Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình xác thực.
              Mã này chỉ có hiệu lực trong 1 phút và không được chia sẻ với bất kỳ ai.
            </div>
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
            </div>
            <div class="instructions">
              Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.<br/>
              Để bảo mật tài khoản, hãy không chia sẻ mã OTP với bất kỳ ai.
            </div>
            <div class="footer">
              Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.<br/>
              Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.
            </div>
          </div>
        </div>
        </body>
        </html>`;
};

const sendOTPToEmail = async (toEmail, otp) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[emailService] SMTP not configured. OTP for ${toEmail}: ${otp}`);
    return true;
  }

  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || "No Reply";

  const html = getHtmlContent(otp);

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: toEmail,
    subject: "Xác nhận tài khoản của bạn",
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[emailService] Message sent: ${info.messageId}`);
  return true;
};

const getNotificationHtmlContent = (title, message, type) => {
  const getTypeColor = (type) => {
    if (type.includes("ORDER")) return "#ff6f20";
    if (type.includes("REVIEW")) return "#4caf50";
    if (type.includes("VOUCHER")) return "#2196f3";
    return "#9c27b0";
  };

  return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          background-color: #f0f4f8;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
        }
        .email-wrapper {
          max-width: 700px;
          margin: 50px auto;
          padding: 20px;
        }
        .email-container {
          background: linear-gradient(326deg, #86ffe799, #d6aeffd4);
          border-radius: 14px;
          padding: 40px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          color: ${getTypeColor(type)};
        }
        .content {
          font-size: 16px;
          color: #333333;
          line-height: 1.6;
          margin-bottom: 25px;
          background: #fff7f0;
          padding: 20px;
          border-radius: 12px;
        }
        .footer {
          text-align: center;
          margin-top: 45px;
          font-size: 13px;
          color: #888888;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${message}
          </div>
          <div class="footer">
            Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
          </div>
        </div>
      </div>
    </body>
    </html>`;
};

const sendNotificationEmail = async (toEmail, title, message, type) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[emailService] SMTP not configured. Notification for ${toEmail}: ${title}`);
    return false;
  }

  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.FROM_NAME || "Siupo Restaurant";

  const html = getNotificationHtmlContent(title, message, type);

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: toEmail,
    subject: title,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[emailService] Notification email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[emailService] Error sending notification email:`, error);
    return false;
  }
};

export default { 
  sendOTPToEmail,
  sendNotificationEmail 
};
