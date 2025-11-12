// src/services/auth.service.js
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export async function upsertGoogleUser(googleProfile) {
  const { sub, email, email_verified, name, picture, given_name, family_name } = googleProfile;
  
  if (!sub || !email) {
    throw new Error('Missing required fields from Google profile');
  }

  // Tách tên thành firstName và lastName
  const firstName = given_name || name?.split(' ')[0] || '';
  const lastName = family_name || name?.split(' ').slice(1).join(' ') || '';

  // Tìm user theo providerId (Google sub) hoặc email
  let user = await User.findOne({
    $or: [
      { providerId: sub, authProvider: 'google' },
      { email: email }
    ]
  });

  if (user) {
    // Cập nhật thông tin user nếu đã tồn tại
    user.providerId = sub;
    user.authProvider = 'google';
    user.email = email;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.image = picture || user.image;
    user.isEmailVerified = email_verified !== undefined ? email_verified : user.isEmailVerified;
    user.lastLogin = new Date();
    await user.save();
  } else {
    // Tạo user mới
    user = await User.create({
      email,
      firstName,
      lastName,
      image: picture,
      authProvider: 'google',
      providerId: sub,
      isEmailVerified: email_verified || false,
      lastLogin: new Date(),
    });
  }

  // Trả về user object với các trường cần thiết
  return {
    id: user._id.toString(),
    email: user.email,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    picture: user.image,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export function signAccessToken(user, JWT_SECRET) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}
