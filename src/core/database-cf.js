/**
 * Cloudflare D1 数据库操作模块
 * 适配 D1 数据库的 API
 */

export class DatabaseCF {
    constructor(db) {
        this.db = db;
    }

    // 初始化数据库表结构
    async init() {
        try {
            // 创建 configurations 表
            await this.db.prepare(`
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
            `).run();

            // 创建 received_messages 表
            await this.db.prepare(`
                CREATE TABLE IF NOT EXISTS received_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id TEXT UNIQUE NOT NULL,
                    from_user TEXT NOT NULL,
                    from_user_name TEXT,
                    to_user TEXT,
                    agent_id TEXT,
                    msg_type TEXT NOT NULL,
                    content TEXT,
                    media_id TEXT,
                    pic_url TEXT,
                    file_name TEXT,
                    file_size INTEGER,
                    quote_msg_id TEXT,
                    quote_content TEXT,
                    quote_from_user TEXT,
                    quote_from_user_name TEXT,
                    quote_msg_type TEXT,
                    event_type TEXT,
                    event_key TEXT,
                    created_at INTEGER NOT NULL,
                    created_time TEXT NOT NULL,
                    created_date TEXT NOT NULL,
                    is_reply INTEGER DEFAULT 0,
                    is_read INTEGER DEFAULT 0,
                    config_code TEXT NOT NULL,
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
                )
            `).run();

            // 创建索引
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_from_user ON received_messages(from_user)',
                'CREATE INDEX IF NOT EXISTS idx_created_at ON received_messages(created_at)',
                'CREATE INDEX IF NOT EXISTS idx_created_date ON received_messages(created_date)',
                'CREATE INDEX IF NOT EXISTS idx_msg_type ON received_messages(msg_type)',
                'CREATE INDEX IF NOT EXISTS idx_config_code ON received_messages(config_code)',
                'CREATE INDEX IF NOT EXISTS idx_composite ON received_messages(from_user, created_at)'
            ];

            for (const indexSql of indexes) {
                await this.db.prepare(indexSql).run();
            }

            console.log('✅ D1 数据库初始化成功');
        } catch (error) {
            console.error('❌ D1 数据库初始化失败:', error);
            throw error;
        }
    }

    // 保存配置
    async saveConfiguration(config) {
        const { code, corpid, encrypted_corpsecret, agentid, touser, description,
            callback_token, encrypted_encoding_aes_key, callback_enabled } = config;

        const result = await this.db.prepare(`
            INSERT OR REPLACE INTO configurations (
                code, corpid, encrypted_corpsecret, agentid, touser, description,
                callback_token, encrypted_encoding_aes_key, callback_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            code, corpid, encrypted_corpsecret, agentid, touser, description,
            callback_token, encrypted_encoding_aes_key, callback_enabled || 0
        ).run();

        return { id: result.meta.last_row_id, code };
    }

    // 根据 code 获取配置
    async getConfigurationByCode(code) {
        const result = await this.db.prepare(
            'SELECT * FROM configurations WHERE code = ?'
        ).bind(code).first();

        return result;
    }

    // 更新配置
    async updateConfiguration(config) {
        const { code, corpid, encrypted_corpsecret, agentid, touser, description,
            callback_token, encrypted_encoding_aes_key, callback_enabled } = config;

        await this.db.prepare(`
            UPDATE configurations 
            SET corpid = ?, encrypted_corpsecret = ?, agentid = ?, touser = ?, description = ?,
                callback_token = ?, encrypted_encoding_aes_key = ?, callback_enabled = ?
            WHERE code = ?
        `).bind(
            corpid, encrypted_corpsecret, agentid, touser, description,
            callback_token, encrypted_encoding_aes_key, callback_enabled,
            code
        ).run();

        return { code };
    }

    // 保存接收到的消息
    async saveReceivedMessage(messageData) {
        const createTime = messageData.createTime || Math.floor(Date.now() / 1000);
        const beijingTime = createTime * 1000 + 8 * 60 * 60 * 1000;
        const date = new Date(beijingTime);
        const beijingTimestamp = Math.floor(beijingTime / 1000);
        const dateStr = date.toISOString().replace('Z', '').replace('T', ' ');
        const isoTimeStr = date.toISOString().split('.')[0] + 'Z';
        const isReply = messageData.quoteMsg ? 1 : 0;

        await this.db.prepare(`
            INSERT OR REPLACE INTO received_messages (
                message_id, config_code, from_user, from_user_name, to_user, agent_id,
                msg_type, content, media_id, pic_url, file_name, file_size,
                quote_msg_id, quote_content, quote_from_user, quote_from_user_name, quote_msg_type,
                event_type, event_key,
                created_at, created_time, created_date, is_reply, is_read,
                format, recognition, thumb_media_id, location_x, location_y, scale, label,
                title, description, url, app_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            messageData.message_id || `msg_${Date.now()}`,
            messageData.config_code || '',
            messageData.from_user || 'unknown_user',
            messageData.from_user_name || messageData.from_user || 'unknown',
            messageData.to_user || '',
            messageData.agent_id || '',
            messageData.msg_type || 'text',
            messageData.content || null,
            messageData.media_id || null,
            messageData.pic_url || null,
            messageData.file_name || null,
            messageData.file_size || null,
            messageData.quoteMsg?.msgId || messageData.quote_msg_id || null,
            messageData.quoteMsg?.content || messageData.quote_content || null,
            messageData.quoteMsg?.fromUser || messageData.quote_from_user || null,
            messageData.quoteMsg?.fromUserName || messageData.quote_from_user_name || null,
            messageData.quoteMsg?.msgType || messageData.quote_msg_type || null,
            messageData.event_type || null,
            messageData.event_key || null,
            beijingTimestamp,
            isoTimeStr,
            dateStr,
            isReply,
            0,
            messageData.format || null,
            messageData.recognition || null,
            messageData.thumb_media_id || null,
            messageData.location_x || messageData.location_X || null,
            messageData.location_y || messageData.location_Y || null,
            messageData.scale || null,
            messageData.label || null,
            messageData.title || null,
            messageData.description || null,
            messageData.url || null,
            messageData.app_type || null
        ).run();

        console.log('✅ 消息保存成功:', messageData.message_id);
    }

    // 查询消息
    async getReceivedMessages(filters = {}) {
        let sql = `
            SELECT 
                m.*,
                (SELECT COUNT(*) FROM received_messages WHERE quote_msg_id = m.message_id) as reply_count
            FROM received_messages m
            WHERE 1=1
        `;
        const params = [];

        if (filters.config_code) {
            sql += ' AND m.config_code = ?';
            params.push(filters.config_code);
        }

        if (filters.fromUser) {
            sql += ' AND m.from_user = ?';
            params.push(filters.fromUser);
        }

        if (filters.msgType) {
            sql += ' AND m.msg_type = ?';
            params.push(filters.msgType);
        }

        if (filters.startDate) {
            sql += ' AND (m.created_date >= ? OR m.created_date LIKE ?)';
            params.push(filters.startDate, filters.startDate + ' %');
        }

        if (filters.endDate) {
            const endDatePlusOne = new Date(filters.endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            const endDateNextDay = endDatePlusOne.toISOString().split('T')[0];
            sql += ' AND (m.created_date < ? OR m.created_date LIKE ?)';
            params.push(endDateNextDay, filters.endDate + ' %');
        }

        if (filters.keyword) {
            sql += ` AND (m.content LIKE ? OR m.quote_content LIKE ? OR m.from_user_name LIKE ?)`;
            const keyword = `%${filters.keyword}%`;
            params.push(keyword, keyword, keyword);
        }

        const orderBy = filters.sortField || filters.orderBy || 'created_at';
        const orderDir = filters.sortOrder || filters.orderDir || 'DESC';
        sql += ` ORDER BY m.${orderBy} ${orderDir}`;

        const limit = filters.limit || 100;
        const offset = filters.offset || 0;
        sql += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const stmt = this.db.prepare(sql).bind(...params);
        const result = await stmt.all();

        return result.results || [];
    }

    // 获取消息总数
    async getReceivedMessagesCount(filters = {}) {
        let sql = 'SELECT COUNT(*) as total FROM received_messages m WHERE 1=1';
        const params = [];

        if (filters.config_code) {
            sql += ' AND m.config_code = ?';
            params.push(filters.config_code);
        }

        if (filters.fromUser) {
            sql += ' AND m.from_user = ?';
            params.push(filters.fromUser);
        }

        if (filters.msgType) {
            sql += ' AND m.msg_type = ?';
            params.push(filters.msgType);
        }

        if (filters.startDate) {
            sql += ' AND (m.created_date >= ? OR m.created_date LIKE ?)';
            params.push(filters.startDate, filters.startDate + ' %');
        }

        if (filters.endDate) {
            const endDatePlusOne = new Date(filters.endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            const endDateNextDay = endDatePlusOne.toISOString().split('T')[0];
            sql += ' AND (m.created_date < ? OR m.created_date LIKE ?)';
            params.push(endDateNextDay, filters.endDate + ' %');
        }

        if (filters.keyword) {
            sql += ` AND (m.content LIKE ? OR m.quote_content LIKE ? OR m.from_user_name LIKE ?)`;
            const keyword = `%${filters.keyword}%`;
            params.push(keyword, keyword, keyword);
        }

        const result = await this.db.prepare(sql).bind(...params).first();
        return result?.total || 0;
    }

    // 获取消息统计
    async getMessageStats(configCode, filters = {}) {
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
                COUNT(CASE WHEN created_date = date('now') THEN 1 END) as today_count
            FROM received_messages
            WHERE config_code = ?
        `;
        const params = [configCode];

        if (filters.startDate) {
            sql += ' AND (created_date >= ? OR created_date LIKE ?)';
            params.push(filters.startDate, filters.startDate + ' %');
        }

        if (filters.endDate) {
            const endDatePlusOne = new Date(filters.endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            const endDateNextDay = endDatePlusOne.toISOString().split('T')[0];
            sql += ' AND (created_date < ? OR created_date LIKE ?)';
            params.push(endDateNextDay, filters.endDate + ' %');
        }

        const result = await this.db.prepare(sql).bind(...params).first();
        return result || {
            total: 0,
            text_count: 0,
            image_count: 0,
            file_count: 0,
            reply_count: 0,
            user_count: 0,
            unread_count: 0,
            read_count: 0,
            today_count: 0
        };
    }

    // 标记消息为已读
    async markMessageAsRead(messageId) {
        const result = await this.db.prepare(
            'UPDATE received_messages SET is_read = 1 WHERE message_id = ?'
        ).bind(messageId).run();

        return result.meta.changes > 0;
    }
}
