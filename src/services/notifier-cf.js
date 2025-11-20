/**
 * Cloudflare 版本的通知服务
 * 适配 D1 数据库和 Workers 环境
 */
import { DatabaseCF } from '../core/database-cf.js';
import { encrypt, decrypt } from '../core/crypto-cf.js';

// 缓存 access_token（使用 KV 或内存）
async function getAccessToken(db, cache, encryptionKey, corpid, encryptedCorpsecret, proxyUrl = null) {
    // 验证必需参数
    if (!corpid) {
        throw new Error('CorpID 不能为空');
    }
    
    if (!encryptedCorpsecret) {
        throw new Error('CorpSecret 未配置，请完成配置的第二步');
    }
    
    const cacheKey = `access_token_${corpid}`;
    
    // 尝试从 KV 缓存获取
    if (cache) {
        try {
            const cached = await cache.get(cacheKey, 'json');
            if (cached && cached.expires_at > Date.now()) {
                return cached.token;
            }
        } catch (cacheError) {
            console.warn('从缓存获取 token 失败:', cacheError.message);
        }
    }
    
    // 解密 corpsecret
    let corpsecret;
    try {
        corpsecret = await decrypt(encryptedCorpsecret, encryptionKey);
    } catch (decryptError) {
        throw new Error(`解密 CorpSecret 失败: ${decryptError.message}`);
    }
    
    // 从企业微信获取新 token
    const url = buildWeChatAPIUrl(
        `cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`,
        proxyUrl
    );
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.errcode !== 0) {
        throw new Error(`获取access_token失败: ${data.errmsg} (错误码: ${data.errcode})`);
    }
    
    // 缓存到 KV（提前5分钟过期）
    if (cache) {
        try {
            await cache.put(cacheKey, JSON.stringify({
                token: data.access_token,
                expires_at: Date.now() + (data.expires_in - 300) * 1000
            }), {
                expirationTtl: data.expires_in - 300
            });
        } catch (cacheError) {
            console.warn('缓存 token 失败:', cacheError.message);
        }
    }
    
    return data.access_token;
}

// 构建企业微信 API URL（支持代理）
function buildWeChatAPIUrl(endpoint, proxyUrl) {
    if (proxyUrl) {
        // 使用代理服务器
        return `${proxyUrl}/${endpoint}`;
    }
    // 直接访问企业微信 API
    return `https://qyapi.weixin.qq.com/${endpoint}`;
}

// 验证企业微信凭证
export async function validateCredentials(corpid, corpsecret, proxyUrl = null) {
    const url = buildWeChatAPIUrl(
        `cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`,
        proxyUrl
    );
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.errcode !== 0) {
        throw new Error(`凭证验证失败: ${data.errmsg}`);
    }
    
    // 获取成员列表
    const usersUrl = buildWeChatAPIUrl(
        `cgi-bin/user/list?access_token=${data.access_token}&department_id=1`,
        proxyUrl
    );
    
    const usersResponse = await fetch(usersUrl);
    const usersData = await usersResponse.json();
    
    if (usersData.errcode !== 0) {
        throw new Error(`获取成员列表失败: ${usersData.errmsg}`);
    }
    
    return usersData.userlist || [];
}

// 创建回调配置（第一步）
export async function createCallbackConfiguration(db, encryptionKey, config) {
    const dbInstance = new DatabaseCF(db);
    const { corpid, callback_token, encoding_aes_key } = config;
    
    if (!corpid || !callback_token || !encoding_aes_key) {
        throw new Error('回调配置参数不完整');
    }
    
    // 生成唯一 code
    const code = generateCode();
    
    // 加密敏感信息
    const encrypted_encoding_aes_key = await encrypt(encoding_aes_key, encryptionKey);
    
    // 保存初始配置（只包含回调相关信息）
    await dbInstance.saveConfiguration({
        code,
        corpid,
        encrypted_corpsecret: null, // 第二步才提供
        agentid: null, // 第二步才提供
        touser: [], // 第二步才提供
        description: '',
        callback_token,
        encrypted_encoding_aes_key,
        callback_enabled: 1
    });
    
    const callbackUrl = `/api/callback/${code}`;
    
    return {
        code,
        callbackUrl,
        message: '回调URL生成成功'
    };
}

