# 项目结构说明

本文档说明改造后的项目结构，包含 Cloudflare Pages 版本和传统服务器版本。

## 📁 完整目录结构

```
wechat-notifier/
│
├── 📂 functions/                       # Cloudflare Pages Functions
│   ├── _middleware.js                 # 全局中间件（CORS、日志、错误处理）
│   └── api/                           # API 路由
│       ├── notify/
│       │   ├── [code].js              # POST /api/notify/:code - 发送通知
│       │   └── [code]/
│       │       └── enhanced.js        # POST /api/notify/:code/enhanced - 增强消息
│       ├── messages/
│       │   └── [code].js              # GET /api/messages/:code - 查询消息
│       ├── configuration/
│       │   └── [code].js              # GET/PUT /api/configuration/:code - 配置管理
│       ├── callback/
│       │   └── [code].js              # GET/POST /api/callback/:code - 企业微信回调
│       ├── validate.js                # POST /api/validate - 验证凭证
│       └── configure.js               # POST /api/configure - 创建配置
│
├── 📂 src/                            # 源代码
│   ├── api/
│   │   └── routes.js                  # Express 路由（传统版本）
│   ├── core/
│   │   ├── database.js                # SQLite 数据库（传统版本）
│   │   ├── database-cf.js             # D1 数据库（Cloudflare 版本）
│   │   ├── crypto.js                  # Node.js 加密（传统版本）
│   │   ├── crypto-cf.js               # Web Crypto API（Cloudflare 版本）
│   │   ├── wechat.js                  # 企业微信 API 封装
│   │   └── wechat-callback.js         # 企业微信回调处理
│   └── services/
│       ├── notifier.js                # 通知服务（传统版本）
│       └── notifier-cf.js             # 通知服务（Cloudflare 版本）
│
├── 📂 public/                         # 静态文件（前端页面）
│   ├── index.html                     # 配置管理页面
│   ├── message-sender.html            # 消息发送测试页面
│   ├── message-viewer.html            # 消息查看页面
│   ├── api-docs.html                  # API 文档
│   ├── enhanced-api-docs.html         # 增强 API 文档
│   ├── script.js                      # 前端脚本
│   ├── script-complete.js             # 完整前端脚本
│   └── message-sender.js              # 消息发送脚本
│
├── 📂 docs/                           # 文档
│   ├── api-reference.md               # API 参考文档
│   ├── deployment-guide.md            # 传统部署指南
│   ├── cloudflare-deployment.md       # Cloudflare 部署指南
│   ├── migration-guide.md             # 迁移指南
│   ├── environment-variables.md       # 环境变量说明
│   ├── project-structure.md           # 项目结构说明
│   ├── security-best-practices.md     # 安全最佳实践
│   ├── usage-guide.md                 # 使用指南
│   └── message-system-implementation.md # 消息系统实现
│
├── 📂 .github/                        # GitHub 配置
│   └── workflows/                     # CI/CD 工作流
│
├── 📄 server.js                       # Express 服务器入口（传统版本）
├── 📄 schema.sql                      # D1 数据库表结构
├── 📄 wrangler.toml                   # Cloudflare 配置
├── 📄 package.json                    # 项目依赖和脚本
├── 📄 .dev.vars.example               # 本地环境变量示例
├── 📄 .gitignore                      # Git 忽略文件
├── 📄 .gitignore.cloudflare           # Cloudflare 特定忽略文件
│
├── 📄 README.md                       # 主说明文档
├── 📄 README-CLOUDFLARE.md            # Cloudflare 版本说明
├── 📄 QUICKSTART-CLOUDFLARE.md        # Cloudflare 快速开始
├── 📄 DEPLOYMENT-COMPARISON.md        # 部署方式对比
├── 📄 CLOUDFLARE-MIGRATION-SUMMARY.md # 改造总结
├── 📄 CHANGELOG-CLOUDFLARE.md         # Cloudflare 版本更新日志
├── 📄 PROJECT-STRUCTURE.md            # 本文件
│
├── 📄 Dockerfile                      # Docker 镜像（传统版本）
├── 📄 Dockerfile.clawcloud            # ClawCloud Docker 镜像
├── 📄 docker-compose.yml              # Docker Compose 配置
├── 📄 docker-compose.clawcloud.yml    # ClawCloud Compose 配置
├── 📄 netlify.toml                    # Netlify 配置
├── 📄 migrate-db.js                   # 数据库迁移脚本
├── 📄 test-fix.js                     # 测试修复脚本
├── 📄 LICENSE                         # MIT 许可证
└── 📄 CODE_OF_CONDUCT.md              # 行为准则
```

## 🔍 关键文件说明

### Cloudflare Pages 相关

#### `functions/`
Cloudflare Pages Functions 目录，使用文件系统路由：
- `[code].js` - 动态路由参数
- `_middleware.js` - 全局中间件

