/**
 * POST /api/generate-callback - 生成回调URL（第一步）
 */
import { createCallbackConfiguration } from '../../src/services/notifier-cf.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    console.log('📥 收到生成回调URL请求');
    
    try {
        // 解析请求体
        const body = await request.json();
        console.log('📄 请求参数:', {
            corpid: body.corpid?.substring(0, 8) + '...',
            hasCallbackToken: !!body.callback_token,
            hasEncodingAesKey: !!body.encoding_aes_key,
            encodingAesKeyLength: body.encoding_aes_key?.length
        });
        
        const { corpid, callback_token, encoding_aes_key } = body;
        
        // 参数验证
        if (!corpid || !callback_token || !encoding_aes_key) {
            console.error('❌ 参数验证失败：缺少必要参数');
            return new Response(JSON.stringify({
                error: '回调配置参数不完整'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (encoding_aes_key.length !== 43) {
            console.error('❌ 参数验证失败：EncodingAESKey长度不正确');
            return new Response(JSON.stringify({
                error: 'EncodingAESKey必须是43位字符'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 检查环境变量
        if (!env.DB) {
            console.error('❌ 环境变量错误：DB 未配置');
            return new Response(JSON.stringify({
                error: '数据库未配置'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!env.ENCRYPTION_KEY) {
            console.error('❌ 环境变量错误：ENCRYPTION_KEY 未配置');
            return new Response(JSON.stringify({
                error: '加密密钥未配置'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        console.log('🔄 调用 createCallbackConfiguration...');
        const result = await createCallbackConfiguration(env.DB, env.ENCRYPTION_KEY, {
            corpid,
            callback_token,
            encoding_aes_key
        });
        
        console.log('✅ 回调URL生成成功:', {
            code: result.code?.substring(0, 8) + '...',
            callbackUrl: result.callbackUrl
        });
        
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('❌ 生成回调URL失败:', {
            error: error.message,
            stack: error.stack
        });
        return new Response(JSON.stringify({
            error: error.message || '生成回调URL失败',
            details: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
