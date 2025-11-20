/**
 * GET /api/configuration/:code - 获取配置
 * PUT /api/configuration/:code - 更新配置
 */
import { getConfiguration, updateConfiguration } from '../../../src/services/notifier-cf.js';

export async function onRequestGet(context) {
    const { env, params } = context;
    const { code } = params;
    
    try {
        const config = await getConfiguration(env.DB, env.ENCRYPTION_KEY, code);
        
        if (!config) {
            return new Response(JSON.stringify({
                error: '未找到配置'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify(config), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error('获取配置失败:', error);
        return new Response(JSON.stringify({
            error: error.message || '获取配置失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut(context) {
    const { request, env, params } = context;
    const { code } = params;
    
    try {
        const body = await request.json();
        const result = await updateConfiguration(env.DB, env.ENCRYPTION_KEY, code, body);
        
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('更新配置失败:', error);
        return new Response(JSON.stringify({
            error: error.message || '更新配置失败'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
