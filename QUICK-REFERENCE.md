# 🚀 快速参考卡片

常用命令速查表，方便快速查阅。

## 📦 安装和设置

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 安装项目依赖
npm install
```

## 🗄️ 数据库操作

```bash
# 创建数据库
npm run db:create

# 初始化表结构
npm run db:init

# 查看所有配置
npm run db:show-configs

# 查看最近消息
npm run db:show-messages

# 查看数据统计
npm run db:count

# 备份数据库
npm run db:backup

# 恢复数据库
npm run db:restore

# 自定义查询
npm run db:query "SELECT * FROM configurations WHERE code = 'xxx'"
```

## 💾 KV 缓存操作

```bash
# 创建 KV 命名空间
npm run kv:create

# 列出所有 KV 命名空间
npm run kv:list

# 查看 KV 中的所有 key
wrangler kv:key list --namespace-id=YOUR_KV_ID

# 获取特定 key 的值
wrangler kv:key get "access_token_wx123" --namespace-id=YOUR_KV_ID

# 设置 key-value
wrangler kv:key put "test_key" "test_value" --namespace-id=YOUR_KV_ID

# 删除 key
wrangler kv:key delete "test_key" --namespace-id=YOUR_KV_ID
```

## 🛠️ 本地开发

```bash
# 启动开发服务器
npm run dev

# 启动开发服务器（调试模式）
npm run dev:debug

# 访问地址
# http://localhost:8788/
```

## 🚀 部署

```bash
# 部署到 Cloudflare Pages
npm run deploy

# 部署到生产环境（main 分支）
npm run deploy:production

# 查看部署列表
wrangler pages deployment list

# 查看实时日志
npm run logs
```

## 🧪 测试 API

```bash
# 创建配置
curl -X POST http://localhost:8788/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "corpid": "test",
    "corpsecret": "test",
    "agentid": 1000001,
    "touser": ["user1"],
    "description": "测试"
  }'

# 获取配置
curl http://localhost:8788/api/configuration/YOUR_CODE

# 发送消息
curl -X POST http://localhost:8788/api/notify/YOUR_CODE \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试",
    "content": "这是一条测试消息"
  }'

# 查询消息
curl "http://localhost:8788/api/messages/YOUR_CODE?page=1&limit=10"
```

## 🔍 调试

```bash
# 查看实时日志（本地）
# 日志会直接显示在终端

# 查看实时日志（生产）
npm run logs

# 查看数据库状态
npm run db:count

# 查看最近的消息
npm run db:show-messages

# 查看所有配置
npm run db:show-configs
```

## 📊 数据库查询示例

```bash
# 查询特定配置
npm run db:query "SELECT * FROM configurations WHERE code = 'abc123'"

# 查询今天的消息
npm run db:query "SELECT * FROM received_messages WHERE created_date = date('now')"

# 查询特定用户的消息
npm run db:query "SELECT * FROM received_messages WHERE from_user = 'user1'"

# 统计消息类型
npm run db:query "SELECT msg_type, COUNT(*) as count FROM received_messages GROUP BY msg_type"

# 查询最近 24 小时的消息
npm run db:query "SELECT * FROM received_messages WHERE created_at > strftime('%s', 'now', '-1 day')"
```

## 🔧 故障排查

```bash
# 检查 Wrangler 版本
wrangler --version

# 检查登录状态
wrangler whoami

# 列出所有数据库
npm run db:list

# 列出所有 KV 命名空间
npm run kv:list

# 验证数据库表结构
npm run db:query "SELECT sql FROM sqlite_master WHERE type='table'"

# 检查端口占用（Windows）
netstat -ano | findstr :8788

# 检查端口占用（Linux/Mac）
lsof -ti:8788
```

## 🌐 访问地址

### 本地开发
- 首页: http://localhost:8788/
- 消息发送: http://localhost:8788/message-sender.html
- 消息查看: http://localhost:8788/message-viewer.html
- API 文档: http://localhost:8788/api-docs.html

### 生产环境
- 首页: https://your-project.pages.dev/
- 消息发送: https://your-project.pages.dev/message-sender.html
- 消息查看: https://your-project.pages.dev/message-viewer.html
- API 文档: https://your-project.pages.dev/api-docs.html

## 📝 环境变量

### 本地开发 (.dev.vars)
```env
ENCRYPTION_KEY=your-encryption-key-here
```

### 生产环境
在 Cloudflare Dashboard 中配置：
1. 进入 Pages 项目
2. Settings → Environment variables
3. 添加 `ENCRYPTION_KEY`

## 🔐 生成加密密钥

```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 使用 OpenSSL
openssl rand -hex 32

# 使用 PowerShell（Windows）
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 📚 文档链接

- [本地开发指南](./LOCAL-DEVELOPMENT-GUIDE.md)
- [快速开始](./QUICKSTART-CLOUDFLARE.md)
- [前后端集成](./FRONTEND-BACKEND-INTEGRATION.md)
- [测试清单](./TESTING-CHECKLIST.md)
- [部署指南](./docs/cloudflare-deployment.md)

## 🆘 获取帮助

```bash
# Wrangler 帮助
wrangler --help

# 特定命令帮助
wrangler pages --help
wrangler d1 --help
wrangler kv --help

# 查看版本
wrangler --version
```

## 💡 常用技巧

### 1. 快速重启开发服务器
```bash
# Ctrl+C 停止
# 然后重新运行
npm run dev
```

### 2. 清除 KV 缓存
```bash
# 删除所有 access_token
wrangler kv:key list --namespace-id=YOUR_KV_ID | grep access_token | xargs -I {} wrangler kv:key delete {} --namespace-id=YOUR_KV_ID
```

### 3. 重置数据库
```bash
# 删除所有数据
npm run db:query "DELETE FROM configurations"
npm run db:query "DELETE FROM received_messages"

# 或者重新初始化
npm run db:init
```

### 4. 查看详细错误信息
```bash
# 使用调试模式
npm run dev:debug
```

### 5. 测试并发性能
```bash
# 使用 Apache Bench
ab -n 100 -c 10 http://localhost:8788/api/configuration/test-code

# 使用 curl 并行
for i in {1..10}; do
  curl http://localhost:8788/api/configuration/test-code &
done
wait
```

---

**企业微信通知服务** | 快速参考 · 高效开发 · 随时查阅

**提示**: 将此文件加入书签，方便随时查阅！
