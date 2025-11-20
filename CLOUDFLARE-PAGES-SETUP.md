# 🌐 Cloudflare Pages 部署配置指南

## ✅ GitHub 分支已创建

你的 `cloudflare` 分支已成功推送到 GitHub！

**仓库**: xiaobaiweinuli/qywx-push  
**分支**: cloudflare  
**最新提交**: 46193b8

---

## 🚀 在 Cloudflare Pages 中配置部署

### 步骤 1: 访问 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧菜单 "Workers & Pages"
3. 点击 "Create application"
4. 选择 "Pages" 标签
5. 点击 "Connect to Git"

### 步骤 2: 连接 GitHub 仓库

1. 选择 "GitHub"
2. 授权 Cloudflare 访问你的 GitHub
3. 选择仓库: `xiaobaiweinuli/qywx-push`
4. 点击 "Begin setup"

### 步骤 3: 配置构建设置

**重要配置**：

```
项目名称: wechat-notifier
生产分支: cloudflare
构建命令: npm run build
构建输出目录: public
根目录: /
```

**详细配置**：

| 配置项 | 值 |
|--------|-----|
| Project name | `wechat-notifier` |
| Production branch | `cloudflare` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `public` |
| Root directory | `/` |

### 步骤 4: 配置环境变量

在 "Environment variables" 部分添加：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `ENCRYPTION_KEY` | 你的加密密钥（从 `.dev.vars` 复制） | Production |
| `NODE_VERSION` | `18` | Production |

**获取加密密钥**：
```bash
# 查看 .dev.vars 文件
cat .dev.vars
```

### 步骤 5: 绑定 D1 数据库

1. 在项目设置页面，找到 "Settings" → "Functions"
2. 滚动到 "D1 database bindings"
3. 点击 "Add binding"
4. 配置：
   - Variable name: `DB`
   - D1 database: 选择 `wechat-notifier-db`
5. 点击 "Save"

### 步骤 6: 绑定 KV 命名空间

1. 在同一页面，找到 "KV namespace bindings"
2. 点击 "Add binding"
3. 配置：
   - Variable name: `CACHE`
   - KV namespace: 选择 `CACHE`
4. 点击 "Save"

### 步骤 7: 触发部署

1. 点击 "Save and Deploy"
2. 等待部署完成（通常 1-2 分钟）
3. 部署成功后会显示访问 URL

---

## 📋 部署后检查清单

### 1. 验证部署状态

- [ ] 部署状态显示 "Success"
- [ ] 获得访问 URL（如 `https://wechat-notifier.pages.dev`）

### 2. 验证绑定

在 Settings → Functions 中检查：
- [ ] D1 database binding: `DB` → `wechat-notifier-db`
- [ ] KV namespace binding: `CACHE` → `CACHE`

### 3. 验证环境变量

在 Settings → Environment variables 中检查：
- [ ] `ENCRYPTION_KEY` 已设置
- [ ] `NODE_VERSION` 已设置（可选）

### 4. 测试访问

```bash
# 测试首页
curl https://your-project.pages.dev/

# 测试 API
curl -X POST https://your-project.pages.dev/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "corpid": "test",
    "corpsecret": "test",
    "agentid": 1000001,
    "touser": "user1",
    "description": "测试"
  }'
```

---

## 🔧 如果部署失败

### 常见问题 1: 构建失败

**错误**: `npm ci` 失败

**解决方案**: 已修复！我们已经更新了 `package-lock.json`

### 常见问题 2: 找不到 D1 数据库

**错误**: Database not found

**解决方案**:
1. 确认 D1 数据库已创建
2. 在 Cloudflare Pages 设置中正确绑定
3. Variable name 必须是 `DB`（大写）

### 常见问题 3: 环境变量未生效

**错误**: ENCRYPTION_KEY is not defined

**解决方案**:
1. 在 Cloudflare Dashboard 中配置环境变量
2. 重新部署项目

### 常见问题 4: API 返回 500

**解决方案**:
1. 查看部署日志
2. 检查 Functions 日志：
   ```bash
   wrangler pages deployment tail
   ```
3. 确认数据库表已初始化

---

## 📊 Cloudflare Pages 构建配置截图指南

### 构建设置页面应该这样配置：

```
┌─────────────────────────────────────────┐
│ Build settings                          │
├─────────────────────────────────────────┤
│ Framework preset: None                  │
│ Build command: npm run build            │
│ Build output directory: public          │
│ Root directory: /                       │
└─────────────────────────────────────────┘
```

### 环境变量页面：

```
┌─────────────────────────────────────────┐
│ Environment variables                   │
├─────────────────────────────────────────┤
│ ENCRYPTION_KEY = your-key-here          │
│ NODE_VERSION = 18                       │
└─────────────────────────────────────────┘
```

### Functions 绑定页面：

```
┌─────────────────────────────────────────┐
│ D1 database bindings                    │
├─────────────────────────────────────────┤
│ Variable name: DB                       │
│ D1 database: wechat-notifier-db         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ KV namespace bindings                   │
├─────────────────────────────────────────┤
│ Variable name: CACHE                    │
│ KV namespace: CACHE                     │
└─────────────────────────────────────────┘
```

---

## 🎯 部署后的访问地址

假设你的项目名称是 `wechat-notifier`：

- **首页**: https://wechat-notifier.pages.dev/
- **消息发送**: https://wechat-notifier.pages.dev/message-sender.html
- **消息查看**: https://wechat-notifier.pages.dev/message-viewer.html
- **API 文档**: https://wechat-notifier.pages.dev/api-docs.html

### API 端点

- `POST https://wechat-notifier.pages.dev/api/configure`
- `POST https://wechat-notifier.pages.dev/api/notify/:code`
- `GET https://wechat-notifier.pages.dev/api/configuration/:code`
- `GET https://wechat-notifier.pages.dev/api/messages/:code`

---

## 🔄 自动部署

配置完成后，每次推送到 `cloudflare` 分支都会自动触发部署：

```bash
# 修改代码后
git add .
git commit -m "feat: 添加新功能"
git push

# Cloudflare Pages 会自动：
# 1. 检测到推送
# 2. 拉取最新代码
# 3. 运行构建命令
# 4. 部署到全球边缘节点
```

---

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Workers KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [项目快速开始](./QUICKSTART-CLOUDFLARE.md)
- [部署指南](./docs/cloudflare-deployment.md)

---

## 🆘 需要帮助？

如果部署遇到问题：

1. 查看 Cloudflare Pages 的部署日志
2. 运行 `wrangler pages deployment tail` 查看实时日志
3. 参考 [故障排查文档](./docs/cloudflare-deployment.md#故障排查)
4. 提交 GitHub Issue

---

**企业微信通知服务** | Cloudflare Pages 部署 · 全球加速 · 自动部署
