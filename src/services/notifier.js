// 统一通知服务 - 支持所有消息格式和回调功能
const { v4: uuidv4 } = require('uuid'); // 用于生成唯一ID
const Database = require('../core/database');
const CryptoService = require('../core/crypto');
const WeChatService = require('../core/wechat');
const WeChatCallbackCrypto = require('../core/wechat-callback');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/notifier.db');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development-only';

const db = new Database(DB_PATH);
const crypto = new CryptoService(ENCRYPTION_KEY);
const wechat = new WeChatService();

db。init().catch(console.error);

/**
 * 创建回调配置（第一步）
 * @param {Object} config - { corpid, callback_token, encoding_aes_key }
 * @returns {Promise<{ code: string, callbackUrl: string }>}
 */
async function createCallbackConfiguration(config) {
    const { corpid, callback_token, encoding_aes_key } = config;
    if (!corpid || !callback_token || !encoding_aes_key) {
        throw new Error('回调配置参数不完整');
    }
    if (encoding_aes_key.length !== 43) {
        throw new Error('EncodingAESKey必须是43位字符');
    }

    // 检查是否已存在相同的回调配置
    const existingConfig = await db.getCallbackConfiguration(corpid, callback_token);
    if (existingConfig) {
        console.log('发现重复回调配置，返回已存在的code:', existingConfig.code);
        return {
            code: existingConfig.code,
            callbackUrl: `/api/callback/${existingConfig.code}`,
            message: '回调配置已存在，返回现有配置'
        };
    }

    // 生成唯一code
    const code = uuidv4();
    // 加密encoding_aes_key
    const encrypted_encoding_aes_key = crypto.encrypt(encoding_aes_key);

    // 保存回调配置到数据库
    await db.saveCallbackConfiguration({
        code,
        corpid,
        callback_token,
        encrypted_encoding_aes_key
    });

    console.log('回调配置创建成功，code:', code);

    return {
        code,
        callbackUrl: `/api/callback/${code}`
    };
}

/**
 * 完善配置（第二步）
 * @param {Object} config - { code, corpsecret, agentid, touser, description }
 * @returns {Promise<{ code: string, apiUrl: string, callbackUrl: string }>}
 */
async function completeConfiguration(config) {
    const { code, corpsecret, agentid, touser, description } = config;
    if (!code || !corpsecret || !agentid || !touser) {
        throw new Error('参数不完整');
    }

    // 检查回调配置是否存在
    const callbackConfig = await db.getConfigurationByCode(code);
    if (!callbackConfig) {
        throw new Error('回调配置不存在，请先生成回调URL');
    }

    // 加密corpsecret
    const encrypted_corpsecret = crypto.encrypt(corpsecret);
    const formattedTouser = Array.isArray(touser) ? touser.join('|') : touser;

    // 更新配置
    await db.completeConfiguration({
        code,
        encrypted_corpsecret,
        agentid,
        touser: formattedTouser,
        description: description || ''
    });

    console.log('配置完善成功，code:', code);

    return {
        code,
        apiUrl: `/api/notify/${code}`,
        callbackUrl: `/api/callback/${code}`
    };
}

/**
 * 创建配置（原有方法，保持兼容性）
 * @param {Object} config - { corpid, corpsecret, agentid, touser, description, callback_token, encoding_aes_key, callback_enabled }
 * @returns {Promise<{ code: string, apiUrl: string, callbackUrl?: string }>}
 */
