var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-gY6UX1/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-8wN9vG/functionsWorker-0.27857002114833507.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
var DatabaseCF = class {
  static {
    __name(this, "DatabaseCF");
  }
  static {
    __name2(this, "DatabaseCF");
  }
  constructor(db) {
    this.db = db;
  }
  // 初始化数据库表结构
  async init() {
    try {
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
      const indexes = [
        "CREATE INDEX IF NOT EXISTS idx_from_user ON received_messages(from_user)",
        "CREATE INDEX IF NOT EXISTS idx_created_at ON received_messages(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_created_date ON received_messages(created_date)",
        "CREATE INDEX IF NOT EXISTS idx_msg_type ON received_messages(msg_type)",
        "CREATE INDEX IF NOT EXISTS idx_config_code ON received_messages(config_code)",
        "CREATE INDEX IF NOT EXISTS idx_composite ON received_messages(from_user, created_at)"
      ];
      for (const indexSql of indexes) {
        await this.db.prepare(indexSql).run();
      }
      console.log("\u2705 D1 \u6570\u636E\u5E93\u521D\u59CB\u5316\u6210\u529F");
    } catch (error) {
      console.error("\u274C D1 \u6570\u636E\u5E93\u521D\u59CB\u5316\u5931\u8D25:", error);
      throw error;
    }
  }
  // 保存配置
  async saveConfiguration(config) {
    const {
      code,
      corpid,
      encrypted_corpsecret,
      agentid,
      touser,
      description,
      callback_token,
      encrypted_encoding_aes_key,
      callback_enabled
    } = config;
    const result = await this.db.prepare(`
            INSERT OR REPLACE INTO configurations (
                code, corpid, encrypted_corpsecret, agentid, touser, description,
                callback_token, encrypted_encoding_aes_key, callback_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      code,
      corpid,
      encrypted_corpsecret,
      agentid,
      touser,
      description,
      callback_token,
      encrypted_encoding_aes_key,
      callback_enabled || 0
    ).run();
    return { id: result.meta.last_row_id, code };
  }
  // 根据 code 获取配置
  async getConfigurationByCode(code) {
    const result = await this.db.prepare(
      "SELECT * FROM configurations WHERE code = ?"
    ).bind(code).first();
    return result;
  }
  // 更新配置
  async updateConfiguration(config) {
    const {
      code,
      corpid,
      encrypted_corpsecret,
      agentid,
      touser,
      description,
      callback_token,
      encrypted_encoding_aes_key,
      callback_enabled
    } = config;
    await this.db.prepare(`
            UPDATE configurations 
            SET corpid = ?, encrypted_corpsecret = ?, agentid = ?, touser = ?, description = ?,
                callback_token = ?, encrypted_encoding_aes_key = ?, callback_enabled = ?
            WHERE code = ?
        `).bind(
      corpid,
      encrypted_corpsecret,
      agentid,
      touser,
      description,
      callback_token,
      encrypted_encoding_aes_key,
      callback_enabled,
      code
    ).run();
    return { code };
  }
  // 保存接收到的消息
  async saveReceivedMessage(messageData) {
    const createTime = messageData.createTime || Math.floor(Date.now() / 1e3);
    const beijingTime = createTime * 1e3 + 8 * 60 * 60 * 1e3;
    const date = new Date(beijingTime);
    const beijingTimestamp = Math.floor(beijingTime / 1e3);
    const dateStr = date.toISOString().replace("Z", "").replace("T", " ");
    const isoTimeStr = date.toISOString().split(".")[0] + "Z";
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
      messageData.config_code || "",
      messageData.from_user || "unknown_user",
      messageData.from_user_name || messageData.from_user || "unknown",
      messageData.to_user || "",
      messageData.agent_id || "",
      messageData.msg_type || "text",
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
    console.log("\u2705 \u6D88\u606F\u4FDD\u5B58\u6210\u529F:", messageData.message_id);
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
      sql += " AND m.config_code = ?";
      params.push(filters.config_code);
    }
    if (filters.fromUser) {
      sql += " AND m.from_user = ?";
      params.push(filters.fromUser);
    }
    if (filters.msgType) {
      sql += " AND m.msg_type = ?";
      params.push(filters.msgType);
    }
    if (filters.startDate) {
      sql += " AND (m.created_date >= ? OR m.created_date LIKE ?)";
      params.push(filters.startDate, filters.startDate + " %");
    }
    if (filters.endDate) {
      const endDatePlusOne = new Date(filters.endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      const endDateNextDay = endDatePlusOne.toISOString().split("T")[0];
      sql += " AND (m.created_date < ? OR m.created_date LIKE ?)";
      params.push(endDateNextDay, filters.endDate + " %");
    }
    if (filters.keyword) {
      sql += ` AND (m.content LIKE ? OR m.quote_content LIKE ? OR m.from_user_name LIKE ?)`;
      const keyword = `%${filters.keyword}%`;
      params.push(keyword, keyword, keyword);
    }
    const orderBy = filters.sortField || filters.orderBy || "created_at";
    const orderDir = filters.sortOrder || filters.orderDir || "DESC";
    sql += ` ORDER BY m.${orderBy} ${orderDir}`;
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const stmt = this.db.prepare(sql).bind(...params);
    const result = await stmt.all();
    return result.results || [];
  }
  // 获取消息总数
  async getReceivedMessagesCount(filters = {}) {
    let sql = "SELECT COUNT(*) as total FROM received_messages m WHERE 1=1";
    const params = [];
    if (filters.config_code) {
      sql += " AND m.config_code = ?";
      params.push(filters.config_code);
    }
    if (filters.fromUser) {
      sql += " AND m.from_user = ?";
      params.push(filters.fromUser);
    }
    if (filters.msgType) {
      sql += " AND m.msg_type = ?";
      params.push(filters.msgType);
    }
    if (filters.startDate) {
      sql += " AND (m.created_date >= ? OR m.created_date LIKE ?)";
      params.push(filters.startDate, filters.startDate + " %");
    }
    if (filters.endDate) {
      const endDatePlusOne = new Date(filters.endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      const endDateNextDay = endDatePlusOne.toISOString().split("T")[0];
      sql += " AND (m.created_date < ? OR m.created_date LIKE ?)";
      params.push(endDateNextDay, filters.endDate + " %");
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
      sql += " AND (created_date >= ? OR created_date LIKE ?)";
      params.push(filters.startDate, filters.startDate + " %");
    }
    if (filters.endDate) {
      const endDatePlusOne = new Date(filters.endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      const endDateNextDay = endDatePlusOne.toISOString().split("T")[0];
      sql += " AND (created_date < ? OR created_date LIKE ?)";
      params.push(endDateNextDay, filters.endDate + " %");
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
      "UPDATE received_messages SET is_read = 1 WHERE message_id = ?"
    ).bind(messageId).run();
    return result.meta.changes > 0;
  }
};
function str2ab(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}
__name(str2ab, "str2ab");
__name2(str2ab, "str2ab");
function ab2str(buffer) {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}
__name(ab2str, "ab2str");
__name2(ab2str, "ab2str");
function ab2base64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
__name(ab2base64, "ab2base64");
__name2(ab2base64, "ab2base64");
function base642ab(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
__name(base642ab, "base642ab");
__name2(base642ab, "base642ab");
async function deriveKey(password) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    str2ab(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: str2ab("wechat-notifier-salt"),
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
__name(deriveKey, "deriveKey");
__name2(deriveKey, "deriveKey");
async function encrypt(text, password) {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    str2ab(text)
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return ab2base64(combined.buffer);
}
__name(encrypt, "encrypt");
__name2(encrypt, "encrypt");
async function decrypt(encryptedText, password) {
  const key = await deriveKey(password);
  const combined = new Uint8Array(base642ab(encryptedText));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    encrypted
  );
  return ab2str(decrypted);
}
__name(decrypt, "decrypt");
__name2(decrypt, "decrypt");
async function getAccessToken(db, cache, encryptionKey, corpid, encryptedCorpsecret) {
  const cacheKey = `access_token_${corpid}`;
  if (cache) {
    const cached = await cache.get(cacheKey, "json");
    if (cached && cached.expires_at > Date.now()) {
      return cached.token;
    }
  }
  const corpsecret = await decrypt(encryptedCorpsecret, encryptionKey);
  const response = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`
  );
  const data = await response.json();
  if (data.errcode !== 0) {
    throw new Error(`\u83B7\u53D6access_token\u5931\u8D25: ${data.errmsg}`);
  }
  if (cache) {
    await cache.put(cacheKey, JSON.stringify({
      token: data.access_token,
      expires_at: Date.now() + (data.expires_in - 300) * 1e3
    }), {
      expirationTtl: data.expires_in - 300
    });
  }
  return data.access_token;
}
__name(getAccessToken, "getAccessToken");
__name2(getAccessToken, "getAccessToken");
async function validateCredentials(corpid, corpsecret) {
  const response = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`
  );
  const data = await response.json();
  if (data.errcode !== 0) {
    throw new Error(`\u51ED\u8BC1\u9A8C\u8BC1\u5931\u8D25: ${data.errmsg}`);
  }
  const usersResponse = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/user/list?access_token=${data.access_token}&department_id=1`
  );
  const usersData = await usersResponse.json();
  if (usersData.errcode !== 0) {
    throw new Error(`\u83B7\u53D6\u6210\u5458\u5217\u8868\u5931\u8D25: ${usersData.errmsg}`);
  }
  return usersData.userlist || [];
}
__name(validateCredentials, "validateCredentials");
__name2(validateCredentials, "validateCredentials");
async function createConfiguration(db, encryptionKey, config) {
  const dbInstance = new DatabaseCF(db);
  const { corpid, corpsecret, agentid, touser, description } = config;
  const code = generateCode();
  const encrypted_corpsecret = await encrypt(corpsecret, encryptionKey);
  await dbInstance.saveConfiguration({
    code,
    corpid,
    encrypted_corpsecret,
    agentid,
    touser,
    description: description || "",
    callback_enabled: 0
  });
  return { code, message: "\u914D\u7F6E\u521B\u5EFA\u6210\u529F" };
}
__name(createConfiguration, "createConfiguration");
__name2(createConfiguration, "createConfiguration");
async function getConfiguration(db, encryptionKey, code) {
  const dbInstance = new DatabaseCF(db);
  const config = await dbInstance.getConfigurationByCode(code);
  if (!config) {
    return null;
  }
  return {
    code: config.code,
    corpid: config.corpid,
    agentid: config.agentid,
    touser: config.touser,
    description: config.description,
    callback_enabled: config.callback_enabled,
    created_at: config.created_at
  };
}
__name(getConfiguration, "getConfiguration");
__name2(getConfiguration, "getConfiguration");
async function updateConfiguration(db, encryptionKey, code, updates) {
  const dbInstance = new DatabaseCF(db);
  const existingConfig = await dbInstance.getConfigurationByCode(code);
  if (!existingConfig) {
    throw new Error("\u914D\u7F6E\u4E0D\u5B58\u5728");
  }
  const updatedConfig = {
    code,
    corpid: updates.corpid || existingConfig.corpid,
    encrypted_corpsecret: updates.corpsecret ? await encrypt(updates.corpsecret, encryptionKey) : existingConfig.encrypted_corpsecret,
    agentid: updates.agentid || existingConfig.agentid,
    touser: updates.touser || existingConfig.touser,
    description: updates.description !== void 0 ? updates.description : existingConfig.description,
    callback_token: updates.callback_token || existingConfig.callback_token,
    encrypted_encoding_aes_key: updates.encoding_aes_key ? await encrypt(updates.encoding_aes_key, encryptionKey) : existingConfig.encrypted_encoding_aes_key,
    callback_enabled: updates.callback_enabled !== void 0 ? updates.callback_enabled : existingConfig.callback_enabled
  };
  await dbInstance.updateConfiguration(updatedConfig);
  return { code, message: "\u914D\u7F6E\u66F4\u65B0\u6210\u529F" };
}
__name(updateConfiguration, "updateConfiguration");
__name2(updateConfiguration, "updateConfiguration");
async function sendNotification(db, cache, encryptionKey, code, title, content) {
  const dbInstance = new DatabaseCF(db);
  const config = await dbInstance.getConfigurationByCode(code);
  if (!config) {
    throw new Error("\u672A\u627E\u5230\u914D\u7F6E");
  }
  const accessToken = await getAccessToken(db, cache, encryptionKey, config.corpid, config.encrypted_corpsecret);
  const message = {
    touser: config.touser,
    msgtype: "text",
    agentid: config.agentid,
    text: {
      content: title ? `${title}
${content}` : content
    }
  };
  const response = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    }
  );
  const result = await response.json();
  if (result.errcode !== 0) {
    throw new Error(`\u53D1\u9001\u6D88\u606F\u5931\u8D25: ${result.errmsg}`);
  }
  return result;
}
__name(sendNotification, "sendNotification");
__name2(sendNotification, "sendNotification");
async function sendEnhancedNotification(db, cache, encryptionKey, code, messageData) {
  const dbInstance = new DatabaseCF(db);
  const config = await dbInstance.getConfigurationByCode(code);
  if (!config) {
    throw new Error("\u672A\u627E\u5230\u914D\u7F6E");
  }
  const accessToken = await getAccessToken(db, cache, encryptionKey, config.corpid, config.encrypted_corpsecret);
  let message = {
    touser: config.touser,
    agentid: config.agentid,
    msgtype: messageData.type
  };
  switch (messageData.type) {
    case "text":
      message.text = { content: messageData.content };
      break;
    case "textcard":
      message.textcard = {
        title: messageData.title,
        description: messageData.description,
        url: messageData.url,
        btntxt: messageData.btntxt || "\u8BE6\u60C5"
      };
      break;
    case "markdown":
      message.markdown = { content: messageData.content };
      break;
    case "news":
      message.news = { articles: messageData.articles };
      break;
    default:
      throw new Error(`\u4E0D\u652F\u6301\u7684\u6D88\u606F\u7C7B\u578B: ${messageData.type}`);
  }
  const response = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    }
  );
  const result = await response.json();
  if (result.errcode !== 0) {
    throw new Error(`\u53D1\u9001\u6D88\u606F\u5931\u8D25: ${result.errmsg}`);
  }
  return result;
}
__name(sendEnhancedNotification, "sendEnhancedNotification");
__name2(sendEnhancedNotification, "sendEnhancedNotification");
async function queryMessages(db, code, queryParams) {
  const dbInstance = new DatabaseCF(db);
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || parseInt(queryParams.pageSize) || 20;
  const offset = (page - 1) * limit;
  const filters = {
    config_code: code,
    limit,
    offset,
    sortField: queryParams.sortBy || "created_at",
    sortOrder: queryParams.sortOrder || "desc",
    startDate: queryParams.startDate,
    endDate: queryParams.endDate,
    msgType: queryParams.msgType,
    keyword: queryParams.keyword,
    fromUser: queryParams.fromUser
  };
  const messages = await dbInstance.getReceivedMessages(filters);
  const total = await dbInstance.getReceivedMessagesCount(filters);
  return {
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
__name(queryMessages, "queryMessages");
__name2(queryMessages, "queryMessages");
async function handleCallbackVerification(db, encryptionKey, code, msg_signature, timestamp, nonce, echostr) {
  const dbInstance = new DatabaseCF(db);
  const config = await dbInstance.getConfigurationByCode(code);
  if (!config || !config.callback_enabled) {
    return { success: false, error: "\u56DE\u8C03\u672A\u542F\u7528" };
  }
  return { success: true, data: echostr };
}
__name(handleCallbackVerification, "handleCallbackVerification");
__name2(handleCallbackVerification, "handleCallbackVerification");
async function handleCallbackMessage(db, encryptionKey, code, encryptedData, msg_signature, timestamp, nonce) {
  const dbInstance = new DatabaseCF(db);
  const config = await dbInstance.getConfigurationByCode(code);
  if (!config || !config.callback_enabled) {
    return { success: false, error: "\u56DE\u8C03\u672A\u542F\u7528" };
  }
  return { success: true, message: "\u6D88\u606F\u5904\u7406\u6210\u529F" };
}
__name(handleCallbackMessage, "handleCallbackMessage");
__name2(handleCallbackMessage, "handleCallbackMessage");
function generateCode() {
  return "cf_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
__name(generateCode, "generateCode");
__name2(generateCode, "generateCode");
async function onRequestPost(context) {
  const { request, env, params } = context;
  const { code } = params;
  try {
    const messageData = await request.json();
    if (!messageData.type) {
      return new Response(JSON.stringify({
        error: "\u7F3A\u5C11\u6D88\u606F\u7C7B\u578B(type)\u53C2\u6570"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("\u{1F4E5} \u6536\u5230\u589E\u5F3A\u6D88\u606F\u8BF7\u6C42:", {
      code: code.substring(0, 8) + "...",
      type: messageData.type
    });
    const result = await sendEnhancedNotification(env.DB, env.CACHE, env.ENCRYPTION_KEY, code, messageData);
    return new Response(JSON.stringify({
      message: "\u53D1\u9001\u6210\u529F",
      response: result,
      messageType: messageData.type
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u53D1\u9001\u589E\u5F3A\u6D88\u606F\u5931\u8D25:", error);
    const status = error.message?.includes("\u672A\u627E\u5230\u914D\u7F6E") ? 404 : 500;
    return new Response(JSON.stringify({
      error: error.message || "\u6D88\u606F\u53D1\u9001\u5931\u8D25"
    }), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequestGet(context) {
  const { request, env, params } = context;
  const { code } = params;
  const url = new URL(request.url);
  const msg_signature = url.searchParams.get("msg_signature");
  const timestamp = url.searchParams.get("timestamp");
  const nonce = url.searchParams.get("nonce");
  const echostr = url.searchParams.get("echostr");
  if (!msg_signature || !timestamp || !nonce || !echostr) {
    return new Response(JSON.stringify({
      error: "\u7F3A\u5C11\u5FC5\u8981\u7684\u9A8C\u8BC1\u53C2\u6570"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const result = await handleCallbackVerification(env.DB, env.ENCRYPTION_KEY, code, msg_signature, timestamp, nonce, echostr);
    if (result.success) {
      return new Response(result.data, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    } else {
      console.error("\u56DE\u8C03\u9A8C\u8BC1\u5931\u8D25:", result.error);
      return new Response("failed", {
        status: 400,
        headers: { "Content-Type": "text/plain" }
      });
    }
  } catch (error) {
    console.error("\u56DE\u8C03\u9A8C\u8BC1\u5F02\u5E38:", error);
    return new Response("failed", {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost2(context) {
  const { request, env, params } = context;
  const { code } = params;
  const url = new URL(request.url);
  const msg_signature = url.searchParams.get("msg_signature");
  const timestamp = url.searchParams.get("timestamp");
  const nonce = url.searchParams.get("nonce");
  if (!msg_signature || !timestamp || !nonce) {
    return new Response(JSON.stringify({
      error: "\u7F3A\u5C11\u5FC5\u8981\u7684\u9A8C\u8BC1\u53C2\u6570"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const encryptedData = await request.text();
    if (!encryptedData) {
      return new Response(JSON.stringify({
        error: "\u6D88\u606F\u6570\u636E\u4E3A\u7A7A"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const result = await handleCallbackMessage(env.DB, env.ENCRYPTION_KEY, code, encryptedData, msg_signature, timestamp, nonce);
    if (result.success) {
      console.log("\u56DE\u8C03\u6D88\u606F\u5904\u7406\u6210\u529F:", result.message);
      return new Response("ok", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    } else {
      console.error("\u56DE\u8C03\u6D88\u606F\u5904\u7406\u5931\u8D25:", result.error);
      return new Response("failed", {
        status: 400,
        headers: { "Content-Type": "text/plain" }
      });
    }
  } catch (error) {
    console.error("\u56DE\u8C03\u6D88\u606F\u5904\u7406\u5F02\u5E38:", error);
    return new Response("failed", {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
async function onRequestGet2(context) {
  const { env, params } = context;
  const { code } = params;
  try {
    const config = await getConfiguration(env.DB, env.ENCRYPTION_KEY, code);
    if (!config) {
      return new Response(JSON.stringify({
        error: "\u672A\u627E\u5230\u914D\u7F6E"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("\u83B7\u53D6\u914D\u7F6E\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      error: error.message || "\u83B7\u53D6\u914D\u7F6E\u5931\u8D25"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function onRequestPut(context) {
  const { request, env, params } = context;
  const { code } = params;
  try {
    const body = await request.json();
    const result = await updateConfiguration(env.DB, env.ENCRYPTION_KEY, code, body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u66F4\u65B0\u914D\u7F6E\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      error: error.message || "\u66F4\u65B0\u914D\u7F6E\u5931\u8D25"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPut, "onRequestPut");
__name2(onRequestPut, "onRequestPut");
async function onRequestGet3(context) {
  const { request, env, params } = context;
  const { code } = params;
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    console.log("\u{1F4E5} \u6536\u5230\u6D88\u606F\u67E5\u8BE2\u8BF7\u6C42:", {
      code: code.substring(0, 8) + "...",
      params: queryParams
    });
    const result = await queryMessages(env.DB, code, queryParams);
    return new Response(JSON.stringify({
      success: true,
      data: result,
      timestamp: Date.now()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("\u67E5\u8BE2\u6D88\u606F\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "\u6D88\u606F\u67E5\u8BE2\u5931\u8D25"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
async function onRequestPost3(context) {
  const { request, env, params } = context;
  const { code } = params;
  try {
    const body = await request.json();
    const { title, content } = body;
    if (!content) {
      return new Response(JSON.stringify({
        error: "\u6D88\u606F\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const result = await sendNotification(env.DB, env.CACHE, env.ENCRYPTION_KEY, code, title, content);
    return new Response(JSON.stringify({
      message: "\u53D1\u9001\u6210\u529F",
      response: result
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u53D1\u9001\u901A\u77E5\u5931\u8D25:", error);
    const status = error.message?.includes("\u672A\u627E\u5230\u914D\u7F6E") ? 404 : 500;
    return new Response(JSON.stringify({
      error: error.message || "\u6D88\u606F\u53D1\u9001\u5931\u8D25"
    }), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
async function onRequestPost4(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { corpid, corpsecret, agentid, touser, description } = body;
    if (!corpid || !corpsecret || !agentid || !touser) {
      return new Response(JSON.stringify({
        error: "\u53C2\u6570\u4E0D\u5B8C\u6574\uFF0C\u9700\u8981\u63D0\u4F9B corpid, corpsecret, agentid, touser"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const result = await createConfiguration(env.DB, env.ENCRYPTION_KEY, {
      corpid,
      corpsecret,
      agentid,
      touser,
      description
    });
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u4FDD\u5B58\u914D\u7F6E\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      error: error.message || "\u914D\u7F6E\u4FDD\u5B58\u5931\u8D25"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost4, "onRequestPost4");
__name2(onRequestPost4, "onRequestPost");
async function onRequestPost5(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { corpid, corpsecret } = body;
    if (!corpid || !corpsecret) {
      return new Response(JSON.stringify({
        error: "\u53C2\u6570\u4E0D\u5B8C\u6574\uFF0C\u9700\u8981\u63D0\u4F9B corpid \u548C corpsecret"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const users = await validateCredentials(corpid, corpsecret);
    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u9A8C\u8BC1\u51ED\u8BC1\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      error: error.message || "\u51ED\u8BC1\u9A8C\u8BC1\u5931\u8D25"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost5, "onRequestPost5");
__name2(onRequestPost5, "onRequestPost");
async function onRequest(context) {
  const { request, next, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  const start = Date.now();
  const url = new URL(request.url);
  console.log(`${request.method} ${url.pathname}`);
  try {
    const response = await next();
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    const duration = Date.now() - start;
    console.log(`${request.method} ${url.pathname} - ${response.status} (${duration}ms)`);
    return newResponse;
  } catch (error) {
    console.error("\u8BF7\u6C42\u5904\u7406\u9519\u8BEF:", error);
    return new Response(JSON.stringify({
      error: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF",
      message: error.message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var routes = [
  {
    routePath: "/api/notify/:code/enhanced",
    mountPath: "/api/notify/:code",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/callback/:code",
    mountPath: "/api/callback",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/callback/:code",
    mountPath: "/api/callback",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/configuration/:code",
    mountPath: "/api/configuration",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/configuration/:code",
    mountPath: "/api/configuration",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/messages/:code",
    mountPath: "/api/messages",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/notify/:code",
    mountPath: "/api/notify",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/configure",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/validate",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// C:/Users/15268/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// C:/Users/15268/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-gY6UX1/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// C:/Users/15268/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-gY6UX1/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.27857002114833507.js.map
