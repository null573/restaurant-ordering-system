import type { D1Database, KVNamespace, R2Bucket, DurableObjectNamespace } from '@cloudflare/workers-types';

/**
 * Worker 环境变量绑定
 */
export interface Env {
  // D1 数据库
  DB: D1Database;
  // KV 缓存
  KV: KVNamespace;
  // R2 图片存储
  R2: R2Bucket;
  // Durable Objects
  DESK_ROOM: DurableObjectNamespace;

  // Secrets (通过 wrangler secret put 设置)
  JWT_SECRET: string;
  WECHAT_APP_SECRET: string;
  WECHAT_APIV3_KEY: string;
  WECHAT_PRIVATE_KEY: string;       // 商户私钥 PEM
  WECHAT_PLATFORM_CERT?: string;     // 平台证书

  // 环境变量
  PUBLIC_R2_DOMAIN: string;
  APP_BASE_URL: string;
  DEFAULT_TRIAL_DAYS: string;
  DEFAULT_PLAN_PRICE_FEN: string;
  DEFAULT_PLAN_CYCLE_DAYS: string;
}

/**
 * Hono 变量 (中间件注入)
 */
export interface AppVars {
  tenantId: string;
  userId: string;
  role: string;
  jwtPayload: {
    tenantId: string;
    userId: string;
    role: string;
    type: string;
    exp: number;
    iat: number;
  };
}
