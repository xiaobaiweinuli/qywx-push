/**
 * GET /api/messages/:code - 查询消息历史
 */
import { queryMessages } from '../../../src/services/notifier-cf.js';

export async function onRequestGet(context) {
    const { request, env, params } = context;
    const { code } = params;
    
    try {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams);
        
        console.log('📥 收到消息查询请求:', {
            code: code.substring(0, 8) + '...',
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
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error('查询消息失败:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || '消息查询失败'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
