/**
 * 统一 API 响应辅助
 */
import type { ApiResponse } from '@restaurant/shared';

export function ok<T>(data: T, message = 'success'): ApiResponse<T> {
  return { code: 0, message, data };
}

export function fail(message: string, code = -1): ApiResponse<null> {
  return { code, message, data: null };
}
