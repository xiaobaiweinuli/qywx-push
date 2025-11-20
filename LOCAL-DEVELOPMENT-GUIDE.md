# 🛠️ 本地开发调试指南

使用 Wrangler CLI 工具进行本地开发和调试的完整指南。

## 📋 前置要求

- Node.js 18+ 和 npm
- Wrangler CLI 3.0+
- Cloudflare 账号（用于创建 D1 数据库和 KV）

## 🚀 快速开始

### 1. 安装 Wrangler CLI

```bash
# 全局安装
npm install -g wrangler

# 或者使用项目本地安装
npm install wrangler --save-dev

# 验证安装
wrangler --version
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，让你授权 Wrangler 访问你的 Cloudflare 账号。

### 3. 创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create wechat-notifier-db

# 输出示例：
# ✅ Successfully created DB 'wechat-notifier-db'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "wechat-notifier-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要**：复制输出的 `database_id`，更新 `wrangler.toml` 文件。

### 4. 初始化数据库表结构

```bash
# 执行 schema.sql 创建表
wrangler d1 execute wechat-notifier-db --file=./schema.sql

# 输出示例：
# 🌀 Executing on wechat-notifier-db (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
# 🌀 To execute on your remote database, add a --remote flag to your wrangler command.
# ✅ Executed 3 commands in 0.123s
```

### 5. 创建 KV 命名空间

```bash
# 创建 KV 命名空间
wrangler kv:namespace create CACHE

# 输出示例：
# ✅ Successfully created KV namespace
# 
# [[kv_namespaces]]
# binding = "CACHE"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**重要**：复制输出的 `id`，更新 `wrangler.toml` 文件。

### 6. 配置本地环境变量

创建 `.dev.vars` 文件：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`：

```env
ENCRYPTION_KEY=your-super-secret-encryption-key-at-least-32-characters-long
```

**生成随机密钥**：

```bash
# 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

### 7. 启动本地开发服务器

```bash
npm run dev
```

或者直接使用 Wrangler：

```bash
wrangler pages dev public --compatibility-date=2024-01-01 --d1=DB --kv=CACHE
```

输出示例：
```
⎔ Starting local server...
⎔ Parsed 1 valid header rule.
✨ Compiled Worker successfully
🌎 Listening at http://localhost:8788
╭──────────────────────────────────────────────────────────────────────╮
│  [b] open a browser, [d] open Devtools, [l] turn off local mode,    │
│  [c] clear console, [x] to exit                                      │
╰──────────────────────────────────────────────────────────────────────╯
```

### 8. 访问本地服务

- **首页**: http://localhost:8788/
- **消息发送**: http://localhost:8788/message-sender.html
- **消息查看**: http://localhost:8788/message-viewer.html
- **API 文档**: http://localhost:8788/api-docs.html

---

## 🔧 Wrangler 常用命令

### D1 数据库操作

#### 查询数据

```bash
# 查询所有配置
wrangler d1 execute wechat-notifier-db \
  --command "SELECT * FROM configurations"

# 查询配置数量
wrangler d1 execute wechat-notifier-db \
  --command "SELECT COUNT(*) as total FROM configurations"

# 查询最近的消息
wrangler d1 execute wechat-notifier-db \
  --command "SELECT * FROM received_messages ORDER BY created_at DESC LIMIT 10"
```

#### 导出数据

```bash
# 导出整个数据库
wrangler d1 export wechat-notifier-db --output backup.sql

# 导出特定表
wrangler d1 execute wechat-notifier-db \
  --command "SELECT * FROM configurations" \
  --json > configurations.json
```

#### 导入数据

```bash
# 从 SQL 文件导入
wrangler d1 execute wechat-notifier-db --file=backup.sql

# 执行单条 SQL
wrangler d1 execute wechat-notifier-db \
  --command "INSERT INTO configurations (code, corpid, encrypted_corpsecret, agentid, touser) VALUES ('test', 'wx123', 'encrypted', 1000001, 'user1')"
```

#### 删除数据

```bash
# 清空表（保留结构）
wrangler d1 execute wechat-notifier-db \
  --command "DELETE FROM configurations"

# 删除特定记录
wrangler d1 execute wechat-notifier-db \
  --command "DELETE FROM configurations WHERE code = 'test'"
```

### KV 命名空间操作

#### 查看 KV 数据

```bash
# 列出所有 key
wrangler kv:key list --namespace-id=YOUR_KV_ID

# 获取特定 key 的值
wrangler kv:key get "access_token_wx123" --namespace-id=YOUR_KV_ID

# 获取 JSON 格式的值
wrangler kv:key get "access_token_wx123" --namespace-id=YOUR_KV_ID --json
```

