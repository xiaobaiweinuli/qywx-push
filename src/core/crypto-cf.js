/**
 * Cloudflare Workers 加密解密模块
 * 使用 Web Crypto API
 */

// 将字符串转换为 ArrayBuffer
function str2ab(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

// 将 ArrayBuffer 转换为字符串
function ab2str(buffer) {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
}

// 将 ArrayBuffer 转换为 Base64
function ab2base64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// 将 Base64 转换为 ArrayBuffer
function base642ab(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// 从密钥字符串派生加密密钥
async function deriveKey(password) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        str2ab(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: str2ab('wechat-notifier-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// 加密函数
export async function encrypt(text, password) {
    const key = await deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        str2ab(text)
    );
    
    // 将 IV 和加密数据组合
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return ab2base64(combined.buffer);
}

// 解密函数
export async function decrypt(encryptedText, password) {
    // 检查输入是否有效
    if (!encryptedText || encryptedText.trim() === '') {
        throw new Error('无法解密空数据');
    }
    
    const key = await deriveKey(password);
    const combined = new Uint8Array(base642ab(encryptedText));
    
    // 检查数据长度是否足够
    if (combined.length < 12) {
        throw new Error('加密数据格式无效');
    }
    
    // 分离 IV 和加密数据
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encrypted
    );
    
    return ab2str(decrypted);
}
