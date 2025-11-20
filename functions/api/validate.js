/**
 * POST /api/validate - 验证企业微信凭证
 */
import { validateCredentials } from '../../src/services/notifier-cf.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const { corpid, corpsecret } = body;
        
        if (!corpid || !corpsecret) {
            return new Response(JSON.stringify({
                error: '参数不完整，需要提供 corpid 和 corpsecret'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const users = await validateCredentials(corpid, corpsecret);
        
        return new Response(JSON.stringify({ users }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('验证凭证失败:', error);
        return new Response(JSON.stringify({
            error: error.message || '凭证验证失败'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
