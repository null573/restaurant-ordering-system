# 餐厅点餐系统 (多租户)

扫码点餐 + 吧台厨房实时同步 + 微信支付 + 多租户 SaaS 架构。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Cloudflare Workers + Hono + D1 + KV + R2 + Durable Objects |
| 前端 | Vue 3 + TypeScript + Vite + Vant 4 (PWA) |
| 移动端 | Capacitor 6 (iOS + Android) |
| 数据库 | Cloudflare D1 (SQLite, 共享库 + tenant_id 行级隔离) |
| 实时同步 | Durable Objects + Hibernation WebSocket |
| 支付 | 微信支付 V3 (JSAPI / H5 / Native) |
| CI/CD | GitHub Actions + Wrangler |

## 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 创建 Cloudflare 资源
```bash
# 登录 (或用 API Token)
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create restaurant-db
# 将返回的 database_id 填入 packages/worker/wrangler.toml

# 创建 KV
npx wrangler kv namespace create KV
# 将返回的 id 填入 wrangler.toml

# 创建 R2
npx wrangler r2 bucket create restaurant-images
```

### 3. 执行数据库迁移
```bash
cd packages/worker
npx wrangler d1 execute restaurant-db --file=src/db/migrations/0001_init.sql
# 远程:
npx wrangler d1 execute restaurant-db --remote --file=src/db/migrations/0001_init.sql
```

### 4. 配置 Secrets
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put WECHAT_APP_SECRET
npx wrangler secret put WECHAT_APIV3_KEY
npx wrangler secret put WECHAT_PRIVATE_KEY
```

### 5. 修改 wrangler.toml
将 `database_id` 和 KV `id` 填入 `packages/worker/wrangler.toml`。
修改 `PUBLIC_R2_DOMAIN` 和 `APP_BASE_URL` 为你的域名。

### 6. 本地开发
```bash
# 后端
pnpm dev:worker

# 前端
pnpm dev:web
```

### 7. 部署
```bash
# 部署后端 Worker
pnpm deploy:worker

# 构建并部署前端到 Cloudflare Pages
pnpm deploy:web
```

## 项目结构

```
restaurant-ordering/
├── packages/
│   ├── worker/          # Cloudflare Worker 后端
│   ├── web/             # Vue PWA 前端
│   ├── app/             # Capacitor 移动端壳
│   └── shared/          # 共享类型
├── .github/workflows/   # CI/CD
└── docs/                # 文档
```

## 功能清单

- [x] 顾客微信扫码点餐
- [x] 吧台/厨房实时同步订单 (WebSocket)
- [x] 支持电脑/手机/平板 (响应式 PWA)
- [x] 顾客自助微信结账 + 吧台现金结账 (自动找零)
- [x] 管理员设置菜品名称/价格/图片 (R2 存储)
- [x] 桌位管理 + 二维码自动生成下载打印
- [x] 桌位状态实时看板 (空闲/有客/结账中)
- [x] 结算明细单打印
- [x] 多租户数据隔离 (tenant_id 行级隔离)
- [x] 试用天数/付费金额可配置
- [x] 微信收款 (JSAPI/H5/Native)
- [x] 用户权限管理 (owner/manager/bar/kitchen)
- [x] Capacitor 打包 iOS/Android 应用

## 部署到应用商店

1. 修改 `packages/app/capacitor.config.ts` 中的 `appId`
2. 构建前端: `pnpm --filter web build`
3. 同步: `cd packages/app && npx cap sync`
4. 打开 Xcode/Android Studio 打包上传

### App Store 审核注意
- 本 App 包含原生功能 (蓝牙打印/本地推送/相机)，非纯 WebView
- 支付为实体餐饮消费，非 IAP
- 提交审核时在备注中说明

## License

MIT
