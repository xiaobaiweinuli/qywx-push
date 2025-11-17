#!/usr/bin/env node
/**
 * 企业微信通知服务 - 统一入口
 * 支持多种消息格式：文本、卡片、Markdown、图文、文件上传
 * 支持企业微信回调消息接收和处理
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./src/api/routes');

const app = express();

// 端口配置 - 统一使用12121
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 12121;

// 启动信息
console.log('🔧 正在初始化企业微信通知服务...');
console.log(`📦 Node.js版本: ${process.version}`);
console.log(`🌍 运行环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔑 加密密钥: ${process.env.ENCRYPTION_KEY ? '已配置' : '⚠️  使用默认密钥（不安全）'}`);

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
                // 1. 找到所有内容字段中包含的实际换行符并转义
                const processedData = data.replace(/"content":"([^"]*)"/gs, (match, content) => {
                    // 只转义content字段中的换行符，保留其他格式
                    const escapedContent = content.replace(/\n/g, '\\n');
                    return `"content":"${escapedContent}"`;
                });

                req.body = JSON.parse(processedData);
                next();
            } catch (error) {
                // 如果预处理后仍然解析失败，直接将错误传递给错误处理中间件
                next(error);
            }
        });
    } else {
        // 对于非JSON请求，使用默认的解析
        next();
    }
});

// 自定义JSON解析中间件已处理所有JSON请求，不再需要额外的express.json()
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 移除 /public 前缀，使路径与 Netlify 保持一致
app.use(express.static(path.join(__dirname, 'public')));

// 请求日志中间件
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
        message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员',
        timestamp: new Date().toISOString()
    });
});

// 优雅关闭处理
process.on('SIGTERM', () => {
    console.log('📴 收到SIGTERM信号，正在优雅关闭...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 收到SIGINT信号，正在优雅关闭...');
    process.exit(0);
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🎉 企业微信通知服务启动成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 服务地址: http://localhost:${PORT}`);
    console.log(`📱 测试页面: http://localhost:${PORT}/message-sender.html`);
    console.log(`📖 API文档: http://localhost:${PORT}/enhanced-api-docs.html`);
    console.log(`🔧 配置页面: http://localhost:${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 提示: 按 Ctrl+C 停止服务');

    if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️  开发模式运行，生产环境请设置 NODE_ENV=production');
    }
});

// 导出server实例（用于测试）
module.exports = server;