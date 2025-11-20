/**
 * POST /api/complete-config - 完善配置（第二步）
 */
import { completeConfiguration } from '../../src/services/notifier-cf.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const { code, corpsecret, agentid, touser, description } = body;
        
        if (!code || !corpsecret || !agentid || !touser) {
            return new Response(JSON.stringify({
                error: '参数不完整，需要提供 code, corpsecret, agentid, touser'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!Array.isArray(touser) || touser.length === 0) {
            return new Response(JSON.stringify({
                error: '请至少选择一个接收用户'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const result = await completeConfiguration(env.DB, env.ENCRYPTION_KEY, {
            code,
            corpsecret,
            agentid,
            touser,
            description
        });
        
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('完善配置失败:', error);
        return new Response(JSON.stringify({
            error: error.message || '完善配置失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
