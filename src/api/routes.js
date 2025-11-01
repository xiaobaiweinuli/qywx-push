// 统一API路由 - 支持所有消息格式和回调功能
const express = require('express');
const path = require('path');
const multer = require('multer');
const notifier = require('../services/notifier');

const router = express.Router();

// 中间件：验证配置权限
async function validateConfigAccess(req, res, next) {
    try {
        const { code } = req.params;
        if (!code) {
            return res.status(400).json({ error: '缺少配置代码' });
        }
        
        const config = await notifier.getConfiguration(code);
        if (!config) {
            return res.status(404).json({ error: '配置不存在' });
        }
        
        // 可选：添加更严格的权限验证（如API密钥）
        req.config = config;
        next();
    } catch (error) {
        res.status(500).json({ error: '权限验证失败', details: error.message });
    }
}

// 配置文件上传
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        cb(mimetype && extname ? null : new Error('不支持的文件类型'), mimetype && extname);
    }
});

// 1. GET / 返回前端页面
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// 2. POST /api/validate 验证凭证并获取成员列表
router.post('/api/validate', async (req, res) => {
    const { corpid, corpsecret } = req.body;
    if (!corpid || !corpsecret) {
        return res.status(400).json({ error: '参数不完整' });
    }
    try {
        // 通过notifier服务验证凭证并获取成员列表
        const users = await notifier.validateCredentials(corpid, corpsecret);
        res.json({ users });
    } catch (err) {
        res.status(400).json({ error: err.message || '凭证无效或API请求失败' });
    }
});

// 2.1 POST /api/generate-callback 生成回调URL
router.post('/api/generate-callback', async (req, res) => {
    const { corpid, callback_token, encoding_aes_key } = req.body;
    if (!corpid || !callback_token || !encoding_aes_key) {
        return res.status(400).json({ error: '回调配置参数不完整' });
    }
    if (encoding_aes_key.length !== 43) {
        return res.status(400).json({ error: 'EncodingAESKey必须是43位字符' });
    }
    try {
        // 生成回调配置（不需要成员列表）
        const result = await notifier.createCallbackConfiguration({
            corpid,
            callback_token,
            encoding_aes_key
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || '生成回调URL失败' });
    }
});

// 3. POST /api/complete-config 完善配置（第二步）
router.post('/api/complete-config', async (req, res) => {
    try {
        const { code, corpsecret, agentid, touser, description } = req.body;
        const result = await notifier.completeConfiguration({ code, corpsecret, agentid, touser, description });
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || '完善配置失败' });
    }
});

// 3.1 POST /api/configure 保存配置并生成唯一code（保持兼容性）
router.post('/api/configure', async (req, res) => {
    try {
        const { corpid, corpsecret, agentid, touser, description } = req.body;
        const result = await notifier.createConfiguration({ corpid, corpsecret, agentid, touser, description });
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || '配置保存失败' });
    }
});

// 4. POST /api/notify/:code 发送通知
router.post('/api/notify/:code', async (req, res) => {
    const { code } = req.params;
    const { title, content } = req.body;
    if (!content) {
        return res.status(400).json({ error: '消息内容不能为空' });
    }
    try {
        const result = await notifier.sendNotification(code, title, content);
        res.json({ message: '发送成功', response: result });
    } catch (err) {
        if (err.message && err.message.includes('未找到配置')) {
            res.status(404).json({ error: err.message });
        } else {
            res.status(500).json({ error: err.message || '消息发送失败' });
        }
    }
});

// 5. GET /api/configuration/:code 获取配置信息
router.get('/api/configuration/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const config = await notifier.getConfiguration(code);
        if (!config) {
            return res.status(404).json({ error: '未找到配置' });
        }
        
        // 添加缓存控制头，确保不会返回304响应
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Last-Modified', new Date().toUTCString());
        res.setHeader('ETag', `"${Date.now()}"`); // 使用时间戳作为ETag
        
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: err.message || '获取配置失败' });
    }
});

// 6. PUT /api/configuration/:code 更新配置
router.put('/api/configuration/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const result = await notifier.updateConfiguration(code, req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || '更新配置失败' });
    }
});

// 7. GET /api/callback/:code 企业微信回调验证
router.get('/api/callback/:code', async (req, res) => {
    const { code } = req.params;
    const { msg_signature, timestamp, nonce, echostr } = req.query;

    if (!msg_signature || !timestamp || !nonce || !echostr) {
        return res.status(400).json({ error: '缺少必要的验证参数' });
    }

    try {
        const result = await notifier.handleCallbackVerification(code, msg_signature, timestamp, nonce, echostr);
        if (result.success) {
            res.send(result.data);
        } else {
            console.error('回调验证失败:', result.error);
            res.status(400).send('failed');
        }
    } catch (err) {
        console.error('回调验证异常:', err.message);
        res.status(500).send('failed');
    }
});