#### `wrangler.toml`
Cloudflare 项目配置文件：
```toml
name = "wechat-notifier"
compatibility_date = "2024-01-01"
pages_build_output_dir = "public"

[[d1_databases]]
binding = "DB"
database_name = "wechat-notifier-db"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"
```

#### `schema.sql`
D1 数据库表结构定义，用于初始化数据库。

#### `.dev.vars`
本地开发环境变量（不提交到 Git）：
```
ENCRYPTION_KEY=your-encryption-key
```

### 传统服务器相关

#### `server.js`
Express 服务器入口文件，处理所有 HTTP 请求。

#### `src/api/routes.js`
Express 路由定义，包含所有 API 端点。

#### `src/core/database.js`
SQLite 数据库操作封装。

#### `Dockerfile`
Docker 镜像构建文件。

#### `docker-compose.yml`
Docker Compose 配置，用于一键部署。

### 共享文件

#### `public/`
静态文件目录，包含前端页面，两种部署方式共享。

#### `src/core/wechat.js`
企业微信 API 封装，两种版本共享核心逻辑。

## 📊 代码组织原则

### 1. 版本隔离
- 传统版本：`database.js`, `crypto.js`, `notifier.js`
- Cloudflare 版本：`database-cf.js`, `crypto-cf.js`, `notifier-cf.js`
- 后缀 `-cf` 表示 Cloudflare 版本

### 2. 功能模块化
- `core/` - 核心功能（数据库、加密、企业微信）
- `services/` - 业务逻辑（通知服务）
- `api/` - API 路由

### 3. 文档完善
- 每个功能都有对应文档
- 分为快速开始、详细指南、参考文档三个层次

## 🔄 数据流

### Cloudflare Pages 版本

```
用户请求
  ↓
Cloudflare Edge (全球节点)
  ↓
Pages Functions (_middleware.js)
  ↓
API 路由 (functions/api/...)
  ↓
业务逻辑 (notifier-cf.js)
  ↓
数据库 (D1) / 缓存 (KV)
  ↓
企业微信 API
  ↓
响应返回
```

### 传统服务器版本

```
用户请求
  ↓
Nginx/Apache (可选)
  ↓
Express Server (server.js)
  ↓
路由处理 (routes.js)
  ↓
业务逻辑 (notifier.js)
  ↓
数据库 (SQLite)
  ↓
企业微信 API
  ↓
响应返回
```

## 🎯 开发工作流

### Cloudflare Pages

1. **本地开发**
   ```bash
   npm run dev
   # 访问 http://localhost:8788
   ```

2. **测试**
   ```bash
   # 测试 API
   curl http://localhost:8788/api/...
   ```

3. **部署**
   ```bash
   npm run deploy
   # 或通过 Git push 自动部署
   ```

### 传统服务器

1. **本地开发**
   ```bash
   npm start
   # 访问 http://localhost:12121
   ```

2. **测试**
   ```bash
   # 测试 API
   curl http://localhost:12121/api/...
   ```

3. **部署**
   ```bash
   # Docker
   docker-compose up -d
   
   # 或直接运行
   npm start
   ```

## 📦 依赖管理

### Cloudflare 版本依赖

```json
{
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

最小化依赖，大部分功能使用 Web 标准 API。

### 传统版本依赖

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "axios": "^1.5.0",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0",
    "wxcrypt": "^1.4.3",
    "xml2js": "^0.6.2"
  }
}
```

## 🔧 配置文件

### Cloudflare
- `wrangler.toml` - 主配置
- `.dev.vars` - 本地环境变量

### 传统服务器
- `.env` - 环境变量
- `docker-compose.yml` - Docker 配置

## 📚 文档结构

```
docs/
├── 快速开始
│   ├── QUICKSTART-CLOUDFLARE.md
│   └── deployment-guide.md
│
├── 详细指南
│   ├── cloudflare-deployment.md
│   ├── migration-guide.md
│   └── usage-guide.md
│
├── 参考文档
│   ├── api-reference.md
│   ├── environment-variables.md
│   └── project-structure.md
│
└── 技术文档
    ├── message-system-implementation.md
    └── security-best-practices.md
```

## 🎓 学习路径

### 新手入门
1. 阅读 `README.md`
2. 选择部署方式（查看 `DEPLOYMENT-COMPARISON.md`）
3. 跟随快速开始指南部署

### 深入了解
1. 阅读 API 参考文档
2. 了解项目结构（本文档）
3. 查看源代码实现

### 高级定制
1. 阅读技术实现文档
2. 修改源代码
3. 贡献代码

## 🔄 版本演进

- **v1.x**: 基础功能
- **v2.x**: 传统 Node.js + SQLite 版本
- **v3.x**: 增加 Cloudflare Pages 支持（当前）

## 🤝 贡献指南

贡献代码时请注意：
1. 保持两个版本的功能一致性
2. 更新相关文档
3. 添加必要的测试
4. 遵循代码风格

---

**企业微信通知服务** | 清晰结构 · 易于维护 · 持续演进