// 完善配置（第二步）
export async function completeConfiguration(db, encryptionKey, config) {
    const dbInstance = new DatabaseCF(db);
    const { code, corpsecret, agentid, touser, description } = config;
    
    if (!code || !corpsecret || !agentid || !touser) {
        throw new Error('配置参数不完整');
    }
    
    // 获取现有配置
    const existingConfig = await dbInstance.getConfigurationByCode(code);
    if (!existingConfig) {
        throw new Error('配置不存在，请先完成第一步');
    }
    
    // 加密敏感信息
    const encrypted_corpsecret = await encrypt(corpsecret, encryptionKey);
    
    // 更新配置
    await dbInstance.updateConfiguration({
        code,
        corpid: existingConfig.corpid,
        encrypted_corpsecret,
        agentid,
        touser,
        description: description || '',
        callback_token: existingConfig.callback_token,
        encrypted_encoding_aes_key: existingConfig.encrypted_encoding_aes_key,
        callback_enabled: existingConfig.callback_enabled
    });
    
    const apiUrl = `/api/notify/${code}`;
    const callbackUrl = `/api/callback/${code}`;
    
    return {
        code,
        apiUrl,
        callbackUrl,
        message: '配置完成'
    };
}

// 创建配置（一步完成，保持兼容性）
export async function createConfiguration(db, encryptionKey, config) {
    const dbInstance = new DatabaseCF(db);
    const { corpid, corpsecret, agentid, touser, description } = config;
    
    // 生成唯一 code
    const code = generateCode();
    
    // 加密敏感信息
    const encrypted_corpsecret = await encrypt(corpsecret, encryptionKey);
    
    await dbInstance.saveConfiguration({
        code,
        corpid,
        encrypted_corpsecret,
        agentid,
        touser,
        description: description || '',
        callback_enabled: 0
    });
    
    return { code, message: '配置创建成功' };
}

// 获取配置
export async function getConfiguration(db, encryptionKey, code) {
    const dbInstance = new DatabaseCF(db);
    const config = await dbInstance.getConfigurationByCode(code);
    
    if (!config) {
        return null;
    }
    
    // 解密敏感信息（仅返回部分信息）
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

// 更新配置
export async function updateConfiguration(db, encryptionKey, code, updates) {
    const dbInstance = new DatabaseCF(db);
    const existingConfig = await dbInstance.getConfigurationByCode(code);
    
    if (!existingConfig) {
        throw new Error('配置不存在');
    }
    
    const updatedConfig = {
        code,
        corpid: updates.corpid || existingConfig.corpid,
        encrypted_corpsecret: updates.corpsecret 
            ? await encrypt(updates.corpsecret, encryptionKey)
            : existingConfig.encrypted_corpsecret,
        agentid: updates.agentid || existingConfig.agentid,
        touser: updates.touser || existingConfig.touser,
        description: updates.description !== undefined ? updates.description : existingConfig.description,
        callback_token: updates.callback_token || existingConfig.callback_token,
        encrypted_encoding_aes_key: updates.encoding_aes_key
            ? await encrypt(updates.encoding_aes_key, encryptionKey)
            : existingConfig.encrypted_encoding_aes_key,
        callback_enabled: updates.callback_enabled !== undefined ? updates.callback_enabled : existingConfig.callback_enabled
    };
    
    await dbInstance.updateConfiguration(updatedConfig);
    return { code, message: '配置更新成功' };
}

// 发送通知
export async function sendNotification(db, cache, encryptionKey, code, title, content) {
    const dbInstance = new DatabaseCF(db);
    const config = await dbInstance.getConfigurationByCode(code);
    
    if (!config) {
        throw new Error('未找到配置');
    }
    
    // 检查配置是否完整
    if (!config.encrypted_corpsecret || !config.agentid || !config.touser) {
        throw new Error('配置未完成，请先完成第二步配置（填写 CorpSecret、AgentID 和接收用户）');
    }
    
    const accessToken = await getAccessToken(db, cache, encryptionKey, config.corpid, config.encrypted_corpsecret);
    
    const message = {
        touser: config.touser,
        msgtype: 'text',
        agentid: config.agentid,
        text: {
            content: title ? `${title}\n${content}` : content
        }
    };
    
    const response = await fetch(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        }
    );
    
    const result = await response.json();
    
    if (result.errcode !== 0) {
        throw new Error(`发送消息失败: ${result.errmsg}`);
    }
    
    return result;
}

