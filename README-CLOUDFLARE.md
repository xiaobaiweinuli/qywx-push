# 企业微信通知服务 - Cloudflare Pages 版本

<p align="center">
  <img src="https://img.shields.io/badge/Cloudflare-Pages-orange.svg">
  <img src="https://img.shields.io/badge/Database-D1-blue.svg">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg">
  <img src="https://img.shields.io/badge/WeChat-Enterprise-red.svg">
</p>

## 🌟 Cloudflare 版本特性

这是企业微信通知服务的 Cloudflare Pages 版本，专为无服务器架构优化：

- ⚡ **全球边缘部署** - 部署在 Cloudflare 全球 CDN 网络
- 💾 **D1 数据库** - 使用 Cloudflare D1 SQLite 数据库
- 🔄 **KV 缓存** - Access Token 缓存到 Workers KV
- 💰 **零成本运行** - 慷慨的免费额度，适合中小型应用
- 🚀 **自动扩展** - 无需担心服务器容量
- 🔒 **内置安全** - DDoS 防护、自动 HTTPS
- 🌍 **低延迟** - 就近响应，全球访问快速

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd wechat-notifier
```

### 2. 安装依赖

```bash
npm install
```

### 3. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 4. 登录 Cloudflare

```bash
wrangler login
```

### 5. 创建 D1 数据库

```bash
npm run db:create
```

记录输出的 `database_id`，更新 `wrangler.toml`。

### 6. 初始化数据库

```bash
npm run db:init
```

### 7. 创建 KV 命名空间

```bash
npm run kv:create
```

记录输出的 KV `id`，更新 `wrangler.toml`。

### 8. 配置环境变量

创建 `.dev.vars` 文件：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，设置加密密钥：

```
ENCRYPTION_KEY=your-secure-random-string-at-least-32-characters
```

### 9. 本地开发

```bash
npm run dev
```

访问 `http://localhost:8788`

### 10. 部署到 Cloudflare

```bash
npm run deploy
```

## 📁 项目结构

```
.
├── functions/              # Cloudflare Pages Functions
│   ├── _middleware.js     # 全局中间件
│   └── api/               # API 路由
│       ├── notify/        # 消息发送
│       ├── messages/      # 消息查询
│       ├── configuration/ # 配置管理
│       └── callback/      # 企业微信回调
├── public/                # 静态文件（前端页面）
├── src/
│   ├── core/
│   │   ├── database-cf.js # D1 数据库适配器
│   │   └── crypto-cf.js   # Web Crypto API 加密
│   └── services/
│       └── notifier-cf.js # 通知服务（Cloudflare 版）
├── schema.sql             # 数据库表结构
├── wrangler.toml          # Cloudflare 配置
└── package.json
```

## 🔧 配置说明

### wrangler.toml

主要配置项：

```toml
name = "wechat-notifier"                    # 项目名称
compatibility_date = "2024-01-01"           # 兼容性日期
pages_build_output_dir = "public"           # 静态文件目录

[[d1_databases]]
binding = "DB"                              # 数据库绑定名
database_name = "wechat-notifier-db"
database_id = "your-database-id-here"       # 替换为实际 ID

[[kv_namespaces]]
binding = "CACHE"                           # KV 绑定名
id = "your-kv-id-here"                     # 替换为实际 ID
```

### 环境变量

在 Cloudflare Dashboard 中配置：

- `ENCRYPTION_KEY`: 用于加密敏感信息的密钥

## 📖 API 文档

### 基础 URL

```
https://your-project.pages.dev
```

### 主要端点

#### 1. 创建配置

```http
POST /api/configure
Content-Type: application/json

{
  "corpid": "企业ID",
  "corpsecret": "应用Secret",
  "agentid": 应用ID,
  "touser": "接收人",
  "description": "配置描述"
}
```

#### 2. 发送通知

```http
POST /api/notify/:code
Content-Type: application/json

{
  "title": "标题",
  "content": "内容"
}
```

#### 3. 发送增强消息

```http
POST /api/notify/:code/enhanced
Content-Type: application/json

{
  "type": "textcard",
  "title": "标题",
  "description": "描述",
  "url": "链接",
  "btntxt": "按钮文字"
}
```

#### 4. 查询消息

```http
GET /api/messages/:code?page=1&limit=20&startDate=2024-01-01
```

#### 5. 获取配置

```http
GET /api/configuration/:code
```

完整 API 文档请参考 [docs/api-reference.md](./docs/api-reference.md)

## 🔒 安全最佳实践

1. **保护加密密钥**
   - 使用强随机字符串（至少 32 字符）
   - 不要提交到代码仓库
   - 仅在 Cloudflare Dashboard 中配置

2. **访问控制**
   - 考虑添加 API 密钥验证
   - 使用 Cloudflare Access 保护管理界面
   - 配置适当的 CORS 策略

3. **数据保护**
   - 敏感信息加密存储
   - 定期备份 D1 数据库
   - 监控异常访问模式

## 📊 数据库管理

### 查询数据

```bash
wrangler d1 execute wechat-notifier-db --command "SELECT * FROM configurations"
```

### 备份数据库

```bash
wrangler d1 export wechat-notifier-db --output backup.sql
```

### 恢复数据库

```bash
wrangler d1 execute wechat-notifier-db --file backup.sql
```

## 🐛 故障排查

### 常见问题

1. **生成回调URL失败: Unexpected end of JSON input**
   - **原因**：数据库表结构不兼容
   - **快速修复**：
     ```bash
     # Windows
     fix-cloudflare-db.bat
     
     # Mac/Linux
     ./fix-cloudflare-db.sh
     ```
   - **详细说明**：查看 [QUICK-FIX-CN.md](./QUICK-FIX-CN.md)

2. **数据库连接失败**
   - 检查 `wrangler.toml` 中的 `database_id`
   - 确认数据库已创建并初始化

3. **环境变量未生效**
   - 在 Cloudflare Dashboard 中配置环境变量
   - 重新部署项目

4. **函数超时**
   - 优化数据库查询
   - 减少外部 API 调用
   - 使用 KV 缓存

### 查看日志

```bash
wrangler pages deployment tail
```

## 💰 成本说明

Cloudflare 免费额度（每天）：

- Pages: 无限请求
- D1: 100,000 次读取，50,000 次写入
- KV: 100,000 次读取，1,000 次写入
- Workers: 100,000 次请求

对于大多数应用，完全可以在免费额度内运行。

## 🔄 从传统版本迁移

如果你正在使用传统的 Node.js + SQLite 版本，可以：

1. 导出现有 SQLite 数据库
2. 转换为 D1 兼容的 SQL 脚本
3. 导入到 D1 数据库
4. 更新配置并部署

详细迁移指南请参考 [docs/migration-guide.md](./docs/migration-guide.md)

## 📚 相关文档

- [部署指南](./docs/cloudflare-deployment.md)
- [API 参考](./docs/api-reference.md)
- [安全最佳实践](./docs/security-best-practices.md)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- Cloudflare 团队提供的优秀平台
- 企业微信团队的 API 支持
- 所有贡献者和用户

---

**企业微信通知服务 v3.0** | Cloudflare Pages 版本 · 全球边缘部署 · 零运维成本

如果本项目对您有帮助，请给我们一个 ⭐ Star！