async function createConfiguration(config) {
    const {
        corpid, corpsecret, agentid, touser, description,
        callback_token, encoding_aes_key, callback_enabled
    } = config;
    if (!corpid || !corpsecret || !agentid || !touser) {
        throw new Error('参数不完整');
    }

    // 第一步：优先处理回调配置验证
    if (callback_enabled) {
        if (!callback_token || !encoding_aes_key) {
            throw new Error('启用回调时必须提供回调Token和EncodingAESKey');
        }
        if (encoding_aes_key.length !== 43) {
            throw new Error('EncodingAESKey必须是43位字符');
        }
        console.log('回调配置验证通过，继续处理配置...');
    }

    // 第二步：检查是否已存在完全相同的配置（包括回调配置）
    const formattedTouser = Array.isArray(touser) ? touser.join('|') : touser;
    const existingConfig = await db.getConfigurationByCompleteFields(
        corpid,
        agentid,
        formattedTouser,
        callback_enabled ? 1 : 0,
        callback_token || null
    );

    if (existingConfig) {
        console.log('发现重复配置，返回已存在的code:', existingConfig.code);
        const result = {
            code: existingConfig.code,
            apiUrl: `/api/notify/${existingConfig.code}`,
            message: '配置已存在，返回现有配置'
        };
        if (existingConfig.callback_enabled) {
            result.callbackUrl = `/api/callback/${existingConfig.code}`;
        }
        return result;
    }

    // 第三步：生成新配置
    const code = uuidv4();
    // 加密corpsecret
    const encrypted_corpsecret = crypto.encrypt(corpsecret);
    // 加密encoding_aes_key（如果提供）
    const encrypted_encoding_aes_key = encoding_aes_key ? crypto.encrypt(encoding_aes_key) : null;

    // 保存到数据库
    await db.saveConfiguration({
        code,
        corpid,
        encrypted_corpsecret,
        agentid,
        touser: formattedTouser,
        description: description || '',
        callback_token: callback_token || null,
        encrypted_encoding_aes_key,
        callback_enabled: callback_enabled ? 1 : 0
    });

    console.log('新配置创建成功，code:', code);

    // 返回API调用信息
    const result = {
        code,
        apiUrl: `/api/notify/${code}`
    };
    if (callback_enabled) {
        result.callbackUrl = `/api/callback/${code}`;
    }
    return result;
}

/**
 * 发送通知 - 兼容旧版本文本消息
 * @param {string} code - 唯一配置code
 * @param {string} title - 消息标题
 * @param {string} content - 消息内容
 * @returns {Promise<Object>} - 企业微信API返回结果
 */
async function sendNotification(code, title, content) {
    const message = title ? `${title}\n${content}` : content;
    return sendEnhancedNotification(code, { type: 'text', content: message });
}

/**
 * 发送增强通知 - 支持所有消息格式
 * @param {string} code - 唯一配置code
 * @param {Object} messageData - 消息数据
 * @returns {Promise<Object>} - 企业微信API返回结果
 */
