// 统一API路由 - 支持所有消息格式和回调功能
const express = require('express');
const path = require('path');
const multer = require('multer');
const notifier = require('../services/notifier');
const WeChatService = require('../core/wechat');

const router = express.Router();
const wechat = new WeChatService();

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
        const accessToken = await wechat.getToken(corpid, corpsecret);
        const users = await wechat.getAllUsers(accessToken);
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

    if (!messageData.type) {
        return res.status(400).json({ error: '缺少消息类型(type)参数' });
    }

    try {
        const result = await notifier.sendEnhancedNotification(code, messageData);
        res.json({ message: '发送成功', response: result, messageType: messageData.type });
    } catch (err) {
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

// 13. POST /api/notify/:code/file - 上传并发送文件
router.post('/api/notify/:code/file', upload.single('file'), async (req, res) => {
    const { code } = req.params;
    const { fileType = 'file' } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: '请上传文件' });
    }

    try {
        const result = await notifier.sendFile(code, req.file.path, fileType);
        
        // 清理临时文件
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('清理临时文件失败:', err);
        });

        res.json({ 
            message: '文件发送成功', 
            response: result,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
    } catch (err) {
        // 清理临时文件
        const fs = require('fs');
        fs.unlink(req.file.path, (cleanupErr) => {
            if (cleanupErr) console.error('清理临时文件失败:', cleanupErr);
        });

        res.status(err.message?.includes('未找到配置') ? 404 : 500)
           .json({ error: err.message || '文件发送失败' });
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

module.exports = router;
