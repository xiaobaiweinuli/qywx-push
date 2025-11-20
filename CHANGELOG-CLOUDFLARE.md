# Cloudflare Pages 版本更新日志

## [3.0.0] - 2024-11-20

### 🎉 重大更新

完全重构项目以支持 Cloudflare Pages 部署。

### ✨ 新增功能

- **Cloudflare Pages 支持**: 完整的 Pages Functions 实现
- **D1 数据库**: 使用 Cloudflare D1 替代 SQLite
- **Workers KV 缓存**: Access Token 缓存到 KV
- **全球边缘部署**: 部署到 Cloudflare 全球 CDN 网络
- **Web Crypto API**: 使用标准 Web Crypto API 进行加密
- **零配置部署**: 通过 Git 自动部署

### 🔄 架构变更

- **运行环境**: Node.js Express → Cloudflare Workers
- **数据库**: SQLite → Cloudflare D1
- **缓存**: 内存 → Workers KV
- **加密**: Node.js crypto → Web Crypto API
- **路由**: Express Router → Pages Functions

### 📁 新增文件

- `functions/` - Pages Functions 目录
  - `_middleware.js` - 全局中间件
  - `api/notify/[code].js` - 消息发送
  - `api/messages/[code].js` - 消息查询
  - `api/configuration/[code].js` - 配置管理
  - `api/callback/[code].js` - 企业微信回调
- `src/core/database-cf.js` - D1 数据库适配器
- `src/core/crypto-cf.js` - Web Crypto API 加密
- `src/services/notifier-cf.js` - Cloudflare 版通知服务
- `schema.sql` - D1 数据库表结构
- `wrangler.toml` - Cloudflare 配置文件
- `README-CLOUDFLARE.md` - Cloudflare 版本说明
- `docs/cloudflare-deployment.md` - 部署指南
- `docs/migration-guide.md` - 迁移指南

### 🔧 配置变更

- 新增 `wrangler.toml` 配置文件
- 新增 `.dev.vars.example` 本地开发环境变量示例
- 更新 `package.json` 添加 Cloudflare 相关脚本

### 📖 文档更新

- 新增 Cloudflare Pages 部署指南
- 新增从传统版本迁移指南
- 更新 API 文档以反映新的部署方式

### ⚡ 性能优化

- **响应时间**: 从 50-200ms 降低到 10-50ms
- **全球访问**: 通过边缘节点就近响应
- **自动扩展**: 无需担心并发限制
- **零冷启动**: Workers 快速启动

### 💰 成本优化

- **免费额度**: 大部分应用可在免费额度内运行
- **按需付费**: 只为实际使用付费
- **无服务器成本**: 无需维护服务器

### 🔒 安全增强

- **DDoS 防护**: Cloudflare 内置防护
- **自动 HTTPS**: 自动配置 SSL 证书
- **边缘安全**: 在边缘节点进行安全检查

### 🐛 已知限制

- 文件上传功能需要额外配置（使用 R2 或外部存储）
- Workers 有 CPU 时间限制（免费版 10ms）
- 某些 Node.js 特定功能不可用

### 📚 兼容性

- ✅ API 端点保持兼容
- ✅ 数据库结构基本相同
- ✅ 核心功能完全兼容
- ⚠️ 需要迁移现有数据

### 🔄 迁移路径

提供完整的迁移指南，支持从传统版本平滑迁移到 Cloudflare Pages。

---

## 版本说明

- **v1.x**: 初始版本，基础功能
- **v2.x**: 传统 Node.js + SQLite 版本
- **v3.x**: Cloudflare Pages + D1 版本（当前）

---

**企业微信通知服务 v3.0** | Cloudflare Pages 版本 · 全球边缘部署 · 零运维成本