#### 设置 KV 数据

```bash
# 设置 key-value
wrangler kv:key put "test_key" "test_value" --namespace-id=YOUR_KV_ID

# 设置带过期时间的 key（秒）
wrangler kv:key put "test_key" "test_value" --namespace-id=YOUR_KV_ID --ttl=3600
```

#### 删除 KV 数据

```bash
# 删除特定 key
wrangler kv:key delete "test_key" --namespace-id=YOUR_KV_ID

# 批量删除
wrangler kv:bulk delete keys.json --namespace-id=YOUR_KV_ID
```

### Pages 部署操作

#### 部署到生产环境

```bash
# 部署
npm run deploy

# 或直接使用 wrangler
wrangler pages deploy public
```

#### 查看部署列表

```bash
wrangler pages deployment list
```

#### 查看实时日志

```bash
# 查看最新部署的日志
wrangler pages deployment tail

# 查看特定部署的日志
wrangler pages deployment tail --deployment-id=DEPLOYMENT_ID
```

---

## 🐛 调试技巧

### 1. 使用 Console 日志

在 Functions 代码中添加 `console.log`：

```javascript
// functions/api/notify/[code].js
export async function onRequestPost(context) {
    const { request, env, params } = context;
    
    console.log('📥 收到请求:', {
        code: params.code,
        method: request.method,
        url: request.url
    });
    
    try {
        const body = await request.json();
        console.log('📦 请求体:', body);
        
        const result = await sendNotification(env.DB, env.CACHE, env.ENCRYPTION_KEY, params.code, body.title, body.content);
        
        console.log('✅ 发送成功:', result);
        
        return new Response(JSON.stringify({
            message: '发送成功',
            response: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('❌ 发送失败:', error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

**查看日志**：
- 本地开发：日志直接显示在终端
- 生产环境：使用 `wrangler pages deployment tail`

### 2. 使用浏览器开发者工具

#### Network 标签
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 执行操作（如发送消息）
4. 查看请求详情：
   - 请求 URL
   - 请求方法
   - 请求头
   - 请求体
   - 响应状态码
   - 响应体

#### Console 标签
查看前端 JavaScript 错误和日志。

#### Application 标签
查看 LocalStorage、SessionStorage、Cookies 等。

### 3. 测试 API 端点

使用 curl 或 Postman 测试：

```bash
# 测试创建配置
curl -X POST http://localhost:8788/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "corpid": "test",
    "corpsecret": "test",
    "agentid": 1000001,
    "touser": ["user1"],
    "description": "测试"
  }' \
  -v

# -v 参数显示详细信息，包括请求头和响应头
```

### 4. 检查数据库状态

```bash
# 查看表结构
wrangler d1 execute wechat-notifier-db \
  --command "SELECT sql FROM sqlite_master WHERE type='table'"

# 查看索引
wrangler d1 execute wechat-notifier-db \
  --command "SELECT * FROM sqlite_master WHERE type='index'"

# 查看数据统计
wrangler d1 execute wechat-notifier-db \
  --command "SELECT 
    (SELECT COUNT(*) FROM configurations) as config_count,
    (SELECT COUNT(*) FROM received_messages) as message_count"
```

### 5. 模拟不同场景

#### 测试错误处理

```bash
# 测试缺少参数
curl -X POST http://localhost:8788/api/configure \
  -H "Content-Type: application/json" \
  -d '{}'

# 测试无效的 code
curl http://localhost:8788/api/configuration/invalid-code

# 测试无效的 JSON
curl -X POST http://localhost:8788/api/configure \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

#### 测试并发请求

```bash
# 使用 Apache Bench
ab -n 100 -c 10 http://localhost:8788/api/configuration/test-code

# 使用 curl 并行
for i in {1..10}; do
  curl -X POST http://localhost:8788/api/notify/test-code \
    -H "Content-Type: application/json" \
    -d '{"content":"测试'$i'"}' &
done
wait
```

---

## 🔍 常见问题排查

### 问题 1: 启动失败 - "Database not found"

**错误信息**：
```
Error: Database 'wechat-notifier-db' not found
```

**解决方法**：
1. 检查 `wrangler.toml` 中的 `database_id` 是否正确
2. 确认数据库已创建：
   ```bash
   wrangler d1 list
   ```
3. 如果数据库不存在，重新创建：
   ```bash
   wrangler d1 create wechat-notifier-db
   ```

### 问题 2: 启动失败 - "KV namespace not found"

**错误信息**：
```
Error: KV namespace 'CACHE' not found
```

