# Cloudflare D1 数据库迁移指南

## 问题说明

在 Cloudflare Pages 部署后，如果遇到 "生成回调URL失败: Unexpected end of JSON input" 错误，这通常是因为数据库表结构不兼容导致的。

## 原因分析

旧的数据库表结构中，`encrypted_corpsecret`、`agentid` 和 `touser` 字段被定义为 `NOT NULL`，但在两步配置流程中：
- 第一步：只提供回调配置（这些字段为 null）
- 第二步：完善配置（提供这些字段）

这导致第一步插入数据时违反了 NOT NULL 约束。

## 解决方案

### 方案 1：重新创建数据库（推荐用于新部署）

如果你的数据库中没有重要数据，可以直接删除并重新创建：

```bash
# 1. 删除现有数据库
wrangler d1 delete wechat-notifier-db

# 2. 创建新数据库
wrangler d1 create wechat-notifier-db

# 3. 更新 wrangler.toml 中的 database_id

# 4. 执行数据库初始化
wrangler d1 execute wechat-notifier-db --remote --file=./schema.sql
```

### 方案 2：迁移现有数据库（保留数据）

如果你的数据库中有重要数据，需要执行迁移：

#### 步骤 1：创建迁移 SQL 文件

创建文件 `migrations/001_allow_null_fields.sql`：

```sql
-- 由于 SQLite 不支持直接修改列约束，需要重建表

-- 1. 创建新表结构
CREATE TABLE IF NOT EXISTS configurations_new (
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

-- 2. 复制现有数据
INSERT INTO configurations_new 
SELECT * FROM configurations;

-- 3. 删除旧表
DROP TABLE configurations;

-- 4. 重命名新表
ALTER TABLE configurations_new RENAME TO configurations;
```

#### 步骤 2：执行迁移

```bash
# 本地测试
wrangler d1 execute wechat-notifier-db --local --file=./migrations/001_allow_null_fields.sql

# 生产环境
wrangler d1 execute wechat-notifier-db --remote --file=./migrations/001_allow_null_fields.sql
```

### 方案 3：通过 Cloudflare Dashboard 手动执行

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages > D1
3. 选择你的数据库 `wechat-notifier-db`
4. 点击 "Console" 标签
5. 执行以下 SQL：

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

## 验证迁移

迁移完成后，验证表结构：

```sql
-- 查看表结构
PRAGMA table_info(configurations);

-- 应该看到 encrypted_corpsecret、agentid、touser 字段的 notnull 列为 0
```

## 重新部署

迁移完成后，重新部署应用：

```bash
npm run deploy
```

## 测试

1. 访问你的 Cloudflare Pages 网站
2. 填写第一步的回调配置信息
3. 点击"生成回调URL"
4. 应该能成功生成回调URL，不再出现错误

## 常见问题

### Q: 为什么会出现 "Unexpected end of JSON input" 错误？

A: 这个错误通常表示服务器返回了空响应或非 JSON 格式的响应。在我们的情况下，是因为数据库插入失败，导致服务器返回了错误响应，但前端没有正确处理。

### Q: 如何查看 Cloudflare Workers 的日志？

A: 
1. 在 Cloudflare Dashboard 中进入 Workers & Pages
2. 选择你的 Pages 项目
3. 点击 "Logs" 标签
4. 或者使用 `wrangler tail` 命令实时查看日志

### Q: 迁移会影响现有配置吗？

A: 不会。迁移只是修改表结构，允许某些字段为空，不会删除或修改现有数据。

## 预防措施

为了避免将来出现类似问题：

1. **使用迁移文件**：将所有数据库变更记录在 `migrations/` 目录中
2. **版本控制**：在 `schema.sql` 中添加版本注释
3. **测试**：在本地环境充分测试后再部署到生产环境
4. **备份**：定期导出数据库数据

## 相关文件

- `src/core/database-cf.js` - Cloudflare D1 数据库操作
- `schema.sql` - 数据库表结构定义
- `functions/api/generate-callback.js` - 生成回调URL API
- `functions/api/complete-config.js` - 完善配置 API

## 更新日志

- 2024-11-20: 修复两步配置流程中的数据库约束问题