// 8. POST /api/callback/:code 企业微信回调消息接收
router.post('/api/callback/:code', async (req, res) => {
    const { code } = req.params;
    const { msg_signature, timestamp, nonce } = req.query;

    if (!msg_signature || !timestamp || !nonce) {
        return res.status(400).json({ error: '缺少必要的验证参数' });
    }

    try {
        // 获取加密的消息数据（从原始body转换为字符串）
        const encryptedData = req.body ? req.body.toString('utf8') : '';
        if (!encryptedData) {
            return res.status(400).json({ error: '消息数据为空' });
        }

        const result = await notifier.handleCallbackMessage(code, encryptedData, msg_signature, timestamp, nonce);
        if (result.success) {
            console.log('回调消息处理成功:', result.message);
            res.send('ok');
        } else {
            console.error('回调消息处理失败:', result.error);
            res.status(400).send('failed');
        }
    } catch (err) {
        console.error('回调消息处理异常:', err.message);
        res.status(500).send('failed');
    }
});

// 增强版消息API - 统一集成
// 9. POST /api/notify/:code/enhanced - 发送增强消息
router.post('/api/notify/:code/enhanced', async (req, res) => {
    const { code } = req.params;
    const messageData = req.body;
    
    // 详细日志：记录API调用
    console.log('📥 收到API请求 - 增强版消息:', {
        timestamp: new Date().toISOString(),
        code: code.substring(0, 8) + '...', // 仅显示部分code保护隐私
        method: req.method,
        path: req.path,
        messageType: messageData.type,
        hasContent: !!messageData.content || !!messageData.title || !!messageData.description
    });

    if (!messageData.type) {
        console.error('❌ 请求参数错误：缺少消息类型(type)参数');
        return res.status(400).json({ error: '缺少消息类型(type)参数' });
    }

    try {
        console.log('🔄 准备发送增强版消息...');
        const result = await notifier.sendEnhancedNotification(code, messageData);
        console.log('✅ 增强版消息发送成功，API返回结果:', {
            errcode: result.errcode,
            errmsg: result.errmsg
        });
        res.json({ message: '发送成功', response: result, messageType: messageData.type });
    } catch (err) {
        console.error('❌ 增强版消息发送失败:', {
            error: err.message,
            code: code.substring(0, 8) + '...'
        });
        res.status(err.message?.includes('未找到配置') ? 404 : 500)
           .json({ error: err.message || '消息发送失败' });
    }
});

// 10. POST /api/notify/:code/textcard - 发送文本卡片
router.post('/api/notify/:code/textcard', async (req, res) => {
    const { code } = req.params;
    const { title, description, url, btntxt } = req.body;

    if (!title || !description || !url) {
        return res.status(400).json({ error: '文本卡片需要提供title、description和url' });
    }

    try {
        const result = await notifier.sendTextCard(code, { title, description, url, btntxt });
        res.json({ message: '文本卡片发送成功', response: result });
    } catch (err) {
        res.status(err.message?.includes('未找到配置') ? 404 : 500)
           .json({ error: err.message || '文本卡片发送失败' });
    }
});

// 11. POST /api/notify/:code/markdown - 发送Markdown消息
router.post('/api/notify/:code/markdown', async (req, res) => {
    const { code } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Markdown消息需要提供content' });
    }

    try {
        const result = await notifier.sendMarkdown(code, content);
        res.json({ message: 'Markdown消息发送成功', response: result });
    } catch (err) {
        res.status(err.message?.includes('未找到配置') ? 404 : 500)
           .json({ error: err.message || 'Markdown消息发送失败' });
    }
});

// 12. POST /api/notify/:code/news - 发送图文消息
router.post('/api/notify/:code/news', async (req, res) => {
    const { code } = req.params;
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
        return res.status(400).json({ error: '图文消息需要提供articles数组' });
    }

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        if (!article.title || !article.url) {
            return res.status(400).json({ error: `第${i + 1}个图文项缺少title或url` });
        }
    }

    try {
        const result = await notifier.sendNews(code, articles);
        res.json({ message: '图文消息发送成功', response: result });
    } catch (err) {
        res.status(err.message?.includes('未找到配置') ? 404 : 500)
           .json({ error: err.message || '图文消息发送失败' });
    }
});

// 导入fs.promises
const fs = require('fs').promises;

