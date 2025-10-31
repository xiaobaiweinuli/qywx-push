// 数据库初始化与操作模块
// 管理SQLite数据库连接和表结构

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
    }

    // 初始化数据库连接和表结构
    async init() {
        return new Promise((resolve, reject) => {
            // 确保数据库目录存在
            const dbDir = path.dirname(this.dbPath);
            const fs = require('fs');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // 创建数据库连接
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('数据库连接失败:', err.message);
                    reject(err);
                    return;
                }
                console.log('SQLite数据库连接成功');

                // 创建configurations表
                this.createTables()
                    .then(() => resolve())
                    .catch(reject);
            });
        });
    }

    // 创建数据表
    async createTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // 创建configurations表
                const createConfigTableSQL = `
                    CREATE TABLE IF NOT EXISTS configurations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        code TEXT UNIQUE NOT NULL,
                        corpid TEXT NOT NULL,
                        encrypted_corpsecret TEXT NOT NULL,
                        agentid INTEGER NOT NULL,
                        touser TEXT NOT NULL,
                        description TEXT,
                        callback_token TEXT,
                        encrypted_encoding_aes_key TEXT,
                        callback_enabled BOOLEAN DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(corpid, agentid, touser)
                    )
                `;

                this.db.run(createConfigTableSQL, (err) => {
                    if (err) {
                        console.error('创建configurations表失败:', err.message);
                        reject(err);
                    }
                });

                // 创建received_messages表 - 支持引用关系和更多字段
                const createMessagesTableSQL = `
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
                        
                        -- 引用消息相关 (核心优化点)
                        quote_msg_id TEXT,              -- 被引用的消息ID
                        quote_content TEXT,              -- 被引用的消息内容
                        quote_from_user TEXT,           -- 被引用消息的发送者
                        quote_from_user_name TEXT,      -- 被引用消息发送者名称
                        quote_msg_type TEXT,            -- 被引用消息类型
                        
                        -- 事件相关
                        event_type TEXT,
                        event_key TEXT,
                        
                        -- 时间戳
                        created_at INTEGER NOT NULL,
                        created_time TEXT NOT NULL,
                        created_date TEXT NOT NULL,     -- YYYY-MM-DD 格式，便于按日期查询
                        
                        -- 索引标记
                        is_reply INTEGER DEFAULT 0,     -- 是否是回复消息
                        is_read INTEGER DEFAULT 0,      -- 是否已读（可用于未来功能）
                        
                        -- 配置关联
                        config_code TEXT NOT NULL,       -- 关联的配置代码
                        
                        -- 外键约束
                        FOREIGN KEY (quote_msg_id) REFERENCES received_messages(message_id)
                    )
                `;

                this.db.run(createMessagesTableSQL, (err) => {
                    if (err) {
                        console.error('创建received_messages表失败:', err.message);
                        reject(err);
                    }
                });
                
                // 表结构迁移和索引创建的完整流程
                const migrateAndCreateIndexes = () => {
                    // 对于新创建的数据库，直接假设config_code列存在
                    // 因为CREATE TABLE语句中已经定义了该列
                    // 省略日志输出，保持启动日志简洁
                    
                    // 直接创建所有索引，包括config_code索引
                    createAllIndexes(true);
                };
                
                // 创建所有索引的函数
                const createAllIndexes = (hasConfigCodeColumn) => {
                    const baseIndexes = [
                        { name: 'idx_from_user', sql: `CREATE INDEX IF NOT EXISTS idx_from_user ON received_messages(from_user)` },
                        { name: 'idx_created_at', sql: `CREATE INDEX IF NOT EXISTS idx_created_at ON received_messages(created_at)` },
                        { name: 'idx_created_date', sql: `CREATE INDEX IF NOT EXISTS idx_created_date ON received_messages(created_date)` },
                        { name: 'idx_msg_type', sql: `CREATE INDEX IF NOT EXISTS idx_msg_type ON received_messages(msg_type)` },
                        { name: 'idx_quote_msg_id', sql: `CREATE INDEX IF NOT EXISTS idx_quote_msg_id ON received_messages(quote_msg_id)` },
                        { name: 'idx_composite', sql: `CREATE INDEX IF NOT EXISTS idx_composite ON received_messages(from_user, created_at)` }
                    ];
                    
                    // 创建基础索引
                    baseIndexes.forEach((indexDef) => {
                        this.db.run(indexDef.sql, (err) => {
                            if (err) {
                                // 仅在出错时输出警告信息
                                console.warn(`创建索引 ${indexDef.name} 失败（可能已存在）:`, err.message);
                            }
                            // 省略成功日志输出
                        });
                    });
                    
                    // 创建config_code索引（如果列存在）
                    if (hasConfigCodeColumn) {
                        this.db.run(`CREATE INDEX IF NOT EXISTS idx_config_code ON received_messages(config_code)`, (err) => {
                            if (err) {
                                // 仅在出错时输出警告信息
                                console.warn('创建索引 idx_config_code 失败（可能已存在）:', err.message);
                            }
                            // 省略成功日志输出
                        });
                    } else {
                        console.warn('config_code列不存在，跳过创建该索引');
                    }
                };
                
                // 延迟执行索引创建，确保表结构已经完全创建
                setTimeout(() => {
                    migrateAndCreateIndexes();
                }, 100);

                // 创建全文搜索表 (支持内容搜索)
                try {
                    const createFtsTableSQL = `
                        CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
                            message_id,
                            content,
                            quote_content,
                            from_user_name
                        )
                    `;
                    this.db.run(createFtsTableSQL);
                } catch (err) {
                    console.warn('创建全文搜索表失败 (SQLite版本可能不支持FTS5):', err.message);
                }
            });

            // 省略数据表创建成功日志，保持启动日志简洁
            resolve();
        });
    }

    // 保存配置 - 支持冲突时更新
    async saveConfiguration(config) {
        return new Promise((resolve, reject) => {
            const { 
                code, corpid, encrypted_corpsecret, agentid, touser, description,
                callback_token, encrypted_encoding_aes_key, callback_enabled 
            } = config;
            
            // 使用INSERT OR REPLACE来避免唯一约束冲突
            const sql = `
                INSERT OR REPLACE INTO configurations (
                    code, corpid, encrypted_corpsecret, agentid, touser, description,
                    callback_token, encrypted_encoding_aes_key, callback_enabled, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(
                    (SELECT created_at FROM configurations WHERE corpid = ? AND agentid = ? AND touser = ?),
                    CURRENT_TIMESTAMP
                ))
            `;

            this.db.run(sql, [
                code, corpid, encrypted_corpsecret, agentid, touser, description,
                callback_token, encrypted_encoding_aes_key, callback_enabled || 0,
                corpid, agentid, touser // 用于子查询
            ], function(err) {
                if (err) {
                    console.error('保存配置失败:', err.message);
                    reject(err);
                    return;
                }
                console.log('配置保存成功, ID:', this.lastID);
                resolve({ id: this.lastID || null, code });
            });
        });
    }

    // 根据code获取配置
    async getConfigurationByCode(code) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM configurations WHERE code = ?`;

            this.db.get(sql, [code], (err, row) => {
                if (err) {
                    console.error('查询配置失败:', err.message);
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    // 更新配置
    async updateConfiguration(config) {
        return new Promise((resolve, reject) => {
            const { 
                code, corpid, encrypted_corpsecret, agentid, touser, description,
                callback_token, encrypted_encoding_aes_key, callback_enabled 
            } = config;
            const sql = `
                UPDATE configurations 
                SET corpid = ?, encrypted_corpsecret = ?, agentid = ?, touser = ?, description = ?,
                    callback_token = ?, encrypted_encoding_aes_key = ?, callback_enabled = ?
                WHERE code = ?
            `;
            this.db.run(sql, [
                corpid, encrypted_corpsecret, agentid, touser, description,
                callback_token, encrypted_encoding_aes_key, callback_enabled,
                code
            ], function(err) {
                if (err) {
                    console.error('更新配置失败:', err.message);
                    reject(err);
                    return;
                }
                console.log('配置更新成功, code:', code);
                resolve({ code });
            });
        });
    }

    // 根据字段查询配置
    async getConfigurationByFields(corpid, agentid, touser) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM configurations WHERE corpid = ? AND agentid = ? AND touser = ?`;
            this.db.get(sql, [corpid, agentid, touser], (err, row) => {
                if (err) {
                    console.error('查询配置失败:', err.message);
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    // 根据完整字段查询配置（包括回调配置）
    async getConfigurationByCompleteFields(corpid, agentid, touser, callback_enabled, callback_token) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM configurations WHERE corpid = ? AND agentid = ? AND touser = ? AND callback_enabled = ? AND (callback_token = ? OR (callback_token IS NULL AND ? IS NULL))`;
            this.db.get(sql, [corpid, agentid, touser, callback_enabled, callback_token, callback_token], (err, row) => {
                if (err) {
                    console.error('查询完整配置失败:', err.message);
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    // 保存回调配置（第一步）
    async saveCallbackConfiguration(config) {
        return new Promise((resolve, reject) => {
            const { code, corpid, callback_token, encrypted_encoding_aes_key } = config;
            const sql = `
                INSERT INTO configurations (
                    code, corpid, callback_token, encrypted_encoding_aes_key, callback_enabled,
                    encrypted_corpsecret, agentid, touser, description
                )
                VALUES (?, ?, ?, ?, 1, '', 0, '', '')
            `;

            this.db.run(sql, [code, corpid, callback_token, encrypted_encoding_aes_key], function(err) {
                if (err) {
                    console.error('保存回调配置失败:', err.message);
                    reject(err);
                    return;
                }
                console.log('回调配置保存成功, ID:', this.lastID);
                resolve({ id: this.lastID, code });
            });
        });
    }

    // 查询回调配置
    async getCallbackConfiguration(corpid, callback_token) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM configurations WHERE corpid = ? AND callback_token = ? AND callback_enabled = 1`;
            this.db.get(sql, [corpid, callback_token], (err, row) => {
                if (err) {
                    console.error('查询回调配置失败:', err.message);
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    // 完善配置（第二步）
    async completeConfiguration(config) {
        return new Promise((resolve, reject) => {
            const { code, encrypted_corpsecret, agentid, touser, description } = config;
            // 使用INSERT OR REPLACE避免UNIQUE约束冲突，同时保留原有的created_at时间戳
            const sql = `
                INSERT OR REPLACE INTO configurations (
                    id, code, corpid, encrypted_corpsecret, agentid, touser, description,
                    callback_token, encrypted_encoding_aes_key, callback_enabled, created_at
                )
                SELECT 
                    (SELECT id FROM configurations WHERE code = ?),
                    ?,
                    (SELECT corpid FROM configurations WHERE code = ?),
                    ?,
                    ?,
                    ?,
                    ?,
                    (SELECT callback_token FROM configurations WHERE code = ?),
                    (SELECT encrypted_encoding_aes_key FROM configurations WHERE code = ?),
                    (SELECT callback_enabled FROM configurations WHERE code = ?),
                    COALESCE((SELECT created_at FROM configurations WHERE code = ?), CURRENT_TIMESTAMP)
            `;
            
            this.db.run(sql, [
                code, code, code, // 重复使用code参数
                encrypted_corpsecret, agentid, touser, description,
                code, code, code, code // 重复使用code参数查询现有值
            ], function(err) {
                if (err) {
                    console.error('完善配置失败:', err.message);
                    reject(err);
                    return;
                }
                console.log('配置完善成功, code:', code);
                resolve({ code });
            });
        });
    }

    // 关闭数据库连接
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('关闭数据库失败:', err.message);
                } else {
                    console.log('数据库连接已关闭');
                }
            });
        }
    }

    // 保存接收到的消息
    async saveReceivedMessage(messageData) {
        console.log('📝 [DB] 开始保存消息流程...');
        return new Promise((resolve, reject) => {
            try {
                // 确保创建时间正确处理，转换为北京时间(UTC+8)
                const createTime = messageData.createTime || Math.floor(Date.now() / 1000);
                // 添加8小时偏移量转换为北京时间
                const beijingTime = createTime * 1000 + 8 * 60 * 60 * 1000;
                const date = new Date(beijingTime);
                
                // 生成北京时间戳（精确到秒）
                const beijingTimestamp = Math.floor(beijingTime / 1000);
                
                // 生成包含完整时间信息的created_date（精确到秒）
                const dateStr = date.toISOString().replace('Z', '').replace('T', ' ');
                
                // 生成北京时间的ISO字符串（精确到秒，不包含毫秒）
                const isoTimeStr = date.toISOString().split('.')[0] + 'Z';
                
                // 检查是否是引用消息
                const isReply = messageData.quoteMsg ? 1 : 0;
                
                console.log('💾 [DB] 准备保存消息:', {
                    message_id: messageData.message_id || `msg_${Date.now()}`,
                    config_code: messageData.config_code?.substring(0, 8) + '...',
                    from_user: messageData.from_user || 'system',
                    from_user_name: messageData.from_user_name || messageData.from_user,
                    msg_type: messageData.msg_type || 'unknown',
                    createTime: createTime,
                    isReply: isReply
                });
                
                console.log('📋 [DB] 消息内容预览:', {
                    has_content: !!messageData.content,
                    content_length: messageData.content ? messageData.content.length : 0,
                    has_media: !!messageData.media_id,
                    has_quote: !!messageData.quoteMsg
                });
            
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO received_messages 
                (
                    message_id, config_code, from_user, from_user_name, to_user, agent_id,
                    msg_type, content, media_id, pic_url, file_name, file_size,
                    quote_msg_id, quote_content, quote_from_user, quote_from_user_name, quote_msg_type,
                    event_type, event_key,
                    created_at, created_time, created_date, is_reply, is_read
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                messageData.message_id || `msg_${Date.now()}`,
                messageData.config_code || '',
                messageData.from_user,
                messageData.from_user_name || messageData.from_user,
                messageData.to_user,
                messageData.agent_id,
                messageData.msg_type,
                messageData.content || null,
                messageData.media_id || null,
                messageData.pic_url || null,
                messageData.file_name || null,
                messageData.file_size || null,
                messageData.quoteMsg?.msgId || null,
                messageData.quoteMsg?.content || null,
                messageData.quoteMsg?.fromUser || null,
                messageData.quoteMsg?.fromUserName || null,
                messageData.quoteMsg?.msgType || null,
                messageData.event_type || null,
                messageData.event_key || null,
                beijingTimestamp,
                isoTimeStr,
                dateStr,
                isReply,
                0
            );
            
            stmt.finalize(async (err) => {
                    if (err) {
                        console.error('❌ [DB] 保存消息失败:', err.message);
                        console.error('❌ [DB] 错误详情:', err);
                        console.error('❌ [DB] 错误上下文:', {
                            message_id: messageData.message_id || `msg_${Date.now()}`,
                            config_code: messageData.config_code,
                            createTime: createTime
                        });
                        reject(err);
                    } else {
                        console.log('✅ [DB] 消息保存成功!', {
                            message_id: messageData.message_id || `msg_${Date.now()}`,
                            config_code: messageData.config_code?.substring(0, 8) + '...',
                            createTime: createTime
                        });
                        
                        // 尝试同步到全文搜索表
                        try {
                            if (messageData.content || messageData.quoteMsg?.content) {
                                console.log('🔍 [DB] 准备同步到全文搜索表...');
                                await new Promise((resolveFts) => {
                                    this.db.run(`
                                        INSERT INTO messages_fts (message_id, content, quote_content, from_user_name)
                                        VALUES (?, ?, ?, ?)
                                    `, [
                                        messageData.message_id || `msg_${Date.now()}`,
                                        messageData.content || '',
                                        messageData.quoteMsg?.content || '',
                                        messageData.from_user_name || ''
                                    ], (err) => {
                                        if (err) {
                                            console.warn('⚠️ [DB] 同步到全文搜索表失败:', err.message);
                                        } else {
                                            console.log('✅ [DB] 全文搜索同步成功');
                                        }
                                        resolveFts();
                                    });
                                });
                            }
                        } catch (ftsErr) {
                            console.warn('⚠️ [DB] 全文搜索处理失败:', ftsErr.message);
                        }
                        resolve();
                    }
                });
            } catch (error) {
                console.error('❌ [DB] 保存消息过程中发生异常:', error.message);
                console.error('❌ [DB] 异常堆栈:', error.stack);
                reject(error);
            }
        });
    }

    // 高级查询消息函数
    async getReceivedMessages(filters = {}) {
        console.log('🔍 [DB] 开始查询消息列表...');
        console.log('📊 [DB] 查询过滤条件:', {
            config_code: filters.config_code?.substring(0, 8) + '...',
            fromUser: filters.fromUser,
            msgType: filters.msgType,
            startTime: filters.startTime,
            endTime: filters.endTime,
            startDate: filters.startDate,
            endDate: filters.endDate,
            keyword: filters.keyword,
            has_conditions: !!filters.conditions?.length,
            limit: filters.limit || 100,
            offset: filters.offset || 0,
            sortField: filters.sortField || filters.orderBy || 'created_at',
            sortOrder: filters.sortOrder || filters.orderDir || 'DESC'
        });
        
        return new Promise((resolve, reject) => {
            try {
                let sql = `
                    SELECT 
                        m.*,
                        (SELECT COUNT(*) FROM received_messages WHERE quote_msg_id = m.message_id) as reply_count
                    FROM received_messages m
                    WHERE 1=1
                `;
                const params = [];
                
                console.log('📝 [DB] 开始构建查询SQL...');
            
            // 支持自定义条件和参数
            if (filters.conditions && filters.conditions.length > 0) {
                sql += ' AND ' + filters.conditions.join(' AND ');
                if (filters.params && Array.isArray(filters.params)) {
                    params.push(...filters.params);
                }
            } else {
                // 按配置代码查询（兼容旧版调用）
                if (filters.config_code) {
                    sql += ' AND m.config_code = ?';
                    params.push(filters.config_code);
                }
                
                // 按用户查询
                if (filters.fromUser) {
                    sql += ' AND m.from_user = ?';
                    params.push(filters.fromUser);
                }
                
                // 按消息类型查询
                if (filters.msgType) {
                    sql += ' AND m.msg_type = ?';
                    params.push(filters.msgType);
                }
                
                // 时间段查询 - 开始时间
                if (filters.startTime) {
                    sql += ' AND m.created_at >= ?';
                    params.push(filters.startTime);
                }
                
                // 时间段查询 - 结束时间
                if (filters.endTime) {
                    sql += ' AND m.created_at <= ?';
                    params.push(filters.endTime);
                }
                
                // 按日期查询 (YYYY-MM-DD)
                if (filters.date) {
                    sql += ' AND m.created_date = ?';
                    params.push(filters.date);
                }
                
                // 按日期范围查询
                if (filters.startDate) {
                    // 对于开始日期，确保包含整个当天的消息
                    sql += ' AND (m.created_date >= ? OR m.created_date LIKE ?)';
                    params.push(filters.startDate);
                    params.push(filters.startDate + ' %'); // 匹配以日期开头且包含时间部分的记录
                }
                
                if (filters.endDate) {
                    // 对于结束日期，确保包含整个当天的消息
                    // 方法：查询created_date小于等于结束日期+1天的开始时间
                    const endDatePlusOne = new Date(filters.endDate);
                    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                    const endDateNextDay = endDatePlusOne.toISOString().split('T')[0];
                    sql += ' AND (m.created_date < ? OR m.created_date LIKE ?)';
                    params.push(endDateNextDay);
                    params.push(filters.endDate + ' %'); // 匹配以日期开头且包含时间部分的记录
                }
                
                // 只查询引用消息
                if (filters.onlyReplies) {
                    sql += ' AND m.is_reply = 1';
                }
                
                // 查询某条消息的所有回复
                if (filters.repliesTo) {
                    sql += ' AND m.quote_msg_id = ?';
                    params.push(filters.repliesTo);
                }
                
                // 内容关键词搜索
                if (filters.keyword) {
                    sql += ` AND (
                        m.content LIKE ? OR 
                        m.quote_content LIKE ? OR
                        m.from_user_name LIKE ?
                    )`;
                    const keyword = `%${filters.keyword}%`;
                    params.push(keyword, keyword, keyword);
                }
            }
            
            // 排序方式
            const orderBy = filters.sortField || filters.orderBy || 'created_at';
            const orderDir = filters.sortOrder || filters.orderDir || 'DESC';
            sql += ` ORDER BY m.${orderBy} ${orderDir}`;
            
            // 分页
            const limit = filters.limit || 100;
            const offset = filters.offset || 0;
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
                console.log('📋 [DB] 最终SQL语句预览:', sql.replace(/\s+/g, ' ').substring(0, 150) + '...');
                console.log('📊 [DB] 查询参数数量:', params.length);
                console.log('📊 [DB] 分页参数:', { limit: filters.limit || 100, offset: filters.offset || 0 });
                
                console.log('🔄 [DB] 执行数据库查询...');
                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error('❌ [DB] 查询消息失败:', {
                            error: err.message,
                            sql_preview: sql.substring(0, 100) + '...',
                            param_count: params.length
                        });
                        reject(err);
                    } else {
                        console.log('✅ [DB] 查询成功完成!', {
                            rows_returned: rows.length,
                            has_data: rows.length > 0,
                            first_message_id: rows.length > 0 ? rows[0].message_id : null,
                            first_message_time: rows.length > 0 ? rows[0].created_at : null
                        });
                        
                        // 记录第一条消息的详细信息，有助于调试
                        if (rows.length > 0) {
                            const firstRow = rows[0];
                            console.log('📋 [DB] 第一条记录样本:', {
                                message_id: firstRow.message_id,
                                config_code: firstRow.config_code?.substring(0, 8) + '...',
                                from_user: firstRow.from_user,
                                msg_type: firstRow.msg_type,
                                created_at: firstRow.created_at,
                                created_date: firstRow.created_date,
                                is_reply: firstRow.is_reply,
                                reply_count: firstRow.reply_count
                            });
                        }
                        
                        resolve(rows);
                    }
                });
            } catch (error) {
                console.error('❌ [DB] 查询消息过程中发生异常:', error.message);
                console.error('❌ [DB] 异常堆栈:', error.stack);
                reject(error);
            }
        });
    }
    
    // 获取符合条件的消息总数
    async getReceivedMessagesCount(filters = {}) {
        console.log('🔢 [DB] 开始统计消息总数...');
        console.log('📊 [DB] 统计过滤条件:', {
            config_code: filters.config_code?.substring(0, 8) + '...',
            fromUser: filters.fromUser,
            msgType: filters.msgType,
            startTime: filters.startTime,
            endTime: filters.endTime,
            startDate: filters.startDate,
            endDate: filters.endDate,
            keyword: filters.keyword,
            has_conditions: !!filters.conditions?.length
        });
        
        return new Promise((resolve, reject) => {
            try {
                let sql = `
                    SELECT COUNT(*) as total
                    FROM received_messages m
                    WHERE 1=1
                `;
                const params = [];
                
                console.log('📝 [DB] 开始构建COUNT查询SQL...');
            
            // 支持自定义条件和参数
            if (filters.conditions && filters.conditions.length > 0) {
                sql += ' AND ' + filters.conditions.join(' AND ');
                if (filters.params && Array.isArray(filters.params)) {
                    params.push(...filters.params);
                }
            } else {
                // 按配置代码查询（兼容旧版调用）
                if (filters.config_code) {
                    sql += ' AND m.config_code = ?';
                    params.push(filters.config_code);
                }
                
                // 按用户查询
                if (filters.fromUser) {
                    sql += ' AND m.from_user = ?';
                    params.push(filters.fromUser);
                }
                
                // 按消息类型查询
                if (filters.msgType) {
                    sql += ' AND m.msg_type = ?';
                    params.push(filters.msgType);
                }
                
                // 时间段查询 - 开始时间
                if (filters.startTime) {
                    sql += ' AND m.created_at >= ?';
                    params.push(filters.startTime);
                }
                
                // 时间段查询 - 结束时间
                if (filters.endTime) {
                    sql += ' AND m.created_at <= ?';
                    params.push(filters.endTime);
                }
                
                // 按日期查询 (YYYY-MM-DD)
                if (filters.date) {
                    sql += ' AND m.created_date = ?';
                    params.push(filters.date);
                }
                
                // 按日期范围查询 - 支持包含时间的created_date格式
                if (filters.startDate) {
                    // 同时支持纯日期和带时间的格式
                    sql += ' AND (m.created_date >= ? OR m.created_date LIKE ?)';
                    params.push(filters.startDate);
                    params.push(filters.startDate + ' %'); // 匹配以该日期开头、包含时间的记录
                }
                
                if (filters.endDate) {
                    // 使用<而不是<=，确保包含结束日期当天的所有记录
                    sql += ' AND (m.created_date < ? OR m.created_date LIKE ?)';
                    params.push(filters.endDate);
                    params.push(filters.endDate + ' %'); // 匹配以该日期开头、包含时间的记录
                }
                
                // 只查询引用消息
                if (filters.onlyReplies) {
                    sql += ' AND m.is_reply = 1';
                }
                
                // 查询某条消息的所有回复
                if (filters.repliesTo) {
                    sql += ' AND m.quote_msg_id = ?';
                    params.push(filters.repliesTo);
                }
                
                // 内容关键词搜索
                if (filters.keyword) {
                    sql += ` AND (
                        m.content LIKE ? OR 
                        m.quote_content LIKE ? OR
                        m.from_user_name LIKE ?
                    )`;
                    const keyword = `%${filters.keyword}%`;
                    params.push(keyword, keyword, keyword);
                }
            }
            
                console.log('📋 [DB] 最终COUNT SQL语句:', sql.replace(/\s+/g, ' '));
                console.log('📊 [DB] COUNT查询参数数量:', params.length);
                
                console.log('🔄 [DB] 执行COUNT查询...');
                this.db.get(sql, params, (err, row) => {
                    if (err) {
                        console.error('❌ [DB] 统计消息总数失败:', {
                            error: err.message,
                            sql_preview: sql.substring(0, 100) + '...',
                            param_count: params.length
                        });
                        reject(err);
                    } else {
                        const total = row ? row.total : 0;
                        console.log('✅ [DB] 统计成功完成!', {
                            total_count: total,
                            config_code: filters.config_code?.substring(0, 8) + '...'
                        });
                        resolve(total);
                    }
                });
            } catch (error) {
                console.error('❌ [DB] 统计消息过程中发生异常:', error.message);
                console.error('❌ [DB] 异常堆栈:', error.stack);
                reject(error);
            }
        });
    }

    // 获取消息的完整对话链
    async getMessageThread(messageId) {
        return new Promise((resolve, reject) => {
            // 递归查询引用链
            const sql = `
                WITH RECURSIVE message_chain AS (
                    -- 起始消息
                    SELECT *, 0 as depth, message_id as root_id
                    FROM received_messages
                    WHERE message_id = ?
                    
                    UNION ALL
                    
                    -- 递归查找被引用的消息
                    SELECT m.*, mc.depth + 1, mc.root_id
                    FROM received_messages m
                    INNER JOIN message_chain mc ON m.message_id = mc.quote_msg_id
                )
                SELECT * FROM message_chain
                ORDER BY depth DESC, created_at ASC
            `;
            
            this.db.all(sql, [messageId], (err, rows) => {
                if (err) {
                    console.error('查询对话链失败:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 高级统计查询
    async getMessageStats(configCode, filters = {}) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN msg_type = 'text' THEN 1 END) as text_count,
                    COUNT(CASE WHEN msg_type = 'image' THEN 1 END) as image_count,
                    COUNT(CASE WHEN msg_type = 'file' THEN 1 END) as file_count,
                    COUNT(CASE WHEN is_reply = 1 THEN 1 END) as reply_count,
                    COUNT(DISTINCT from_user) as user_count,
                    COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread_count,
                    COUNT(CASE WHEN is_read = 1 THEN 1 END) as read_count,
                    COUNT(CASE WHEN created_date = date('now') THEN 1 END) as today_count,
                    MIN(created_at) as first_message_time,
                    MAX(created_at) as last_message_time
                FROM received_messages
                WHERE 1=1
            `;
            const params = [];
            
            // 必须过滤特定配置
            sql += ' AND config_code = ?';
            params.push(configCode);
            
            // 处理日期范围过滤 - 支持包含时间的created_date格式
            if (filters.startDate) {
                // 确保日期格式正确 - 转换为YYYY-MM-DD格式
                const startDateStr = typeof filters.startDate === 'string' ? 
                    filters.startDate : 
                    filters.startDate.toISOString().split('T')[0];
                // 同时支持纯日期和带时间的格式
                sql += ' AND (created_date >= ? OR created_date LIKE ?)';
                params.push(startDateStr);
                params.push(startDateStr + ' %'); // 匹配以该日期开头、包含时间的记录
            }
            
            if (filters.endDate) {
                // 确保日期格式正确 - 转换为YYYY-MM-DD格式
                const endDateStr = typeof filters.endDate === 'string' ? 
                    filters.endDate : 
                    filters.endDate.toISOString().split('T')[0];
                // 计算结束日期的下一天，使用<比较确保包含结束日期当天所有消息
                const endDateObj = new Date(endDateStr);
                endDateObj.setDate(endDateObj.getDate() + 1);
                const endDateNextDay = endDateObj.toISOString().split('T')[0];
                // 使用<而不是<=，确保包含结束日期当天的所有记录
                sql += ' AND (created_date < ? OR created_date LIKE ?)';
                params.push(endDateNextDay); // 使用下一天的日期作为<比较的参数
                params.push(endDateStr + ' %'); // 匹配以该日期开头、包含时间的记录
            }
            
            if (filters.fromUser) {
                sql += ' AND from_user = ?';
                params.push(filters.fromUser);
            }
            
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('统计消息失败:', err.message);
                    reject(err);
                } else {
                    resolve(row || {
                        total: 0,
                        text_count: 0,
                        image_count: 0,
                        file_count: 0,
                        reply_count: 0,
                        user_count: 0,
                        unread_count: 0,
                        read_count: 0,
                        today_count: 0,
                        first_message_time: null,
                        last_message_time: null
                    });
                }
            });
        });
    }

    // 按日期分组统计
    async getMessagesByDate(filters = {}) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT 
                    created_date,
                    COUNT(*) as count,
                    COUNT(DISTINCT from_user) as user_count,
                    GROUP_CONCAT(DISTINCT msg_type) as msg_types
                FROM received_messages
                WHERE 1=1
            `;
            const params = [];
            
            if (filters.startDate) {
                sql += ' AND created_date >= ?';
                params.push(filters.startDate);
            }
            
            if (filters.endDate) {
                sql += ' AND created_date <= ?';
                params.push(filters.endDate);
            }
            
            sql += ' GROUP BY created_date ORDER BY created_date DESC';
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('按日期统计失败:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 根据消息ID获取消息
    async getMessageById(messageId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM received_messages WHERE message_id = ?`;
            this.db.get(sql, [messageId], (err, row) => {
                if (err) {
                    console.error('根据ID查询消息失败:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 更新消息已读状态
    async markMessageAsRead(messageId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE received_messages SET is_read = 1 WHERE message_id = ?`;
            this.db.run(sql, [messageId], function(err) {
                if (err) {
                    console.error('标记消息已读失败:', err.message);
                    reject(err);
                } else {
                    resolve({ updated: this.changes > 0 });
                }
            });
        });
    }
}

module.exports = Database;