async function sendEnhancedNotification(code, messageData) {
    console.log('📤 开始发送增强通知...', {
        code: code.substring(0, 8) + '...',
        messageType: messageData.type,
        hasContent: !!messageData.content || !!messageData.title || !!messageData.description || !!messageData.articles
    });
    
    try {
        console.log('🔍 查询配置信息...');
        const config = await db.getConfigurationByCode(code);
        if (!config) {
            console.error('❌ 配置不存在:', code.substring(0, 8) + '...');
            throw new Error('无效的code，未找到配置');
        }
        console.log('✅ 配置查询成功:', {
            corpid: config.corpid,
            agentid: config.agentid,
            touser: config.touser.length > 20 ? config.touser.substring(0, 20) + '...' : config.touser
        });

        console.log('🔐 解密企业密钥...');
        const corpsecret = crypto.decrypt(config.encrypted_corpsecret);
        
        console.log('🔑 获取访问令牌...');
        const accessToken = await wechat.getToken(config.corpid, corpsecret);
        console.log('✅ 获取访问令牌成功');
        
        console.log('📤 调用企业微信API发送消息...');
        const result = await wechat.sendMessage(accessToken, config.agentid, config.touser, messageData);
        console.log('✅ 消息发送API调用成功:', {
            errcode: result.errcode,
            errmsg: result.errmsg,
            invaliduser: result.invaliduser,
            invalidparty: result.invalidparty,
            invalidtag: result.invalidtag
        });
        
        // 发送成功后，创建消息记录并保存到数据库
        if (result.errcode === 0) {
            console.log('📝 准备创建消息记录...');
            
            // 构建消息记录对象
            const messageRecord = {
                message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                config_code: code,
                from_user: 'system',
                from_user_name: '系统发送',
                to_user: config.touser,
                agent_id: config.agentid,
                msg_type: messageData.type,
                content: messageData.content || 
                         (messageData.title ? `${messageData.title}\n${messageData.description || ''}` : '') ||
                         JSON.stringify(messageData.articles || [], null, 2).substring(0, 500),
                media_id: messageData.media_id || null,
                createTime: Math.floor(Date.now() / 1000),
                is_read: 0
            };
            
            try {
                console.log('💾 // 4. 尝试获取用户名称并保存消息记录到数据库'
            try {
                // 尝试获取用户名称
                const userDetail = await wechat.getUserDetail(config.corpid, corpsecret, decryptedMessage.fromUserName);
                if (userDetail && userDetail.name) {
                    messageRecord.from_user_name = userDetail.name;
                }
            } catch (nameError) {
                console.warn(`无法获取用户 ${decryptedMessage.fromUserName} 的名称:`, nameError.message);
                // 忽略错误，使用默认的FromUserName作为名称
            }

            await db.saveReceivedMessage(messageRecord);rd);
                console.log('✅ 消息记录保存成功:', messageRecord.message_id);
            } catch (dbError) {
                console.error('❌ 保存消息记录失败:', dbError);
                // 数据库保存失败不应影响API调用成功的返回
            }
        }
        
        return result;
    } catch (error) {
        console.error('❌ 发送增强通知失败:', {
            error: error.message,
            stack: error.stack,
            code: code.substring(0, 8) + '...'
        });
        throw error;
    }
}

/**
 * 发送文本卡片
 * @param {string} code - 唯一配置code
 * @param {Object} cardData - 卡片数据
 * @returns {Promise<Object>} - 企业微信API返回结果
 */
async function sendTextCard(code, cardData) {
    return sendEnhancedNotification(code, { type: 'textcard', ...cardData });
}

/**
 * 发送Markdown消息
 * @param {string} code - 唯一配置code
 * @param {string} content - Markdown内容
 * @returns {Promise<Object>} - 企业微信API返回结果
 */
async function sendMarkdown(code, content) {
    return sendEnhancedNotification(code, { type: 'markdown', content });
}

/**
 * 发送图文消息
 * @param {string} code - 唯一配置code
 * @param {Array} articles - 图文数组
 * @returns {Promise<Object>} - 企业微信API返回结果
 */
async function sendNews(code, articles) {
    return sendEnhancedNotification(code, { type: 'news', articles });
}

/**
 * 发送文件消息
 * @param {string} code - 唯一配置code
 * @param {string} filePath - 文件路径
 * @param {string} fileType - 文件类型
 * @returns {Promise<Object>} - 企业微信API返回结果
 */
async function sendFile(code, filePath, fileType = 'file') {
    const config = await db.getConfigurationByCode(code);
    if (!config) {
        throw new Error('无效的code，未找到配置');
    }

    const corpsecret = crypto.decrypt(config.encrypted_corpsecret);
    const accessToken = await wechat.getToken(config.corpid, corpsecret);
    const mediaId = await wechat.uploadMedia(accessToken, fileType, filePath);
    
    return sendEnhancedNotification(code, { type: fileType, media_id: mediaId });
}

/**
 * 获取配置（不返回敏感信息）
 * @param {string} code - 唯一配置code
 * @returns {Promise<Object>} - 配置信息
 */
async function getConfiguration(code) {
    const config = await db.getConfigurationByCode(code);
    if (!config) return null;

    const result = {
        code: config.code,
        corpid: config.corpid,
        agentid: config.agentid,
        touser: config.touser.split('|'),
        description: config.description,
        callback_enabled: config.callback_enabled === 1,
        created_at: config.created_at
    };

    // 如果启用了回调，添加回调相关信息（不包含敏感数据）
    if (config.callback_enabled) {
        result.callback_token = config.callback_token;
        result.callbackUrl = `/api/callback/${config.code}`;
    }

    return result;
}

