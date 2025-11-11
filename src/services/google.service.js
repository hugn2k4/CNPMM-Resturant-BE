import crypto from 'crypto';
import { getGoogleClient } from '../config/google.js';

// PKCE (tùy chọn, nhưng tốt; google-auth-library không bắt buộc)
let codeVerifier, codeChallenge, state;

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function buildAuthUrl(env) {
  const client = getGoogleClient(env);
  state = base64url(crypto.randomBytes(16));
  codeVerifier = base64url(crypto.randomBytes(32));
  codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
    state,
    // nếu muốn dùng PKCE:
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });
  return url;
}

export async function exchangeCode(params, env) {
  const client = getGoogleClient(env);
  if (!params.code) throw new Error('Missing code');
  // đổi code -> tokens
  const { tokens } = await client.getToken({
    code: params.code,
    codeVerifier,               // khớp với code_challenge ở trên
  });

  // Verify id_token và lấy profile (sub, email, name, picture…)
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.clientId,
  });
  const payload = ticket.getPayload(); // {sub, email, name, picture, email_verified, ...}
  return payload;
}

// Xác thực idToken từ frontend (Google Identity Services)
export async function verifyIdToken(idToken, env) {
  const client = getGoogleClient(env);
  
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: env.clientId,
  });
  
  const payload = ticket.getPayload();
  return payload; // {sub, email, name, picture, email_verified, ...}
}
