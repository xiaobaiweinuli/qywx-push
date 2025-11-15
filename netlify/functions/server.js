// Netlify函数适配器 - 使用serverless-http将Express应用转换为Netlify函数
const serverless = require('serverless-http');
const express = require('express');
const path = require('path');

// 创建新的Express应用实例
const app = express();

// 导入原始服务器的配置
// 注意：我们不能直接导入server.js，因为它会尝试监听端口
const routes = require('../../../src/api/routes');

// 端口配置（在Netlify中不使用，但保留以保持一致性）
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 12121;

// 中间件配置
app.use('/api/callback', express.raw({
    type: ['text/xml', 'application/xml', 'text/plain'],
    limit: '10mb'
}));

// 自定义JSON解析中间件，预处理包含实际换行符的JSON
app.use((req, res, next) => {
    if (req.headers['content-type']?.includes('application/json')) {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            try {
                // 预处理JSON字符串，处理实际换行符
                const processedData = data.replace(/"content":"([^"]*)"/gs, (match, content) => {
                    const escapedContent = content.replace(/\n/g, '\\n');
                    return `"content":"${escapedContent}"`;
                });
                
                req.body = JSON.parse(processedData);
                next();
            } catch (error) {
                next(error);
            }
        });
    } else {
        next();
    }
});

// 其他中间件
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/public', express.static(path.join(__dirname, '../../public')));

// 请求日志中间件（在Netlify中会自动记录，但保留以保持一致性）
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// 路由
app.use('/', routes);

// 404处理
app.use((req, res) => {
    console.log(`❌ 404: ${req.method} ${req.path}`);
    res.status(404).json({
        error: '接口不存在',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('💥 服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
    });
});

// 使用serverless-http包装Express应用
exports.handler = serverless(app);