/**
 * 更新配置
 * @param {string} code - 唯一配置code
 * @param {Object} newConfig - 新的配置信息
 * @returns {Promise<{ message: string, code: string, callbackUrl?: string }>}
 */
async function updateConfiguration(code, newConfig) {
    const config = await db.getConfigurationByCode(code);
    if (!config) {
        throw new Error('无效的code，未找到配置');
    }

    // 如果提供了新的corpsecret，则加密
    let encrypted_corpsecret = config.encrypted_corpsecret;
    if (newConfig.corpsecret) {
        encrypted_corpsecret = crypto.encrypt(newConfig.corpsecret);
    }

    // 如果提供了新的encoding_aes_key，则加密
    let encrypted_encoding_aes_key = config.encrypted_encoding_aes_key;
    if (newConfig.encoding_aes_key) {
        encrypted_encoding_aes_key = crypto.encrypt(newConfig.encoding_aes_key);
    }

    // 更新数据库
    await db.updateConfiguration({
        code,
        corpid: newConfig.corpid || config.corpid,
        encrypted_corpsecret,
        agentid: newConfig.agentid || config.agentid,
        touser: newConfig.touser ? (Array.isArray(newConfig.touser) ? newConfig.touser.join('|') : newConfig.touser) : config.touser,
        description: newConfig.description !== undefined ? newConfig.description : config.description,
        callback_token: newConfig.callback_token !== undefined ? newConfig.callback_token : config.callback_token,
        encrypted_encoding_aes_key,
        callback_enabled: newConfig.callback_enabled !== undefined ? (newConfig.callback_enabled ? 1 : 0) : config.callback_enabled
    });

    const result = { message: '配置更新成功', code };
    if (newConfig.callback_enabled || config.callback_enabled) {
        result.callbackUrl = `/api/callback/${code}`;
    }
    return result;
}

/**
 * 处理回调验证
 * @param {string} code - 唯一配置code
 * @param {string} msgSignature - 消息签名
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机数
 * @param {string} echoStr - 回显字符串
 * @returns {Promise<{ success: boolean, data?: string, error?: string }>}
 */
async function handleCallbackVerification(code, msgSignature, timestamp, nonce, echoStr) {
    try {
        // 查询配置
        const config = await db.getConfigurationByCode(code);
        if (!config || !config.callback_enabled) {
            return { success: false, error: '回调未启用或配置不存在' };
        }

        if (!config.callback_token || !config.encrypted_encoding_aes_key) {
            return { success: false, error: '回调配置不完整' };
        }

        // 解密encoding_aes_key，添加异常处理和验证
        let encodingAESKey;
        try {
            encodingAESKey = crypto.decrypt(config.encrypted_encoding_aes_key);
            // 验证解密后的encoding_aes_key格式
            if (!encodingAESKey || encodingAESKey.length !== 43) {
                console.error('解密后的EncodingAESKey格式错误，长度应为43位');
                return { success: false, error: '内部配置错误：EncodingAESKey格式不正确' };
            }
        } catch (decryptError) {
            console.error('解密EncodingAESKey失败:', decryptError.message);
            return { success: false, error: '内部配置错误：无法解密回调密钥' };
        }

        console.log('回调验证参数检查:', {
            code: code.substring(0, 8) + '...', // 只显示部分code用于日志
            hasToken: !!config.callback_token,
            hasKey: !!encodingAESKey,
            keyLength: encodingAESKey ? encodingAESKey.length : 0,
            corpid: config.corpid
        });

        // 创建回调加密实例
        const callbackCrypto = new WeChatCallbackCrypto(
            config.callback_token,
            encodingAESKey,
            config.corpid
        );

        // 验证URL
        const result = callbackCrypto.verifyURL(msgSignature, timestamp, nonce, echoStr);
        if (!result.success) {
            console.error('URL验证失败详情:', { 
                error: result.error, 
                errcode: result.errcode,
                code: code.substring(0, 8) + '...'
            });
        }
        return result;
    } catch (error) {
        console.error('回调验证失败:', error.message, error.stack);
        return { success: false, error: '回调验证内部错误' };
    }
}