// 发送增强消息
export async function sendEnhancedNotification(db, cache, encryptionKey, code, messageData) {
    const dbInstance = new DatabaseCF(db);
    const config = await dbInstance.getConfigurationByCode(code);
    
    if (!config) {
        throw new Error('未找到配置');
    }
    
    // 检查配置是否完整
    if (!config.encrypted_corpsecret || !config.agentid || !config.touser) {
        throw new Error('配置未完成，请先完成第二步配置（填写 CorpSecret、AgentID 和接收用户）');
    }
    
    const accessToken = await getAccessToken(db, cache, encryptionKey, config.corpid, config.encrypted_corpsecret);
    
    let message = {
        touser: config.touser,
        agentid: config.agentid,
        msgtype: messageData.type
    };
    
    // 根据消息类型构建消息体
    switch (messageData.type) {
        case 'text':
            message.text = { content: messageData.content };
            break;
        case 'textcard':
            message.textcard = {
                title: messageData.title,
                description: messageData.description,
                url: messageData.url,
                btntxt: messageData.btntxt || '详情'
            };
            break;
        case 'markdown':
            message.markdown = { content: messageData.content };
            break;
        case 'news':
            message.news = { articles: messageData.articles };
            break;
        default:
            throw new Error(`不支持的消息类型: ${messageData.type}`);
    }
    
    const response = await fetch(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        }
    );
    
    const result = await response.json();
    
    if (result.errcode !== 0) {
        throw new Error(`发送消息失败: ${result.errmsg}`);
    }
    
    return result;
}

// 查询消息
export async function queryMessages(db, code, queryParams) {
    const dbInstance = new DatabaseCF(db);
    
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || parseInt(queryParams.pageSize) || 20;
    const offset = (page - 1) * limit;
    
    const filters = {
        config_code: code,
        limit,
        offset,
        sortField: queryParams.sortBy || 'created_at',
        sortOrder: queryParams.sortOrder || 'desc',
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

// 处理回调验证
export async function handleCallbackVerification(db, encryptionKey, code, msg_signature, timestamp, nonce, echostr) {
    const dbInstance = new DatabaseCF(db);
    const config = await dbInstance.getConfigurationByCode(code);
    
    if (!config || !config.callback_enabled) {
        return { success: false, error: '回调未启用' };
    }
    
    // 这里需要实现企业微信的签名验证逻辑
    // 由于 wxcrypt 库可能不兼容 Workers，需要使用 Web Crypto API 重新实现
    
    return { success: true, data: echostr };
}

// 处理回调消息
export async function handleCallbackMessage(db, encryptionKey, code, encryptedData, msg_signature, timestamp, nonce) {
    const dbInstance = new DatabaseCF(db);
    const config = await dbInstance.getConfigurationByCode(code);
    
    if (!config || !config.callback_enabled) {
        return { success: false, error: '回调未启用' };
    }
    
    // 解密消息并保存到数据库
    // 这里需要实现消息解密和解析逻辑
    
    return { success: true, message: '消息处理成功' };
}

// 生成唯一 code
function generateCode() {
    return 'cf_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}
