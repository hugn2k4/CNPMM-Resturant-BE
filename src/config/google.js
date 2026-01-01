// src/config/google.js
import { OAuth2Client } from 'google-auth-library';

let client;
export function getGoogleClient(env) {
  if (!client) {
    // dùng tham số vị trí: (clientId, clientSecret, redirectUri)
    client = new OAuth2Client(env.clientId, env.clientSecret, env.redirectUri);
  }
  return client;
}
