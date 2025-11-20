/**
 * Cloudflare Pages Functions 中间件
 * 处理 CORS、日志记录等全局功能
 */

export async function onRequest(context) {
    const { request, next, env } = context;
    
    // 添加 CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    // 记录请求日志
    const start = Date.now();
    const url = new URL(request.url);
    console.log(`${request.method} ${url.pathname}`);

    try {
        // 继续处理请求
        const response = await next();
        
        // 添加 CORS 头到响应
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            newResponse.headers.set(key, value);
        });
        
        // 记录响应时间
        const duration = Date.now() - start;
        console.log(`${request.method} ${url.pathname} - ${response.status} (${duration}ms)`);
        
        return newResponse;
    } catch (error) {
        console.error('请求处理错误:', error);
        return new Response(JSON.stringify({
            error: '服务器内部错误',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}
