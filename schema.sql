-- Cloudflare D1 数据库初始化脚本
-- 用于创建企业微信通知服务所需的表结构

-- 配置表
-- 注意：encrypted_corpsecret、agentid、touser 允许为空，以支持两步配置流程
CREATE TABLE IF NOT EXISTS configurations (
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

-- 接收消息表
CREATE TABLE IF NOT EXISTS received_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE NOT NULL,
    
    -- 基础信息
    from_user TEXT NOT NULL,
    from_user_name TEXT,
    to_user TEXT,
    agent_id TEXT,
    
    -- 消息内容
    msg_type TEXT NOT NULL,
    content TEXT,
    
    -- 媒体相关
    media_id TEXT,
    pic_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    
    -- 引用消息相关
    quote_msg_id TEXT,
    quote_content TEXT,
    quote_from_user TEXT,
    quote_from_user_name TEXT,
    quote_msg_type TEXT,
    
    -- 事件相关
    event_type TEXT,
    event_key TEXT,
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    created_time TEXT NOT NULL,
    created_date TEXT NOT NULL,
    
    -- 索引标记
    is_reply INTEGER DEFAULT 0,
    is_read INTEGER DEFAULT 0,
    
    -- 配置关联
    config_code TEXT NOT NULL,
    
    -- 企业微信消息类型支持字段
    format TEXT,
    recognition TEXT,
    thumb_media_id TEXT,
    location_x REAL,
    location_y REAL,
    scale REAL,
    label TEXT,
    title TEXT,
    description TEXT,
    url TEXT,
    app_type TEXT
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_from_user ON received_messages(from_user);
CREATE INDEX IF NOT EXISTS idx_created_at ON received_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_created_date ON received_messages(created_date);
CREATE INDEX IF NOT EXISTS idx_msg_type ON received_messages(msg_type);
CREATE INDEX IF NOT EXISTS idx_quote_msg_id ON received_messages(quote_msg_id);
CREATE INDEX IF NOT EXISTS idx_composite ON received_messages(from_user, created_at);
CREATE INDEX IF NOT EXISTS idx_config_code ON received_messages(config_code);
