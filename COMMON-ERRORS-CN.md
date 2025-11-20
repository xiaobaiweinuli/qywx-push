# 常见错误及解决方案

## 错误 1：生成回调URL失败

### 错误信息
```
生成回调URL失败: Unexpected end of JSON input
```

### 原因
数据库表结构不兼容，某些字段不允许为空。

### 解决方案
执行数据库迁移：

**快速修复（推荐）：**
```bash
# Windows
fix-cloudflare-db.bat

# Mac/Linux
./fix-cloudflare-db.sh
```

**手动修复：**
```bash
wrangler d1 execute wechat-notifier-db --remote --file=./migrations/001_allow_null_fields.sql
```

详细说明：[QUICK-FIX-CN.md](./QUICK-FIX-CN.md)

---

## 错误 2：配置未完成时发送消息失败

### 错误信息
```json
{
  "error": "Ciphertext length of 0 bits must be greater than or equal to the size of the AES-GCM tag length of 128 bits."
}
```

或

```json
{
  "error": "配置未完成，请先完成第二步配置（填写 CorpSecret、AgentID 和接收用户）"
}
```

### 原因
你只完成了第一步（生成回调URL），但还没有完成第二步配置。发送消息需要完整的配置信息。

### 解决方案

#### 步骤 1：返回配置页面
访问：`https://your-domain.pages.dev/`

#### 步骤 2：完成第二步配置
1. 在"第二步：完善配置"部分填写：
   - **CorpSecret**：企业微信应用的 Secret
   - **AgentID**：企业微信应用的 ID
   - **接收用户**：点击"验证并获取成员列表"，然后选择接收消息的用户

2. 点击"完成配置"

#### 步骤 3：测试发送
配置完成后，使用你的 Code 发送测试消息。

### 配置流程说明

企业微信通知服务使用**两步配置流程**：

1. **第一步：生成回调URL**
   - 只需要：CorpID、Callback Token、EncodingAESKey
   - 生成回调URL，用于企业微信回调验证
   - 此时**不能发送消息**

2. **第二步：完善配置**
   - 需要：CorpSecret、AgentID、接收用户
   - 完成后**才能发送消息**

---

## 错误 3：JavaScript 文件无法加载

### 错误信息
```
Refused to execute script from 'https://your-domain.pages.dev/public/message-sender.js' 
because its MIME type ('text/html') is not executable
```

### 原因
HTML 中使用了错误的脚本路径 `/public/xxx.js`。

### 解决方案
在 Cloudflare Pages 中，`public` 目录是根目录，应该使用：
- ✅ 正确：`/message-sender.js`
- ❌ 错误：`/public/message-sender.js`

这个问题已在最新版本中修复。如果仍然遇到，请清除浏览器缓存或使用无痕模式访问。

---

## 错误 4：获取 access_token 失败

### 错误信息
```json
{
  "error": "获取access_token失败: invalid corpid (错误码: 40013)"
}
```

### 原因
CorpID 或 CorpSecret 配置错误。

### 解决方案

1. **检查 CorpID**
   - 登录企业微信管理后台
   - 进入"我的企业" > "企业信息"
   - 复制正确的企业ID

2. **检查 CorpSecret**
   - 进入"应用管理" > 选择你的应用
   - 查看并复制 Secret
   - 注意：Secret 只显示一次，如果忘记需要重置

3. **更新配置**
   - 使用配置查询功能找到你的配置
   - 点击"编辑配置"
   - 更新 CorpSecret
   - 保存

---

## 错误 5：消息发送失败 - 用户不存在

### 错误信息
```json
{
  "error": "发送消息失败: userid not found (错误码: 40003)"
}
```

### 原因
配置的接收用户 ID 不存在或已被删除。

### 解决方案

1. **重新获取成员列表**
   - 编辑配置
   - 点击"验证并获取成员列表"
   - 选择正确的用户

2. **检查用户状态**
   - 确认用户在企业微信中是激活状态
   - 确认用户有权限接收应用消息

---

## 错误 6：数据库连接失败

### 错误信息
```
Database connection failed
```

### 原因
D1 数据库未正确配置或绑定。

### 解决方案

1. **检查 wrangler.toml**
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "wechat-notifier-db"
   database_id = "your-database-id"
   ```

2. **验证数据库存在**
   ```bash
   wrangler d1 list
   ```

3. **如果数据库不存在，创建它**
   ```bash
   wrangler d1 create wechat-notifier-db
   ```

4. **初始化数据库**
   ```bash
   wrangler d1 execute wechat-notifier-db --remote --file=./schema.sql
   ```

5. **更新 wrangler.toml**
   将新的 `database_id` 更新到配置文件中。

---

## 错误 7：环境变量未配置

### 错误信息
```json
{
  "error": "加密密钥未配置"
}
```

### 原因
`ENCRYPTION_KEY` 环境变量未在 Cloudflare 中配置。

### 解决方案

1. **登录 Cloudflare Dashboard**
2. 进入 **Workers & Pages**
3. 选择你的项目
4. 点击 **Settings** > **Environment variables**
5. 添加变量：
   - **Name**: `ENCRYPTION_KEY`
   - **Value**: 一个随机的32位字符串（用于加密敏感数据）
   - **Environment**: Production

6. **生成随机密钥**（可选）
   ```bash
   # 使用 Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # 或使用 OpenSSL
   openssl rand -hex 32
   ```

7. **重新部署**
   ```bash
   npm run deploy
   ```

---

## 错误 8：Tailwind CSS 生产环境警告

### 警告信息
```
cdn.tailwindcss.com should not be used in production
```

### 说明
这只是一个警告，不影响功能。CDN 版本的 Tailwind CSS 适合快速原型开发。

### 解决方案（可选）

如果你想消除这个警告，可以安装本地版本的 Tailwind CSS：

1. **安装依赖**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init
   ```

2. **配置 PostCSS**
   创建 `postcss.config.js`

3. **构建 CSS**
   ```bash
   npx tailwindcss -i ./src/input.css -o ./public/output.css --watch
   ```

4. **更新 HTML**
   将 CDN 链接替换为本地 CSS 文件

---

## 错误 9：回调验证失败

### 错误信息
企业微信管理后台显示："URL验证失败"

### 原因
- 回调 Token 或 EncodingAESKey 配置错误
- 服务器无法访问
- IP 白名单未配置

### 解决方案

1. **检查回调配置**
   - Token 和 EncodingAESKey 必须与企业微信后台一致
   - EncodingAESKey 必须是43位字符

2. **配置 IP 白名单**
   - 在企业微信管理后台添加 Cloudflare 的 IP 地址
   - 或者使用 `0.0.0.0/0` 允许所有 IP（不推荐）

3. **检查回调 URL**
   - 确保 URL 格式正确：`https://your-domain.pages.dev/api/callback/your-code`
   - 确保服务已部署并可访问

4. **查看日志**
   ```bash
   wrangler pages deployment tail
   ```

---

## 获取帮助

如果以上解决方案都无法解决你的问题：

1. **查看详细文档**
   - [部署指南](./docs/cloudflare-deployment.md)
   - [API 参考](./docs/api-reference.md)
   - [故障排除](./CLOUDFLARE-DATABASE-MIGRATION.md)

2. **查看日志**
   ```bash
   # 实时日志
   wrangler pages deployment tail
   
   # 或在 Cloudflare Dashboard 中查看
   ```

3. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签
   - 截图错误信息

4. **提交 Issue**
   - 访问 GitHub 仓库
   - 提供详细的错误信息和复现步骤
   - 包含相关日志和截图

---

**最后更新：** 2024-11-20
