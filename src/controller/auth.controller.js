// src/controller/auth.controller.js
import { buildAuthUrl, exchangeCode, verifyIdToken } from '../services/google.service.js';
import { upsertGoogleUser, signAccessToken } from '../services/auth.service.js';

const envFromProcess = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

export const googleLogin = async (req, res) => {
  const env = envFromProcess();

  // --- LOG DEBUG ---
  console.log('[GOOGLE ENV]', {
    clientId: env.clientId,
    redirectUri: env.redirectUri,
    clientSecret: env.clientSecret ? '***' : undefined,
  });

  try {
    const url = await buildAuthUrl(env);

    // --- LOG DEBUG ---
    console.log('[AUTH URL]', url);

    return res.redirect(url);
  } catch (e) {
    console.error('googleLogin error:', e);
    return res.status(500).json({
      success: false,
      message: e?.message || String(e),
    });
  }
};

export const googleCallback = async (req, res) => {
  const env = envFromProcess();

  // --- LOG DEBUG ---
  console.log('[CALLBACK QUERY]', req.query);

  try {
    const profile = await exchangeCode({ ...req.query }, env);

    // --- LOG DEBUG ---
    console.log('[PROFILE]', {
      sub: profile?.sub,
      email: profile?.email,
      email_verified: profile?.email_verified,
      name: profile?.name,
      picture: profile?.picture ? 'yes' : 'no',
    });

    const user = await upsertGoogleUser(profile);
    const token = signAccessToken(user, process.env.JWT_SECRET);

    // set cookie httpOnly (tùy bạn)
    res.cookie('access_token', token, { httpOnly: true, sameSite: 'lax', secure: false });

    return res.redirect(`${process.env.FRONTEND_URL}/?login=success`);
  } catch (e) {
    console.error('OAuth callback error:', e);
    // để dễ debug có thể trả JSON thay vì redirect:
    // return res.status(500).json({ success:false, message: e?.message || String(e) });
    return res.redirect(`${process.env.FRONTEND_URL}/?login=failed`);
  }
};

export const me = async (req, res) => {
  res.json({ ok: true, user: req.user });
};

// Xử lý idToken từ frontend (Google Identity Services)
export const googleIdTokenLogin = async (req, res) => {
  const env = envFromProcess();
  const { idToken } = req.body;

  // --- LOG DEBUG ---
  console.log('[GOOGLE ID TOKEN LOGIN]', { hasToken: !!idToken });

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'Missing idToken',
    });
  }

  try {
    // Verify idToken với Google
    const profile = await verifyIdToken(idToken, env);

    // --- LOG DEBUG ---
    console.log('[ID TOKEN PROFILE]', {
      sub: profile?.sub,
      email: profile?.email,
      email_verified: profile?.email_verified,
      name: profile?.name,
    });

    // Tạo hoặc cập nhật user trong DB
    const user = await upsertGoogleUser(profile);
    
    // Tạo JWT token
    const token = signAccessToken(user, process.env.JWT_SECRET);

    // Trả về token cho frontend
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      },
    });
  } catch (e) {
    console.error('Google ID Token verification error:', e);
    return res.status(401).json({
      success: false,
      message: e?.message || 'Invalid token',
    });
  }
};
