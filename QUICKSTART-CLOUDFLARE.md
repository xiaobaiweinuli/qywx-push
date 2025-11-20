# 🚀 Cloudflare Pages 快速开始

5 分钟部署企业微信通知服务到 Cloudflare Pages！

## 📋 准备工作

- Cloudflare 账号（[免费注册](https://dash.cloudflare.com/sign-up)）
- Node.js 18+ 和 npm
- Git

## ⚡ 快速部署

### 1️⃣ 克隆项目

```bash
git clone <repository-url>
cd wechat-notifier
```

### 2️⃣ 安装 Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 3️⃣ 创建数据库

```bash
npm run db:create
```

**重要**: 复制输出的 `database_id`，编辑 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "wechat-notifier-db"
database_id = "粘贴你的-database-id-这里"  # ← 替换这里
```

### 4️⃣ 初始化数据库

```bash
npm run db:init
```

### 5️⃣ 创建 KV 缓存

```bash
npm run kv:create
```

**重要**: 复制输出的 KV `id`，编辑 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "粘贴你的-kv-id-这里"  # ← 替换这里
```

### 6️⃣ 配置加密密钥

创建 `.dev.vars` 文件：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，设置强随机密钥：

```
ENCRYPTION_KEY=your-super-secret-key-at-least-32-characters-long
```

💡 生成随机密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7️⃣ 本地测试

```bash
npm run dev
```

访问 http://localhost:8788 测试功能。

**测试前端页面**：
- 首页（配置管理）: http://localhost:8788/
- 消息发送测试: http://localhost:8788/message-sender.html
- 消息查看: http://localhost:8788/message-viewer.html
- API 文档: http://localhost:8788/api-docs.html

**测试 API 调用**：
打开浏览器开发者工具（F12），在首页填写配置信息，查看 Network 标签验证 API 调用是否成功。

### 8️⃣ 部署到 Cloudflare

```bash
npm run deploy
```

### 9️⃣ 配置生产环境变量

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入你的 Pages 项目
3. 点击 "Settings" → "Environment variables"
4. 添加变量：
   - 名称: `ENCRYPTION_KEY`
   - 值: 你的加密密钥（与 `.dev.vars` 中相同）
   - 环境: Production

### 🔟 开始使用

你的服务已部署到：`https://your-project.pages.dev`

**访问前端页面**：
- 配置管理: https://your-project.pages.dev/
- 消息发送: https://your-project.pages.dev/message-sender.html
- 消息查看: https://your-project.pages.dev/message-viewer.html

**前端页面完全可用**，所有 API 调用会自动路由到 Cloudflare Functions！

#### 创建第一个配置

```bash
curl -X POST https://your-project.pages.dev/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "corpid": "你的企业ID",
    "corpsecret": "你的应用Secret",
    "agentid": 你的应用ID,
    "touser": "@all",
    "description": "测试配置"
  }'
```

返回示例：
```json
{
  "code": "cf_abc123xyz",
  "message": "配置创建成功"
}
```

#### 发送第一条消息

```bash
curl -X POST https://your-project.pages.dev/api/notify/cf_abc123xyz \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试通知",
    "content": "Hello from Cloudflare Pages!"
  }'
```

## 🎉 完成！

你的企业微信通知服务已成功部署到 Cloudflare Pages！

## 📚 下一步

- 📖 阅读 [完整文档](./README-CLOUDFLARE.md)
- 🔧 查看 [API 参考](./docs/api-reference.md)
- 🔒 了解 [安全最佳实践](./docs/security-best-practices.md)
- 🌐 访问 Web 管理界面：`https://your-project.pages.dev`

## 🐛 遇到问题？

### 数据库连接失败
```bash
# 检查数据库是否创建成功
wrangler d1 list

# 验证 wrangler.toml 中的 database_id
```

### 部署失败
```bash
# 查看详细日志
wrangler pages deployment tail

# 重新部署
npm run deploy
```

### 环境变量未生效
确保在 Cloudflare Dashboard 中正确配置了 `ENCRYPTION_KEY`。

## 💡 提示

- 免费额度足够大多数应用使用
- 全球边缘部署，响应速度快
- 自动 HTTPS，无需配置证书
- 支持自定义域名

## 🆘 获取帮助

- [Cloudflare Community](https://community.cloudflare.com/)
- [项目 Issues](https://github.com/your-repo/issues)
- [完整文档](./docs/)

---

**企业微信通知服务 v3.0** | 5 分钟部署 · 全球加速 · 零运维成本