// 13. POST /api/notify/:code/file - 上传并发送文件
router.post('/api/notify/:code/file', upload.single('file'), async (req, res, next) => {
    const { code } = req.params;
    const { fileType = 'file' } = req.body;
    
    // 详细日志：记录文件上传请求
    console.log('📥 收到API请求 - 文件上传:', {
        timestamp: new Date().toISOString(),
        code: code.substring(0, 8) + '...',
        method: req.method,
        path: req.path,
        fileType: fileType,
        hasFile: !!req.file
    });

    if (!req.file) {
        console.error('❌ 请求参数错误：未提供文件');
        return res.status(400).json({ error: '请上传文件' });
    }
    
    console.log('📄 文件信息:', {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
    });

    try {
        console.log('🔄 准备发送文件消息...');
        const result = await notifier.sendFile(code, req.file.path, fileType);
        console.log('✅ 文件消息发送成功，API返回结果:', {
            errcode: result.errcode,
            errmsg: result.errmsg
        });
        
        res.json({ 
            message: '文件发送成功', 
            response: result,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
    } catch (err) {
        console.error('❌ 文件消息发送失败:', {
            error: err.message,
            code: code.substring(0, 8) + '...'
        });
        // 将错误传递给全局错误处理中间件
        return next(err);
    } finally {
        // 确保清理临时文件，无论成功或失败
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
                console.log('✅ 临时文件已清理');
            } catch (cleanupErr) {
                console.error('清理临时文件失败:', cleanupErr);
            }
        }
    }
});

// 14. GET /api/notify/:code/formats - 获取支持的消息格式
router.get('/api/notify/:code/formats', (req, res) => {
    res.json({
        supportedFormats: [
            { type: 'text', name: '文本消息', endpoint: '/api/notify/:code', parameters: ['title', 'content'] },
            { type: 'textcard', name: '文本卡片', endpoint: '/api/notify/:code/textcard', parameters: ['title', 'description', 'url', 'btntxt?'] },
            { type: 'markdown', name: 'Markdown消息', endpoint: '/api/notify/:code/markdown', parameters: ['content'] },
            { type: 'news', name: '图文消息', endpoint: '/api/notify/:code/news', parameters: ['articles[]'] },
            { type: 'file', name: '文件消息', endpoint: '/api/notify/:code/file', parameters: ['file', 'fileType?'] },
            { type: 'image', name: '图片消息', endpoint: '/api/notify/:code/file', parameters: ['file', 'fileType=image'] }
        ]
    });
});

// ========== 消息管理API ==========

/**
 * 查询消息历史
 * 支持多条件筛选、分页和排序
 */
router.get('/api/messages/:code', validateConfigAccess, async (req, res) => {
    try {
        const { code } = req.params;
        const queryParams = req.query;
        
        // 详细日志：记录消息查询请求
        console.log('📥 收到API请求 - 消息查询:', {
            timestamp: new Date().toISOString(),
            code: code.substring(0, 8) + '...',
            method: req.method,
            path: req.path,
            queryParams: {
                page: queryParams.page,
                pageSize: queryParams.pageSize,
                startDate: queryParams.startDate,
                endDate: queryParams.endDate,
                msgType: queryParams.msgType,
                keyword: queryParams.keyword
            }
        });
        
        // 执行消息查询，统一参数命名
        console.log('🔄 执行消息查询...');
        // 统一参数命名：规范化所有查询参数
        const normalizedParams = {
            // 页码参数规范化
            page: parseInt(queryParams.page) || 1,
            // 统一使用limit参数进行分页，优先使用pageSize作为备选
            limit: parseInt(queryParams.limit) || parseInt(queryParams.pageSize) || 20,
            // 排序参数规范化
            sortBy: queryParams.sortBy || 'created_at',
            sortOrder: queryParams.sortOrder || 'desc',
            // 保留其他查询参数
            startDate: queryParams.startDate,
            endDate: queryParams.endDate,
            msgType: queryParams.msgType,
            keyword: queryParams.keyword,
            fromUser: queryParams.fromUser,
            toUser: queryParams.toUser,
            isRead: queryParams.isRead === 'true' ? true : (queryParams.isRead === 'false' ? false : undefined)
        };
        const result = await notifier.queryMessages(code, normalizedParams);
        
        // 详细日志：查询结果
        console.log('✅ 消息查询完成:', {
            totalMessages: result.total,
            page: result.page,
            limit: result.limit,
            hasMessages: result.messages && result.messages.length > 0
        });
        
        // 增强的缓存控制头，确保不会返回304响应
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Last-Modified', new Date().toUTCString());
        res.setHeader('ETag', `"${Date.now()}"`); // 使用时间戳作为ETag
        
        res.json({
            success: true,
            data: result,
            timestamp: Date.now() // 添加时间戳到响应中
        });
    } catch (error) {
        console.error('❌ 消息查询失败:', {
            error: error.message,
            stack: error.stack,
            code: code.substring(0, 8) + '...'
        });
        res.status(400).json({
            success: false,
            error: error.message || '消息查询失败'
        });
    }
});