/**
 * 处理回调消息并存储到数据库
 * @param {string} code - 唯一配置code
 * @param {string} encryptedData - 加密的消息数据
 * @param {string} msgSignature - 消息签名
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机数
 * @returns {Promise<{ success: boolean, message?: Object, error?: string }>}
 */
async function handleCallbackMessage(code, encryptedData, msgSignature, timestamp, nonce) {
    try {
        // 查询配置
        const config = await db.getConfigurationByCode(code);
        if (!config || !config.callback_enabled) {
            return { success: false, error: '回调未启用或配置不存在' };
        }

        if (!config.callback_token || !config.encrypted_encoding_aes_key) {
            return { success: false, error: '回调配置不完整' };
        }

        // 解密encoding_aes_key，添加异常处理和验证
        let encodingAESKey;
        try {
            encodingAESKey = crypto.decrypt(config.encrypted_encoding_aes_key);
            // 验证解密后的encoding_aes_key格式
            if (!encodingAESKey || encodingAESKey.length !== 43) {
                console.error('解密后的EncodingAESKey格式错误，长度应为43位');
                return { success: false, error: '内部配置错误：EncodingAESKey格式不正确' };
            }
        } catch (decryptError) {
            console.error('解密EncodingAESKey失败:', decryptError.message);
            return { success: false, error: '内部配置错误：无法解密回调密钥' };
        }

        // 创建回调加密实例
        const callbackCrypto = new WeChatCallbackCrypto(
            config.callback_token,
            encodingAESKey,
            config.corpid
        );

        // 解密消息
        const decryptResult = callbackCrypto.decryptMsg(encryptedData, msgSignature, timestamp, nonce);
        if (!decryptResult.success) {
            return decryptResult;
        }

        // 解析XML消息
        const message = callbackCrypto.parseXMLMessage(decryptResult.data);

        // 记录消息日志
        console.log(`[回调消息] Code: ${code}, 发送者: ${message.fromUserName}, 类型: ${message.msgType}`);
        if (message.msgType === 'text') {
            console.log(`[回调消息] 内容: ${message.content}`);
        }

        // 构建完整的消息对象，添加元数据
    const fullMessage = {
        message_id: message.msgId || uuidv4(), // 优先使用企业微信消息ID，没有则生成UUID
        config_code: code,
        from_user: message.fromUserName,
        from_user_name: message.fromUserName, // 初始设置为FromUserName，后续尝试获取名称
        to_user: message.toUserName,
        agent_id: message.agentId || config.agentid,
        msg_type: message.msgType,
        content: message.content || null,
        media_id: message.mediaId || null,
        pic_url: message.picUrl || null,
        file_name: message.fileName || null,
        file_size: message.fileSize || null,
        event_type: message.Event || message.event || null,
        event_key: message.EventKey || message.eventKey || null,
        quoteMsg: message.quoteMsg || null,  // 直接传递对象
        createTime: message.createTime || Math.floor(Date.now() / 1000),  // 使用时间戳
        is_read: 0
    };

        // 尝试获取用户名称
        try {
            const corpsecret = crypto.decrypt(config.encrypted_corpsecret);
            const userDetail = await wechat.getUserDetail(config.corpid, corpsecret, fullMessage.from_user);
            if (userDetail && userDetail.name) {
                fullMessage.from_user_name = userDetail.name;
            }
        } catch (nameError) {
            console.warn(`无法获取用户 ${fullMessage.from_user} 的名称:`, nameError.message);
            // 忽略错误，使用默认的FromUserName作为名称
        }

        // 存储消息到数据库
        try {
            await db.saveReceivedMessage(fullMessage);
            console.log(`✅ 消息已成功存储到数据库: ${fullMessage.message_id}`);
            
            // 异步更新消息统计
            updateMessageStats(code, message.msgType).catch(err => {
                console.error('❌ 更新消息统计失败:', err);
            });
        } catch (dbError) {
            console.error('❌ 消息存储失败:', dbError);
            // 数据库存储失败不应影响消息处理，继续执行
        }

        return { success: true, message };
    } catch (error) {
        console.error('回调消息处理失败:', error.message);
        // 记录失败消息的基本信息
        try {
            const errorMsg = {
                config_code: code,
                error_time: new Date(),
                error_message: error.message,
                raw_data: JSON.stringify(encryptedData).substring(0, 500) // 截断过长内容
            };
            console.error('📝 失败消息记录:', errorMsg);
        } catch (logError) {
            console.error('❌ 错误日志记录失败:', logError);
        }
        return { success: false, error: error.message };
    }
}

