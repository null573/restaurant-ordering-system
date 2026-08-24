# 部署指南

本系统使用 Cloudflare 全栈部署。以下是从零开始的完整部署步骤。

## 前置条件

- Cloudflare 账号（注册 https://dash.cloudflare.com）
- Node.js 22+
- pnpm 10+
- 已 clone 本仓库

## 一、创建 Cloudflare 资源

### 1. 获取 API Token

前往 https://dash.cloudflare.com/profile/api-tokens 创建 API Token，选择模板 **"Edit Cloudflare Workers"**，确保包含以下权限：
- Account - Workers Scripts - Edit
- Account - D1 - Edit
- Account - Workers KV Storage - Edit
- Account - Cloudflare Pages - Edit
- Account - Workers R2 Storage - Edit
- Account - Durable Objects - Edit

记录 Token 值和 Account ID。

### 2. 设置环境变量

```bash
export CLOUDFLARE_API_TOKEN="你的token"
export CLOUDFLARE_ACCOUNT_ID="你的account_id"
```

### 3. 创建 D1 数据库

```bash
cd packages/worker
npx wrangler d1 create restaurant-db
```

将返回的 `database_id` 填入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "restaurant-db"
database_id = "在这里粘贴返回的ID"
```

### 4. 创建 KV 命名空间

```bash
npx wrangler kv namespace create KV
```

将返回的 `id` 填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "KV"
id = "在这里粘贴返回的ID"
```

### 5. 创建 R2 存储桶

```bash
npx wrangler r2 bucket create restaurant-images
```

### 6. 执行数据库迁移

```bash
# 本地开发用
npx wrangler d1 execute restaurant-db --file=src/db/migrations/0001_init.sql

# 远程生产库
npx wrangler d1 execute restaurant-db --remote --file=src/db/migrations/0001_init.sql
```

## 二、配置 Secrets

```bash
# JWT 密钥（随机字符串）
npx wrangler secret put JWT_SECRET
# 输入一个随机字符串，如: my-super-secret-key-2024

# 微信支付配置（可选，上线微信支付前配置）
npx wrangler secret put WECHAT_APP_SECRET
npx wrangler secret put WECHAT_APIV3_KEY
npx wrangler secret put WECHAT_PRIVATE_KEY
```

## 三、修改配置

编辑 `packages/worker/wrangler.toml`：

```toml
[vars]
PUBLIC_R2_DOMAIN = "https://img.yourdomain.com"  # R2 自定义域名
APP_BASE_URL = "https://order.yourdomain.com"     # 前端域名
```

如果使用 R2 自定义域名，在 Cloudflare Dashboard → R2 → restaurant-images → Settings → Public Domain 绑定域名。

## 四、部署后端

```bash
cd packages/worker
npx wrangler deploy
```

部署成功后会输出 Worker URL，如 `https://restaurant-worker.your-account.workers.dev`。

## 五、部署前端

### 方式一：Cloudflare Pages（推荐）

```bash
# 构建前端
cd packages/web
pnpm build

# 创建 Pages 项目并部署
npx wrangler pages project create restaurant-web
npx wrangler pages deploy dist --project-name=restaurant-web
```

### 方式二：自定义域名

在 Cloudflare Pages 项目设置中绑定自定义域名（如 `order.yourdomain.com`）。

### 配置 API 代理

如果前端和后端不同域名，需要在 Pages 项目中设置重写规则（`functions/_middleware.js`）：

```javascript
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
    return fetch(`https://restaurant-worker.your-account.workers.dev${url.pathname}${url.search}`, {
      method: context.request.method,
      headers: context.request.headers,
      body: context.request.body,
    });
  }
  return context.next();
}
```

## 六、初始化系统

部署完成后，调用注册接口创建第一个租户（管理员）：

```bash
curl -X POST https://order.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的餐厅",
    "contactPhone": "13800138000",
    "password": "your-password",
    "managerName": "张老板"
  }'
```

返回的 `accessToken` 用于后续管理操作。

## 七、微信支付配置

1. 在 **管理端 → 设置** 页面填入微信 AppID 和商户号。
2. 在微信公众平台配置授权域名（JSAPI 支付）。
3. 在微信商户平台配置回调 URL：`https://order.yourdomain.com/api/webhook/wechat-pay`
4. 上传商户证书，私钥存为 Worker Secret。

## 八、移动端打包（Capacitor）

### 前置准备
- iOS: macOS + Xcode + Apple Developer 账号
- Android: Android Studio + 签名密钥

### 打包步骤

```bash
# 构建前端
pnpm --filter web build

# 同步到 Capacitor
cd packages/app
npx cap sync

# 打开 Xcode (iOS)
npx cap open ios

# 打开 Android Studio
npx cap open android
```

在 Xcode/Android Studio 中 Archive 并上传到 App Store Connect / Google Play。

### App Store 审核要点
- 应用包含原生功能（蓝牙打印、本地推送、相机拍照），非纯 WebView
- 支付为实体餐饮消费，非 IAP 内购
- 提交时在审核备注中说明应用用途

## 九、GitHub Actions 自动部署

在 GitHub 仓库 Settings → Secrets 中添加：
- `CF_API_TOKEN`: Cloudflare API Token
- `CF_ACCOUNT_ID`: Cloudflare Account ID

推送代码到 `main` 分支将自动触发部署。

## 十、二维码使用流程

1. 管理员登录 → 桌位管理 → 新增桌位（或批量新增）
2. 进入"二维码"页面 → 自动生成所有桌位二维码
3. 点击"批量下载打印" → 打印页面 → 打印
4. 将二维码贴到对应桌位上
5. 顾客微信扫码即可点餐
