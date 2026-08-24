-- ============================================================
-- 餐厅点餐系统 数据库初始化 (共享 D1 + tenant_id 行级隔离)
-- ============================================================

-- 1. 租户表 (餐厅)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  contact_phone TEXT,
  wechat_appid TEXT,
  wechat_mchid TEXT,
  wechat_api_v3_key TEXT,           -- 微信 APIv3 密钥 (加密存储)
  status TEXT NOT NULL DEFAULT 'trial',  -- trial/active/expired/suspended
  trial_started_at TEXT,
  trial_days INTEGER NOT NULL DEFAULT 7,
  plan_price_fen INTEGER NOT NULL DEFAULT 9900,
  plan_cycle_days INTEGER NOT NULL DEFAULT 30,
  paid_until TEXT,
  settings TEXT,                     -- JSON: 餐厅自定义设置
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. 租户用户 (管理员/店员)
CREATE TABLE IF NOT EXISTS tenant_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'manager',  -- owner/manager/bar/kitchen
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_tu_tenant ON tenant_users(tenant_id);

-- 3. 菜品分类
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cat_tenant ON categories(tenant_id);

-- 4. 菜品
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_fen INTEGER NOT NULL,
  image_key TEXT,
  image_url TEXT,
  available INTEGER NOT NULL DEFAULT 1,
  stock INTEGER NOT NULL DEFAULT -1,  -- -1 表示无限
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_dish_tenant ON dishes(tenant_id, category_id);

-- 5. 桌位
CREATE TABLE IF NOT EXISTS desks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  number TEXT NOT NULL,
  name TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  qr_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',  -- idle/occupied/paying
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, number)
);
CREATE INDEX IF NOT EXISTS idx_desk_tenant ON desks(tenant_id);

-- 6. 订单
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  desk_id TEXT NOT NULL,
  desk_number TEXT NOT NULL,
  order_no TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending/paid/cooking/served/closed/cancelled
  settle_type TEXT,                          -- self/bar
  total_fen INTEGER NOT NULL DEFAULT 0,
  pay_method TEXT,                           -- wechat/cash
  paid_fen INTEGER NOT NULL DEFAULT 0,
  wechat_trade_no TEXT,
  openid TEXT,                              -- 微信 openid
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  closed_at TEXT,
  FOREIGN KEY (desk_id) REFERENCES desks(id)
);
CREATE INDEX IF NOT EXISTS idx_order_tenant_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_order_desk ON orders(tenant_id, desk_id, status);

-- 7. 订单明细
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  dish_id TEXT NOT NULL,
  dish_name TEXT NOT NULL,
  price_fen INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'new',  -- new/cooking/done
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE INDEX IF NOT EXISTS idx_oi_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oi_tenant ON order_items(tenant_id);

-- 8. 租户订阅支付记录 (B2B)
CREATE TABLE IF NOT EXISTS subscription_payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  out_trade_no TEXT UNIQUE NOT NULL,
  amount_fen INTEGER NOT NULL,
  cycle_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',  -- unpaid/paid
  wechat_trade_no TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sp_tenant ON subscription_payments(tenant_id);

-- 9. 打印记录
CREATE TABLE IF NOT EXISTS print_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  printer_type TEXT,
  printed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. 刷新令牌
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id);
