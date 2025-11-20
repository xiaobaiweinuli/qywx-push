/**
 * GET /api/callback/:code - 企业微信回调验证
 * POST /api/callback/:code - 企业微信回调消息接收
 */
import { handleCallbackVerification, handleCallbackMessage } from '../../../src/services/notifier-cf.js';

export async function onRequestGet(context) {
    const { request, env, params } = context;
    const { code } = params;
    const url = new URL(request.url);
    
    const msg_signature = url.searchParams.get('msg_signature');
    const timestamp = url.searchParams.get('timestamp');
    const nonce = url.searchParams.get('nonce');
    const echostr = url.searchParams.get('echostr');
    
    if (!msg_signature || !timestamp || !nonce || !echostr) {
        return new Response(JSON.stringify({
            error: '缺少必要的验证参数'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const result = await handleCallbackVerification(env.DB, env.ENCRYPTION_KEY, code, msg_signature, timestamp, nonce, echostr);
        
        if (result.success) {
            return new Response(result.data, {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
            });
        } else {
            console.error('回调验证失败:', result.error);
            return new Response('failed', {
                status: 400,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    } catch (error) {
        console.error('回调验证异常:', error);
        return new Response('failed', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env, params } = context;
    const { code } = params;
    const url = new URL(request.url);
    
    const msg_signature = url.searchParams.get('msg_signature');
    const timestamp = url.searchParams.get('timestamp');
    const nonce = url.searchParams.get('nonce');
    
    if (!msg_signature || !timestamp || !nonce) {
        return new Response(JSON.stringify({
            error: '缺少必要的验证参数'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const encryptedData = await request.text();
        
        if (!encryptedData) {
            return new Response(JSON.stringify({
                error: '消息数据为空'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const result = await handleCallbackMessage(env.DB, env.ENCRYPTION_KEY, code, encryptedData, msg_signature, timestamp, nonce);
        
        if (result.success) {
            console.log('回调消息处理成功:', result.message);
            return new Response('ok', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
            });
        } else {
            console.error('回调消息处理失败:', result.error);
            return new Response('failed', {
                status: 400,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    } catch (error) {
        console.error('回调消息处理异常:', error);
        return new Response('failed', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
