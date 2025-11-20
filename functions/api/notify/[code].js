/**
 * POST /api/notify/:code - 发送通知
 */
import { sendNotification } from '../../../src/services/notifier-cf.js';

export async function onRequestPost(context) {
    const { request, env, params } = context;
    const { code } = params;
    
    try {
        const body = await request.json();
        const { title, content } = body;
        
        if (!content) {
            return new Response(JSON.stringify({
                error: '消息内容不能为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const result = await sendNotification(env.DB, env.CACHE, env.ENCRYPTION_KEY, code, title, content);
        
        return new Response(JSON.stringify({
            message: '发送成功',
            response: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('发送通知失败:', error);
        const status = error.message?.includes('未找到配置') ? 404 : 500;
        return new Response(JSON.stringify({
            error: error.message || '消息发送失败'
        }), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
