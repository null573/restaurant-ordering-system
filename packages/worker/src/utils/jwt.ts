import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from '@restaurant/shared';
import type { Env } from '../types';

const ALG = 'HS256';

/**
 * 签发 Access Token (短期, 2小时)
 */
export async function signAccessToken(env: Env, payload: Omit<JWTPayload, 'type' | 'exp' | 'iat'>): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + 2 * 3600) // 2小时
    .sign(secret);
}

/**
 * 签发 Refresh Token (长期, 30天)
 */
export async function signRefreshToken(env: Env, payload: Omit<JWTPayload, 'type' | 'exp' | 'iat'>): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + 30 * 86400) // 30天
    .sign(secret);
}

/**
 * 验证 Token
 */
export async function verifyToken(env: Env, token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * 从 Authorization Header 提取 token
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