/**
 * 获取消息统计信息
 */
router.get('/api/messages/:code/stats', validateConfigAccess, async (req, res) => {
    try {
        const { code } = req.params;
        const timeRange = req.query;
        
        // 调用修改后的getMessageStats函数
        const rawStats = await notifier.getMessageStats(code, timeRange);
        
        // 构建符合前端期望格式的响应数据
        const formattedStats = {
            total: rawStats.total || 0,
            unread: rawStats.unread_count || 0,
            read: rawStats.read_count || 0,
            today: rawStats.today_count || 0
        };
        
        // 增强的缓存控制头，确保不会返回304响应
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Last-Modified', new Date().toUTCString());
        res.setHeader('ETag', `"${Date.now()}"`); // 使用时间戳作为ETag
        
        res.json({
            success: true,
            data: formattedStats,
            timestamp: Date.now() // 添加时间戳到响应中
        });
    } catch (error) {
        console.error('❌ 获取消息统计失败:', error);
        res.status(400).json({
            success: false,
            error: error.message || '获取消息统计失败'
        });
    }
});

/**
 * 标记消息为已读
 */
router.patch('/api/messages/:code/:messageId/read', validateConfigAccess, async (req, res) => {
    try {
        const { code, messageId } = req.params;
        
        const success = await notifier.markMessageAsRead(messageId, code);
        
        if (success) {
            res.json({
                success: true,
                message: '消息已标记为已读'
            });
        } else {
            res.status(404).json({
                success: false,
                error: '消息不存在或无法更新'
            });
        }
    } catch (error) {
        console.error('❌ 标记消息已读失败:', error);
        res.status(400).json({
            success: false,
            error: error.message || '标记消息已读失败'
        });
    }
});

/**
 * 批量标记消息为已读
 */
router.patch('/api/messages/:code/batch/read', validateConfigAccess, async (req, res) => {
    try {
        const { code } = req.params;
        const { messageIds } = req.body;
        
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: '请提供有效的消息ID列表'
            });
        }
        
        // 批量处理（这里简化实现，可以在数据库层实现更高效的批量更新）
        const results = await Promise.all(
            messageIds.map(id => notifier.markMessageAsRead(id, code))
        );
        
        const successCount = results.filter(r => r).length;
        
        res.json({
            success: true,
            message: `成功标记${successCount}/${messageIds.length}条消息为已读`
        });
    } catch (error) {
        console.error('❌ 批量标记消息已读失败:', error);
        res.status(400).json({
            success: false,
            error: error.message || '批量标记消息已读失败'
        });
    }
});

/**
 * 获取支持的消息类型
 */
router.get('/api/messages/types', (req, res) => {
    res.json({
        success: true,
        data: [
            { type: 'text', name: '文本消息' },
            { type: 'image', name: '图片消息' },
            { type: 'voice', name: '语音消息' },
            { type: 'video', name: '视频消息' },
            { type: 'file', name: '文件消息' },
            { type: 'news', name: '图文消息' },
            { type: 'event', name: '事件消息' },
            { type: 'link', name: '链接消息' }
        ]
    });
});

/**
 * 全局错误处理中间件
 * 统一处理所有未捕获的错误，提供标准化的错误响应格式
 */
function errorHandler(err, req, res, next) {
    // 记录详细错误信息
    console.error('💥 全局错误捕获:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    // 确定HTTP状态码
    let statusCode = 500; // 默认服务器错误
    
    // 根据错误类型设置不同的状态码
    if (err.message && err.message.includes('未找到配置')) {
        statusCode = 404; // 配置不存在
    } else if (err.message && (err.message.includes('参数') || err.message.includes('无效'))) {
        statusCode = 400; // 参数错误
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401; // 认证错误
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403; // 权限错误
    }
    
    // 构建标准化的错误响应
    const errorResponse = {
        success: false,
        error: err.message || '服务器内部错误',
        timestamp: Date.now()
    };
    
    // 开发环境可以返回更多错误详情
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
    }
    
    // 返回错误响应
    res.status(statusCode).json(errorResponse);
}

// 应用全局错误处理中间件
router.use(errorHandler);

module.exports = router;
