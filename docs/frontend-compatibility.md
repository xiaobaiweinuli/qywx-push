# 前端页面兼容性说明

## ✅ Cloudflare Pages 完全兼容

本项目的前端页面使用相对路径调用 API，完全兼容 Cloudflare Pages 部署。

## 📋 API 路径映射

### 前端调用路径 → Functions 文件

| 前端 API 路径 | Functions 文件 | 说明 |
|--------------|---------------|------|
| `POST /api/configure` | `functions/api/configure.js` | 创建配置 |
| `POST /api/validate` | `functions/api/validate.js` | 验证凭证 |
| `POST /api/notify/:code` | `functions/api/notify/[code].js` | 发送通知 |
| `POST /api/notify/:code/enhanced` | `functions/api/notify/[code]/enhanced.js` | 增强消息 |
| `GET /api/configuration/:code` | `functions/api/configuration/[code].js` | 获取配置 |
| `PUT /api/configuration/:code` | `functions/api/configuration/[code].js` | 更新配置 |
| `GET /api/messages/:code` | `functions/api/messages/[code].js` | 查询消息 |
| `GET /api/callback/:code` | `functions/api/callback/[code].js` | 回调验证 |
| `POST /api/callback/:code` | `functions/api/callback/[code].js` | 回调消息 |

### 静态文件路径

| 前端页面 | 文件位置 | 访问路径 |
|---------|---------|---------|
| 首页 | `public/index.html` | `/` 或 `/index.html` |
| 消息发送 | `public/message-sender.html` | `/message-sender.html` |
| 消息查看 | `public/message-viewer.html` | `/message-viewer.html` |
| API 文档 | `public/api-docs.html` | `/api-docs.html` |
| 增强 API | `public/enhanced-api-docs.html` | `/enhanced-api-docs.html` |

## 🧪 本地测试

### 1. 启动本地开发服务器

```bash
npm run dev
```

访问 `http://localhost:8788`

### 2. 测试前端页面

- **首页**: http://localhost:8788/
- **消息发送**: http://localhost:8788/message-sender.html
- **消息查看**: http://localhost:8788/message-viewer.html

### 3. 测试 API 调用

打开浏览器开发者工具（F12），查看 Network 标签：

1. 在首页填写配置信息
2. 点击"生成回调URL"
3. 查看请求：
   - 请求 URL: `http://localhost:8788/api/generate-callback`
   - 请求方法: `POST`
   - 状态码: `200` 或 `201`

## 🚀 Cloudflare Pages 部署后

### 访问路径

假设你的项目部署到 `https://wechat-notifier.pages.dev`

- **首页**: https://wechat-notifier.pages.dev/
- **消息发送**: https://wechat-notifier.pages.dev/message-sender.html
- **API 端点**: https://wechat-notifier.pages.dev/api/notify/:code

### 验证步骤

#### 1. 验证静态页面

```bash
curl https://wechat-notifier.pages.dev/
```

应该返回 HTML 内容。

#### 2. 验证 API 端点

```bash
# 测试配置创建
curl -X POST https://wechat-notifier.pages.dev/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "corpid": "your-corpid",
    "corpsecret": "your-secret",
    "agentid": 1000001,
    "touser": ["user1"],
    "description": "测试配置"
  }'
```

应该返回 JSON 响应，包含 `code` 字段。

#### 3. 验证前端调用

1. 打开 https://wechat-notifier.pages.dev/
2. 打开浏览器开发者工具（F12）
3. 填写配置信息并提交
4. 在 Network 标签查看请求：
   - 请求 URL 应该是 `https://wechat-notifier.pages.dev/api/...`
   - 状态码应该是 `200` 或 `201`

## 🔍 常见问题

### Q1: 前端页面能访问，但 API 调用失败？

**可能原因**：
- D1 数据库未绑定
- KV 命名空间未绑定
- 环境变量未配置

**解决方法**：
1. 检查 `wrangler.toml` 配置
2. 在 Cloudflare Dashboard 检查绑定
3. 查看 Functions 日志：`wrangler pages deployment tail`

### Q2: API 返回 404？

**可能原因**：
- Functions 文件路径不正确
- 路由参数不匹配

**解决方法**：
1. 检查 `functions/` 目录结构
2. 确认文件名使用 `[code].js` 格式（方括号表示动态参数）
3. 重新部署：`npm run deploy`

### Q3: CORS 错误？

**可能原因**：
- 中间件未正确配置 CORS 头

**解决方法**：
检查 `functions/_middleware.js` 是否包含 CORS 头：

```javascript
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### Q4: 本地测试正常，部署后失败？

**可能原因**：
- 环境变量未在生产环境配置
- 数据库未初始化

**解决方法**：
1. 在 Cloudflare Dashboard 配置环境变量
2. 运行数据库初始化：`wrangler d1 execute wechat-notifier-db --file=./schema.sql`

## 📊 路径解析示例

### 示例 1: 发送通知

**前端代码**：
```javascript
const response = await fetch('/api/notify/abc123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '测试', content: '内容' })
});
```

**路径解析**：
- 本地: `http://localhost:8788/api/notify/abc123`
- 生产: `https://your-project.pages.dev/api/notify/abc123`

**匹配的 Function**：
- 文件: `functions/api/notify/[code].js`
- 参数: `params.code = 'abc123'`

### 示例 2: 查询消息

**前端代码**：
```javascript
const response = await fetch(`/api/messages/${code}?page=1&limit=20`);
```

**路径解析**：
- 本地: `http://localhost:8788/api/messages/abc123?page=1&limit=20`
- 生产: `https://your-project.pages.dev/api/messages/abc123?page=1&limit=20`

**匹配的 Function**：
- 文件: `functions/api/messages/[code].js`
- 参数: `params.code = 'abc123'`
- 查询参数: `url.searchParams.get('page') = '1'`

## ✅ 兼容性检查清单

部署前检查：

- [ ] 所有 API 路径使用相对路径（以 `/` 开头）
- [ ] Functions 文件结构正确
- [ ] `wrangler.toml` 配置完整
- [ ] D1 数据库已创建并初始化
- [ ] KV 命名空间已创建
- [ ] 环境变量已配置
- [ ] 本地测试通过

部署后检查：

- [ ] 静态页面可以访问
- [ ] API 端点返回正确响应
- [ ] 前端可以成功调用 API
- [ ] 数据库操作正常
- [ ] 缓存功能正常

## 🎯 总结

**前端页面完全兼容 Cloudflare Pages**，因为：

1. ✅ 使用相对路径，自动适配域名
2. ✅ Functions 路由与前端 API 调用完全匹配
3. ✅ 静态文件自动部署到 CDN
4. ✅ 无需修改任何前端代码
5. ✅ 本地开发和生产环境行为一致

只需确保：
- D1 数据库正确配置
- KV 命名空间正确绑定
- 环境变量正确设置

---

**企业微信通知服务** | 前端完全兼容 · 无缝部署 · 开箱即用
