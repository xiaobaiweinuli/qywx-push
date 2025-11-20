-- 迁移：允许 configurations 表中的某些字段为空
-- 日期：2024-11-20
-- 原因：支持两步配置流程（第一步只提供回调配置，第二步完善其他配置）

-- SQLite 不支持直接修改列约束，需要重建表

-- 1. 创建新表结构（允许 encrypted_corpsecret、agentid、touser 为空）
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

-- 2. 复制现有数据（如果表存在）
INSERT INTO configurations_new 
SELECT id, code, corpid, encrypted_corpsecret, agentid, touser, 
       description, callback_token, encrypted_encoding_aes_key, 
       callback_enabled, created_at
FROM configurations
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='configurations');

-- 3. 删除旧表
DROP TABLE IF EXISTS configurations;

-- 4. 重命名新表
ALTER TABLE configurations_new RENAME TO configurations;
