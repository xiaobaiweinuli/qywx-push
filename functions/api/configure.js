/**
 * POST /api/configure - 保存配置
 */
import { createConfiguration } from '../../src/services/notifier-cf.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const { corpid, corpsecret, agentid, touser, description } = body;
        
        if (!corpid || !corpsecret || !agentid || !touser) {
            return new Response(JSON.stringify({
                error: '参数不完整，需要提供 corpid, corpsecret, agentid, touser'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const result = await createConfiguration(env.DB, env.ENCRYPTION_KEY, {
            corpid,
            corpsecret,
            agentid,
            touser,
            description
        });
        
        return new Response(JSON.stringify(result), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('保存配置失败:', error);
        return new Response(JSON.stringify({
            error: error.message || '配置保存失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
