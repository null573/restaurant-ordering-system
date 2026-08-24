/**
 * 密码哈希工具 - 使用 Web Crypto API (PBKDF2)
 * Workers 不支持 bcrypt，使用 PBKDF2-SHA256
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 32;

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const hash = new Uint8Array(derivedBits);
  // 格式: pbkdf2$iterations$salt_hex$hash_hex
  return `pbkdf2$${ITERATIONS}$${bufferToHex(salt)}$${bufferToHex(hash)}`;
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1]);
  const salt = hexToBuffer(parts[2]);
  const storedHash = parts[3];

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const hash = bufferToHex(new Uint8Array(derivedBits));
  // 常量时间比较
  if (hash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

function bufferToHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

/**
 * 生成随机 hex 字符串
 */
export function randomHex(length: number): string {
  const arr = new Uint8Array(length / 2);
  crypto.getRandomValues(arr);
  return bufferToHex(arr);
}