/**
 * 异步更新消息统计信息
 * @param {string} configCode - 配置代码
 * @param {string} msgType - 消息类型
 */
async function updateMessageStats(configCode, msgType) {
    try {
        await db.updateMessageStats(configCode, msgType);
    } catch (error) {
        console.error('❌ 更新消息统计失败:', error);
    }
}

/**
 * 构建消息查询条件
 * @param {Object} queryParams - 查询参数
 * @returns {Object} 查询条件对象
 */
function buildMessageQuery(queryParams) {
    const { startDate, endDate, msgType, fromUser, toUser, keyword, isRead } = queryParams;
    const conditions = [];
    const params = [];

    if (startDate) {
        // 确保包含开始日期当天所有消息，包括带时间部分的记录
        const startDateStr = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
        conditions.push('(created_date >= ? OR created_date LIKE ?)');
        params.push(startDateStr);
        params.push(startDateStr + ' %'); // 匹配以日期开头且包含时间部分的记录
    }
    if (endDate) {
        // 确保包含结束日期当天所有消息，包括带时间部分的记录
        const endDateStr = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
        // 计算结束日期的下一天，使用<比较确保包含结束日期当天所有消息
        const endDateObj = new Date(endDateStr);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endDateNextDay = endDateObj.toISOString().split('T')[0];
        conditions.push('(created_date < ? OR created_date LIKE ?)');
        params.push(endDateNextDay);
        params.push(endDateStr + ' %'); // 匹配以日期开头且包含时间部分的记录
    }
    if (msgType) {
        conditions.push('msg_type = ?');
        params.push(msgType);
    }
    if (fromUser) {
        conditions.push('from_user LIKE ?');
        params.push(`%${fromUser}%`);
    }
    if (toUser) {
        conditions.push('to_user LIKE ?');
        params.push(`%${toUser}%`);
    }
    if (keyword) {
        conditions.push('content LIKE ?');
        params.push(`%${keyword}%`);
    }
    if (typeof isRead === 'boolean') {
        conditions.push('is_read = ?');
        params.push(isRead ? 1 : 0);
    }

    return { conditions, params };
}

/**
 * 处理消息分页查询
 * @param {string} configCode - 配置代码
 * @param {Object} queryParams - 查询参数
 * @returns {Promise<Object>} 查询结果和分页信息
 */