**解决方法**：
1. 检查 `wrangler.toml` 中的 KV `id` 是否正确
2. 确认 KV 命名空间已创建：
   ```bash
   wrangler kv:namespace list
   ```
3. 如果不存在，重新创建：
   ```bash
   wrangler kv:namespace create CACHE
   ```

### 问题 3: 环境变量未生效

**症状**：
- 加密/解密失败
- 提示 "ENCRYPTION_KEY is not defined"

**解决方法**：
1. 确认 `.dev.vars` 文件存在
2. 检查文件内容格式：
   ```env
   ENCRYPTION_KEY=your-key-here
   ```
3. 重启开发服务器

### 问题 4: 数据库表不存在

**错误信息**：
```
Error: no such table: configurations
```

**解决方法**：
```bash
# 重新初始化数据库
wrangler d1 execute wechat-notifier-db --file=./schema.sql

# 验证表已创建
wrangler d1 execute wechat-notifier-db \
  --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### 问题 5: 端口被占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::8788
```

**解决方法**：
```bash
# 方法 1: 使用不同端口
wrangler pages dev public --port=8789

# 方法 2: 杀死占用端口的进程（Windows）
netstat -ano | findstr :8788
taskkill /PID <PID> /F

# 方法 2: 杀死占用端口的进程（Linux/Mac）
lsof -ti:8788 | xargs kill -9
```

### 问题 6: CORS 错误

**症状**：
- 浏览器控制台显示 CORS 错误
- API 请求被阻止

**解决方法**：
1. 检查 `functions/_middleware.js` 是否正确配置 CORS
2. 确认中间件正在运行
3. 清除浏览器缓存并刷新

---

## 📊 性能监控

### 本地性能测试

```bash
# 测试响应时间
time curl http://localhost:8788/api/configuration/test-code

# 使用 Apache Bench 测试
ab -n 1000 -c 10 http://localhost:8788/api/configuration/test-code

# 输出示例：
# Requests per second:    500.00 [#/sec] (mean)
# Time per request:       20.000 [ms] (mean)
```

### 查看资源使用

```bash
# 查看 Wrangler 进程
ps aux | grep wrangler

# 查看内存使用（Linux/Mac）
top -p $(pgrep -f wrangler)
```

---

## 🎯 开发工作流

### 典型的开发流程

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **修改代码**
   - 编辑 `functions/` 目录下的文件
   - 编辑 `src/` 目录下的文件
   - 编辑 `public/` 目录下的前端文件

3. **自动重载**
   - Wrangler 会自动检测文件变化
   - 自动重新编译和重启服务
   - 刷新浏览器查看效果

4. **测试功能**
   - 使用浏览器测试前端
   - 使用 curl 测试 API
   - 查看终端日志

5. **调试问题**
   - 查看终端日志
   - 使用浏览器开发者工具
   - 查询数据库状态

6. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   git push
   ```

7. **部署到生产**
   ```bash
   npm run deploy
   ```

---

## 🔐 安全最佳实践

### 1. 保护敏感信息

- ✅ 使用 `.dev.vars` 存储本地环境变量
- ✅ 将 `.dev.vars` 添加到 `.gitignore`
- ✅ 使用强随机密钥
- ❌ 不要在代码中硬编码密钥

### 2. 数据库安全

```bash
# 定期备份
wrangler d1 export wechat-notifier-db --output backup-$(date +%Y%m%d).sql

# 限制查询权限（生产环境）
# 在 Cloudflare Dashboard 中配置
```

### 3. API 安全

- 考虑添加 API 密钥验证
- 实现速率限制
- 验证输入数据
- 使用 HTTPS（生产环境自动）

---

## 📚 相关资源

### 官方文档

- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Workers KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)

### 项目文档

- [快速开始](./QUICKSTART-CLOUDFLARE.md)
- [前后端集成](./FRONTEND-BACKEND-INTEGRATION.md)
- [测试清单](./TESTING-CHECKLIST.md)
- [部署指南](./docs/cloudflare-deployment.md)

---

## 🎉 总结

使用 Wrangler CLI 进行本地开发的优势：

- ✅ **快速启动** - 一条命令启动完整环境
- ✅ **自动重载** - 代码修改自动生效
- ✅ **完整模拟** - 本地环境与生产环境一致
- ✅ **强大工具** - 丰富的命令行工具
- ✅ **实时日志** - 即时查看运行状态

**开始开发**：
```bash
npm run dev
```

**遇到问题**：
1. 查看终端日志
2. 检查 `wrangler.toml` 配置
3. 验证数据库和 KV 绑定
4. 参考本文档的故障排查部分

---

**企业微信通知服务** | 本地开发 · 高效调试 · 快速迭代
