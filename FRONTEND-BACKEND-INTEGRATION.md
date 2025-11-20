# 前后端集成说明

## ✅ 结论：前端页面完全可以正常调用后端服务

无论是**本地开发**还是**Cloudflare Pages 部署**，前端页面都可以完美调用后端 API。

---

## 🎯 为什么可以正常工作？

### 1. 相对路径自动适配

前端代码使用相对路径：

```javascript
// 前端代码（public/script.js）
const response = await fetch('/api/notify/abc123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '测试', content: '内容' })
});
```

**路径解析**：
- 本地开发：`http://localhost:8788/api/notify/abc123`
- Cloudflare Pages：`https://your-project.pages.dev/api/notify/abc123`

路径会**自动适配当前域名**，无需修改代码！

### 2. Cloudflare Pages Functions 路由

Cloudflare Pages 使用**文件系统路由**：

```
functions/api/notify/[code].js  →  /api/notify/:code
```

当前端请求 `/api/notify/abc123` 时：
1. Cloudflare 检查 `functions/` 目录
2. 找到 `functions/api/notify/[code].js`
3. 执行该文件的 `onRequestPost` 函数
4. 将 `abc123` 作为 `params.code` 传递

### 3. 静态文件自动服务

`public/` 目录下的所有文件会自动部署：

```
public/index.html              →  https://your-project.pages.dev/
public/message-sender.html     →  https://your-project.pages.dev/message-sender.html
public/script.js               →  https://your-project.pages.dev/script.js
```

---

## 📊 完整的请求流程

### 场景：用户在前端页面创建配置

#### 1. 用户操作
```
用户访问: https://your-project.pages.dev/
填写表单: CorpID, CorpSecret, AgentID, 用户列表
点击按钮: "完成配置"
```

#### 2. 前端发起请求
```javascript
// public/script.js
const response = await fetch('/api/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        corpid: 'wx123456',
        corpsecret: 'secret123',
        agentid: 1000001,
        touser: ['user1', 'user2']
    })
});
```

#### 3. Cloudflare 路由
```
请求 URL: https://your-project.pages.dev/api/configure
↓
匹配文件: functions/api/configure.js
↓
执行函数: onRequestPost(context)
```

#### 4. 后端处理
```javascript
// functions/api/configure.js
export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    
    // 调用业务逻辑
    const result = await createConfiguration(
        env.DB,           // D1 数据库
        env.ENCRYPTION_KEY, // 环境变量
        body
    );
    
    // 返回响应
    return new Response(JSON.stringify(result), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
    });
}
```

#### 5. 数据库操作
```javascript
// src/services/notifier-cf.js
export async function createConfiguration(db, encryptionKey, config) {
    const dbInstance = new DatabaseCF(db);
    
    // 加密敏感信息
    const encrypted_corpsecret = await encrypt(config.corpsecret, encryptionKey);
    
    // 保存到 D1
    await dbInstance.saveConfiguration({
        code: generateCode(),
        corpid: config.corpid,
        encrypted_corpsecret,
        agentid: config.agentid,
        touser: config.touser
    });
    
    return { code, message: '配置创建成功' };
}
```

#### 6. 前端接收响应
```javascript
const data = await response.json();
console.log(data); // { code: 'cf_abc123xyz', message: '配置创建成功' }

// 显示结果
showResult(data);
```

---

## 🧪 验证方法

### 方法 1: 本地测试

```bash
# 1. 启动本地服务
npm run dev

# 2. 打开浏览器
# 访问 http://localhost:8788/

# 3. 打开开发者工具（F12）
# 切换到 Network 标签

# 4. 在页面上操作
# 填写配置信息并提交

# 5. 查看 Network 标签
# 应该看到：
# - 请求 URL: http://localhost:8788/api/configure
# - 请求方法: POST
# - 状态码: 201
# - 响应: { "code": "...", "message": "..." }
```

### 方法 2: 部署后测试

```bash
# 1. 部署到 Cloudflare
npm run deploy

# 2. 访问部署的 URL
# https://your-project.pages.dev/

# 3. 打开开发者工具（F12）
# 切换到 Network 标签

# 4. 在页面上操作
# 填写配置信息并提交

# 5. 查看 Network 标签
# 应该看到：
# - 请求 URL: https://your-project.pages.dev/api/configure
# - 请求方法: POST
# - 状态码: 201
# - 响应: { "code": "...", "message": "..." }
```

### 方法 3: 使用 curl 测试

