/**
 * POST /api/notify/:code/enhanced - 发送增强消息
 */
import { sendEnhancedNotification } from '../../../../src/services/notifier-cf.js';

export async function onRequestPost(context) {
    const { request, env, params } = context;
    const { code } = params;
    
    try {
        const messageData = await request.json();
        
        if (!messageData.type) {
            return new Response(JSON.stringify({
                error: '缺少消息类型(type)参数'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        console.log('📥 收到增强消息请求:', {
            code: code.substring(0, 8) + '...',
            type: messageData.type
        });
        
        const result = await sendEnhancedNotification(env.DB, env.CACHE, env.ENCRYPTION_KEY, code, messageData);
        
        return new Response(JSON.stringify({
            message: '发送成功',
            response: result,
            messageType: messageData.type
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('发送增强消息失败:', error);
        const status = error.message?.includes('未找到配置') ? 404 : 500;
        return new Response(JSON.stringify({
            error: error.message || '消息发送失败'
        }), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
