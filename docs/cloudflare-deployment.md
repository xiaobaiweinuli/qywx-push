# Cloudflare Pages 部署指南

本文档介绍如何将企业微信通知服务部署到 Cloudflare Pages，使用 D1 数据库。

## 📋 前置要求

1. Cloudflare 账号
2. Node.js 18+ 和 npm
3. Wrangler CLI 工具

## 🚀 快速开始

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 D1 数据库

```bash
npm run db:create
```

记录输出的 `database_id`，并更新 `wrangler.toml` 文件中的 `database_id`。

### 4. 初始化数据库表结构

```bash
npm run db:init
```

### 5. 创建 KV 命名空间（用于缓存）

```bash
npm run kv:create
```

记录输出的 KV `id`，并更新 `wrangler.toml` 文件中的 KV `id`。

### 6. 配置环境变量

在 Cloudflare Dashboard 中设置环境变量：

1. 进入 Pages 项目设置
2. 找到 "Environment variables" 部分
3. 添加以下变量：

```
ENCRYPTION_KEY=your-secure-encryption-key-here
```

**重要**: 请使用强随机字符串作为加密密钥，至少 32 个字符。

### 7. 本地开发

创建 `.dev.vars` 文件（从 `.dev.vars.example` 复制）：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 并填入加密密钥，然后启动本地开发服务器：

```bash
npm run dev
```

访问 `http://localhost:8788` 查看应用。

### 8. 部署到 Cloudflare Pages

#### 方式一：通过 Git 自动部署（推荐）

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接你的 Git 仓库
4. 配置构建设置：
   - 构建命令：`npm run build`
   - 构建输出目录：`public`
   - 根目录：`/`
5. 在项目设置中绑定 D1 数据库和 KV 命名空间
6. 添加环境变量 `ENCRYPTION_KEY`
7. 触发部署

#### 方式二：通过 Wrangler CLI 部署

```bash
npm run deploy
```

## 📊 数据库管理

### 查询数据库

```bash
wrangler d1 execute wechat-notifier-db --command "SELECT * FROM configurations LIMIT 10"
```

### 备份数据库

```bash
wrangler d1 export wechat-notifier-db --output backup.sql
```

### 恢复数据库

```bash
wrangler d1 execute wechat-notifier-db --file backup.sql
```

## 🔧 配置说明

### wrangler.toml 配置项

```toml
name = "wechat-notifier"                    # 项目名称
compatibility_date = "2024-01-01"           # 兼容性日期
pages_build_output_dir = "public"           # 静态文件目录

[[d1_databases]]
binding = "DB"                              # 在代码中通过 env.DB 访问
database_name = "wechat-notifier-db"        # 数据库名称
database_id = "your-database-id"            # 数据库 ID

[[kv_namespaces]]
binding = "CACHE"                           # 在代码中通过 env.CACHE 访问
id = "your-kv-id"                          # KV 命名空间 ID
```

## 🌐 API 端点

部署后，所有 API 端点将通过以下格式访问：

```
https://your-project.pages.dev/api/...
```

例如：
- 发送通知：`POST https://your-project.pages.dev/api/notify/:code`
- 查询消息：`GET https://your-project.pages.dev/api/messages/:code`
- 配置管理：`GET/PUT https://your-project.pages.dev/api/configuration/:code`

## 📈 性能优化

### 1. 使用 KV 缓存 Access Token

Access Token 会自动缓存到 KV 中，有效期内不会重复请求企业微信 API。

### 2. D1 查询优化

- 已创建必要的索引
- 使用分页查询避免大量数据传输
- 合理使用查询条件减少扫描范围

### 3. 边缘计算优势

Cloudflare Pages 部署在全球边缘节点，提供：
- 低延迟响应
- 自动 HTTPS
- DDoS 防护
- 无限带宽

## 🔒 安全建议

1. **加密密钥管理**
   - 使用强随机字符串
   - 不要提交到代码仓库
   - 定期轮换密钥

2. **访问控制**
   - 考虑添加 API 密钥验证
   - 使用 Cloudflare Access 保护管理界面
   - 限制 CORS 来源

3. **数据保护**
   - 敏感信息加密存储
   - 定期备份数据库
   - 监控异常访问

## 🐛 故障排查

### 数据库连接失败

检查 `wrangler.toml` 中的 `database_id` 是否正确。

### 环境变量未生效

确保在 Cloudflare Dashboard 的项目设置中正确配置了环境变量。

### 函数超时

Cloudflare Workers 有执行时间限制（免费版 10ms CPU 时间），优化数据库查询和外部 API 调用。

### 查看日志

```bash
wrangler pages deployment tail
```

## 💰 成本估算

Cloudflare Pages 提供慷慨的免费额度：

- **Pages**: 无限请求（免费）
- **D1**: 每天 100,000 次读取，50,000 次写入（免费）
- **KV**: 每天 100,000 次读取，1,000 次写入（免费）
- **Workers**: 每天 100,000 次请求（免费）

对于大多数中小型应用，完全可以在免费额度内运行。

## 📚 相关资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Workers KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 🆘 获取帮助

如遇到问题，可以：

1. 查看 [Cloudflare Community](https://community.cloudflare.com/)
2. 提交 GitHub Issue
3. 查看项目文档

---

**企业微信通知服务 v3.0** | Cloudflare Pages 版本 · 全球边缘部署 · 零运维成本