```bash
# 测试 API 端点
curl -X POST https://your-project.pages.dev/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "corpid": "test",
    "corpsecret": "test",
    "agentid": 1000001,
    "touser": ["user1"]
  }'

# 预期响应
# {
#   "code": "cf_abc123xyz",
#   "message": "配置创建成功"
# }
```

---

## 🔍 常见问题排查

### Q1: 前端页面可以访问，但点击按钮没反应？

**检查步骤**：
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 查看是否有 JavaScript 错误

**可能原因**：
- JavaScript 文件加载失败
- 代码语法错误

**解决方法**：
```bash
# 检查静态文件是否正确部署
curl https://your-project.pages.dev/script.js
```

### Q2: API 请求返回 404？

**检查步骤**：
1. 查看 Network 标签中的请求 URL
2. 确认 URL 路径是否正确

**可能原因**：
- Functions 文件路径不正确
- 文件名拼写错误

**解决方法**：
```bash
# 检查 functions 目录结构
ls -R functions/

# 应该看到：
# functions/api/configure.js
# functions/api/notify/[code].js
# 等等
```

### Q3: API 请求返回 500？

**检查步骤**：
1. 查看 Functions 日志

```bash
wrangler pages deployment tail
```

**可能原因**：
- 数据库未绑定
- 环境变量未配置
- 代码逻辑错误

**解决方法**：
1. 检查 `wrangler.toml` 配置
2. 在 Cloudflare Dashboard 检查绑定
3. 查看错误日志定位问题

### Q4: CORS 错误？

**错误信息**：
```
Access to fetch at 'https://...' from origin 'https://...' 
has been blocked by CORS policy
```

**可能原因**：
- 中间件未正确配置 CORS 头

**解决方法**：
检查 `functions/_middleware.js`：

```javascript
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理 OPTIONS 请求
if (request.method === 'OPTIONS') {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    });
}
```

---

## 📋 API 路径完整映射表

| 前端调用 | Functions 文件 | 功能 |
|---------|---------------|------|
| `POST /api/configure` | `functions/api/configure.js` | 创建配置 |
| `POST /api/validate` | `functions/api/validate.js` | 验证凭证 |
| `POST /api/generate-callback` | `functions/api/generate-callback.js` | 生成回调URL |
| `POST /api/complete-config` | `functions/api/complete-config.js` | 完善配置 |
| `GET /api/configuration/:code` | `functions/api/configuration/[code].js` | 获取配置 |
| `PUT /api/configuration/:code` | `functions/api/configuration/[code].js` | 更新配置 |
| `POST /api/notify/:code` | `functions/api/notify/[code].js` | 发送通知 |
| `POST /api/notify/:code/enhanced` | `functions/api/notify/[code]/enhanced.js` | 增强消息 |
| `GET /api/messages/:code` | `functions/api/messages/[code].js` | 查询消息 |
| `GET /api/callback/:code` | `functions/api/callback/[code].js` | 回调验证 |
| `POST /api/callback/:code` | `functions/api/callback/[code].js` | 回调消息 |

---

## ✅ 测试清单

### 本地开发测试

- [ ] 启动服务：`npm run dev`
- [ ] 访问首页：http://localhost:8788/
- [ ] 打开开发者工具（F12）
- [ ] 填写配置信息
- [ ] 点击"生成回调URL"
- [ ] 查看 Network 标签，确认请求成功
- [ ] 继续完善配置
- [ ] 查看最终结果

### Cloudflare Pages 测试

- [ ] 部署：`npm run deploy`
- [ ] 访问部署 URL
- [ ] 打开开发者工具（F12）
- [ ] 填写配置信息
- [ ] 点击"生成回调URL"
- [ ] 查看 Network 标签，确认请求成功
- [ ] 继续完善配置
- [ ] 查看最终结果
- [ ] 测试消息发送功能

---

## 🎉 总结

### ✅ 前端页面完全可以正常调用后端服务

**原因**：
1. 使用相对路径，自动适配域名
2. Cloudflare Pages Functions 自动路由
3. 静态文件自动部署到 CDN
4. CORS 正确配置

**优势**：
1. 无需修改前端代码
2. 本地开发和生产环境一致
3. 全球访问速度快
4. 自动扩展，无需担心并发

**验证方法**：
1. 本地测试：`npm run dev`
2. 部署测试：`npm run deploy`
3. 使用浏览器开发者工具查看 Network 标签
4. 使用 curl 测试 API 端点

**文档参考**：
- [前端兼容性说明](./docs/frontend-compatibility.md)
- [测试清单](./TESTING-CHECKLIST.md)
- [快速开始](./QUICKSTART-CLOUDFLARE.md)

---

**企业微信通知服务** | 前后端完美集成 · 开箱即用 · 全球加速
