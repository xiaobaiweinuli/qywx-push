/**
 * 企业微信 API 代理服务器
 * 用于解决 Cloudflare IP 白名单问题
 */

const express = require('express');
const axios = require('axios');
const app = express();

// 配置
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || ''; // 可选：添加 API 密钥保护

app.use(express.json());

// CORS 支持
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// API 密钥验证中间件（可选）
function validateApiKey(req, res, next) {
    if (!API_KEY) {
        return next(); // 如果没有设置 API_KEY，跳过验证
    }
    
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== API_KEY) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid API key'
        });
    }
    next();
}

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// 获取服务器 IP
app.get('/ip', async (req, res) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        res.json({
            ip: response.data.ip,
            message: '请将此 IP 添加到企业微信白名单'
        });
    } catch (error) {
        res.status(500).json({
            error: '获取 IP 失败',
            message: error.message
        });
    }
});

// 代理企业微信 API
app.all('/api/wechat/*', validateApiKey, async (req, res) => {
    try {
        const path = req.params[0];
        const url = `https://qyapi.weixin.qq.com/${path}`;
        
        console.log(`代理请求: ${req.method} ${url}`);
        if (req.query && Object.keys(req.query).length > 0) {
            console.log('查询参数:', req.query);
        }
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('请求体:', JSON.stringify(req.body).substring(0, 200));
        }
        
        const response = await axios({
            method: req.method,
            url: url,
            params: req.query,
            data: req.body,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WeChatProxyServer/1.0'
            }
        });
        
        console.log(`响应状态: ${response.status}`);
        res.json(response.data);
        
    } catch (error) {
        console.error('代理错误:', error.message);
        
        if (error.response) {
            // 企业微信 API 返回的错误
            console.error('API 错误响应:', error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // 请求发送了但没有收到响应
            res.status(504).json({
                error: '网关超时',
                message: '无法连接到企业微信服务器'
            });
        } else {
            // 其他错误
            res.status(500).json({
                error: '代理服务器错误',
                message: error.message
            });
        }
    }
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `路径 ${req.path} 不存在`,
        availableEndpoints: [
            'GET /health - 健康检查',
            'GET /ip - 获取服务器 IP',
            'ALL /api/wechat/* - 代理企业微信 API'
        ]
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: err.message
    });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('企业微信 API 代理服务器');
    console.log('='.repeat(50));
    console.log(`服务器地址: http://0.0.0.0:${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`获取 IP: http://localhost:${PORT}/ip`);
    console.log('='.repeat(50));
    
    if (API_KEY) {
        console.log('✓ API 密钥保护已启用');
    } else {
        console.log('⚠ 警告: 未设置 API 密钥，建议设置 API_KEY 环境变量');
    }
    
    console.log('\n请访问 /ip 端点获取服务器 IP，并添加到企业微信白名单');
    console.log('='.repeat(50));
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信号，正在关闭服务器...');
    process.exit(0);
});
