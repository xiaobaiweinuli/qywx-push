# 快速修复：生成回调URL失败

## 问题

部署到 Cloudflare 后，点击"生成回调URL"时出现错误：
```
生成回调URL失败: Unexpected end of JSON input
```

## 原因

数据库表结构不兼容，某些字段不允许为空。

## 快速修复（3步）

### 方法 1：使用自动脚本（推荐）

**Windows 用户：**
```cmd
fix-cloudflare-db.bat
```

**Mac/Linux 用户：**
```bash
chmod +x fix-cloudflare-db.sh
./fix-cloudflare-db.sh
```

按提示选择环境（生产环境选 2），然后等待完成。

### 方法 2：手动执行（如果脚本失败）

#### 步骤 1：执行数据库迁移

```bash
# 生产环境
wrangler d1 execute wechat-notifier-db --remote --file=./migrations/001_allow_null_fields.sql

# 或本地环境
wrangler d1 execute wechat-notifier-db --local --file=./migrations/001_allow_null_fields.sql
```

#### 步骤 2：重新部署

```bash
npm run deploy
```

#### 步骤 3：测试

访问你的网站，再次尝试生成回调URL。

### 方法 3：通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** > **D1**
3. 选择数据库 `wechat-notifier-db`
4. 点击 **Console** 标签
5. 复制并执行以下 SQL：

```sql
-- 创建新表
CREATE TABLE configurations_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    corpid TEXT NOT NULL,
    encrypted_corpsecret TEXT,
    agentid INTEGER,
    touser TEXT,
    description TEXT,
    callback_token TEXT,
    encrypted_encoding_aes_key TEXT,
    callback_enabled BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 复制数据
INSERT INTO configurations_new SELECT * FROM configurations;

-- 删除旧表
DROP TABLE configurations;

-- 重命名
ALTER TABLE configurations_new RENAME TO configurations;
```

6. 重新部署应用

## 验证修复

修复后，你应该能够：
1. ✅ 成功生成回调URL
2. ✅ 完成第二步配置
3. ✅ 发送测试消息

## 仍然有问题？

查看详细文档：
- [完整迁移指南](./CLOUDFLARE-DATABASE-MIGRATION.md)
- [Cloudflare 部署指南](./docs/cloudflare-deployment.md)

或查看 Cloudflare Workers 日志：
```bash
wrangler tail
```

## 预防措施

为避免将来出现类似问题：

1. **新部署**：使用最新的 `schema.sql` 文件
2. **更新**：先在本地测试，再部署到生产环境
3. **备份**：定期导出数据库数据

## 技术细节

这个修复做了什么：
- 将 `encrypted_corpsecret`、`agentid`、`touser` 字段改为可空
- 支持两步配置流程（先生成回调URL，再完善配置）
- 保留所有现有数据

修改的文件：
- `src/core/database-cf.js` - 数据库操作
- `schema.sql` - 表结构定义
- `functions/api/generate-callback.js` - 新增 API
- `functions/api/complete-config.js` - 新增 API
- `src/services/notifier-cf.js` - 新增函数

---

**最后更新：** 2024-11-20
