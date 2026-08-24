/**
 * ID 生成工具 - ULID 格式 (时间排序 + 随机)
 */

const ENCODE = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford Base32

let counter = 0;

export function generateId(prefix = ''): string {
  const now = Date.now();
  const random = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
  const microRandom = Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
  counter = (counter + 1) % 0xFFFF;
  const counterStr = counter.toString(16).padStart(4, '0');
  const id = `${now.toString(36)}-${random}${microRandom}${counterStr}`;
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * 生成短码 (用于租户 code、二维码 URL)
 */
export function generateShortCode(length = 8): string {
  const chars = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let result = '';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}

/**
 * 生成订单号: 日期 + 桌号 + 序号
 */
export function generateOrderNo(deskNumber: string, seq: number): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seqStr = String(seq).padStart(3, '0');
  return `${dateStr}-${deskNumber}-${seqStr}`;
}