async function queryMessages(configCode, queryParams) {
    console.log('🔍 开始消息查询...', {
        configCode: configCode.substring(0, 8) + '...',
        queryParams: {
            page: queryParams.page,
            limit: queryParams.limit,
            sortBy: queryParams.sortBy,
            startDate: queryParams.startDate,
            endDate: queryParams.endDate,
            msgType: queryParams.msgType,
            keyword: queryParams.keyword
        }
    });
    
    try {
        // 验证配置是否存在
        console.log('🔍 验证配置是否存在...');
        const config = await db.getConfigurationByCode(configCode);
        if (!config) {
            console.error('❌ 配置不存在:', configCode.substring(0, 8) + '...');
            throw new Error('配置不存在');
        }
        console.log('✅ 配置验证成功:', config.corpid);

        // 构建查询条件
        console.log('📋 构建查询条件...');
        const { conditions, params } = buildMessageQuery(queryParams);
        
        // 添加配置代码条件
        conditions.push('config_code = ?');
        params.push(configCode);
        
        console.log('📋 查询条件详情:', {
            conditions: conditions.join(' AND '),
            paramCount: params.length,
            sampleParams: params.map((p, i) => i === params.length - 1 ? configCode.substring(0, 8) + '...' : String(p))
        });

        // 分页参数
        const page = parseInt(queryParams.page) || 1;
        const limit = parseInt(queryParams.limit) || 20;
        const offset = (page - 1) * limit;
        
        console.log('📄 分页参数:', {
            page,
            limit,
            offset
        });

        // 排序参数
        const sortField = queryParams.sortBy || 'created_at';
        const sortOrder = queryParams.sortOrder === 'asc' ? 'ASC' : 'DESC';
        
        console.log('🔀 排序参数:', {
            field: sortField,
            order: sortOrder
        });

        // 执行查询
        console.log('🔍 执行数据库消息查询...');
        const messages = await db.getReceivedMessages({
            conditions,
            params,
            limit,
            offset,
            sortField,
            sortOrder
        });
        
        console.log('✅ 消息查询完成，返回', messages.length, '条消息');

        // 获取总数
        console.log('🔢 获取符合条件的消息总数...');
        const total = await db.getReceivedMessagesCount({
            conditions,
            params
        });
        
        console.log('✅ 消息总数:', total);

        // 构建返回结果
        const result = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            messages: messages.map(msg => ({
                ...msg,
                quote_msg: msg.quote_msg ? JSON.parse(msg.quote_msg) : null,
                created_at: msg.created_at ? new Date(parseInt(msg.created_at) * 1000).toISOString() : null
            }))
        };
        
        console.log('📊 最终查询结果:', {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            hasMessages: result.messages.length > 0
        });
        
        return result;
    } catch (error) {
        console.error('❌ 消息查询失败:', {
            error: error.message,
            stack: error.stack,
            configCode: configCode.substring(0, 8) + '...'
        });
        throw error;
    }
}

/**
 * 标记消息为已读
 * @param {string} messageId - 消息ID
 * @param {string} configCode - 配置代码
 * @returns {Promise<boolean>} 是否成功
 */
async function markMessageAsRead(messageId, configCode) {
    try {
        return await db.markMessageAsRead(messageId, configCode);
    } catch (error) {
        console.error('❌ 标记消息已读失败:', error);
        throw error;
    }
}

/**
 * 获取消息统计信息
 * @param {string} configCode - 配置代码
 * @param {Object} timeRange - 时间范围
 * @returns {Promise<Object>} 统计信息
 */
async function getMessageStats(configCode, timeRange = {}) {
    try {
        // 构建时间范围查询条件，与queryMessages函数保持一致的日期处理逻辑
        const queryConditions = {};
        if (timeRange.startDate) {
            queryConditions.startDate = timeRange.startDate;
        }
        if (timeRange.endDate) {
            // 计算次日日期，与queryMessages函数保持一致的处理方式
            const endDateObj = new Date(timeRange.endDate);
            endDateObj.setDate(endDateObj.getDate() + 1);
            queryConditions.endDate = endDateObj.toISOString().split('T')[0]; // 转换为YYYY-MM-DD格式
        }
        
        const stats = await db.getMessageStats(configCode, queryConditions);
        return stats || {
            total_messages: 0,
            unread_count: 0,
            by_type: {},
            by_date: []
        };
    } catch (error) {
        console.error('❌ 获取消息统计失败:', error);
        throw error;
    }
}

module.exports = {
    // 配置管理
    createCallbackConfiguration,
    completeConfiguration,
    createConfiguration,
    getConfiguration,
    updateConfiguration,
    
    // 消息发送 - 统一支持所有格式
    sendNotification,
    sendEnhancedNotification,
    sendTextCard,
    sendMarkdown,
    sendNews,
    sendFile,
    
    // 回调处理
    handleCallbackVerification,
    handleCallbackMessage,
    
    // 消息管理和查询
    queryMessages,
    markMessageAsRead,
    getMessageStats
};
