// 企业微信回调验证模块
// 使用官方wxcrypt库实现，与Python WXBizMsgCrypt完全兼容

const WXBizMsgCrypt = require('wxcrypt');
const { x2o } = require('wxcrypt'); // XML解析工具
const xml2js = require('xml2js'); // 增强的XML解析支持

class WeChatCallbackCrypto {
    constructor(token, encodingAESKey, corpId) {
        this.token = token;
        this.encodingAESKey = encodingAESKey;
        this.corpId = corpId;

        // 使用官方wxcrypt库
        this.wxcrypt = new WXBizMsgCrypt(token, encodingAESKey, corpId);
    }

    /**
     * 验证URL - 用于开启回调模式时的验证
     * @param {string} msgSignature - 企业微信加密签名
     * @param {string} timestamp - 时间戳
     * @param {string} nonce - 随机数
     * @param {string} echoStr - 加密的随机字符串
     * @returns {Object} { success: boolean, data: string }
     */
    verifyURL(msgSignature, timestamp, nonce, echoStr) {
        try {
            // 使用官方wxcrypt库进行验证，与Python版本完全兼容
            const decrypted = this.wxcrypt.verifyURL(msgSignature, timestamp, nonce, echoStr);
            return { success: true, data: decrypted };
        } catch (error) {
            console.error('URL验证失败:', error.message, 'errcode:', error.errcode);
            return {
                success: false,
                error: error.errmsg || error.message,
                errcode: error.errcode
            };
        }
    }

    /**
     * 解密消息
     * @param {string} encryptedMsg - 加密的消息
     * @param {string} msgSignature - 消息签名
     * @param {string} timestamp - 时间戳
     * @param {string} nonce - 随机数
     * @returns {Object} { success: boolean, data: string }
     */
    decryptMsg(encryptedMsg, msgSignature, timestamp, nonce) {
        try {
            // 使用官方wxcrypt库进行解密，与Python版本完全兼容
            const decrypted = this.wxcrypt.decryptMsg(msgSignature, timestamp, nonce, encryptedMsg);
            return { success: true, data: decrypted };
        } catch (error) {
            console.error('消息解密失败:', error.message, 'errcode:', error.errcode);
            return {
                success: false,
                error: error.errmsg || error.message,
                errcode: error.errcode
            };
        }
    }



    /**
     * 解析XML消息 - 增强版，支持引用消息
     * @param {string} xmlString - XML字符串
     * @returns {Object} 解析后的消息对象
     */
    async parseXMLMessage(xmlString) {
        try {
            // 首先尝试使用x2o快速解析
            let parsed = x2o(xmlString);
            const xml = parsed.xml || parsed;

            // 基础消息对象
            const message = {
                fromUserName: xml.FromUserName || '',
                toUserName: xml.ToUserName || '',
                msgType: xml.MsgType || '',
                content: xml.Content || '',
                picUrl: xml.PicUrl || '',
                msgId: xml.MsgId || '',
                agentId: xml.AgentID || '',
                createTime: xml.CreateTime || '',
                mediaId: xml.MediaId || '',
                eventType: xml.Event || '',
                eventKey: xml.EventKey || '',
                fileName: xml.FileName || '',
                fileSize: xml.FileSize || ''
            };

            // 如果检测到可能包含Quote元素，使用xml2js进行更详细的解析
            if (xmlString.includes('Quote')) {
                try {
                    const parser = new xml2js.Parser({
                        explicitArray: false,
                        ignoreAttrs: true,
                        trim: true
                    });
                    const detailedParsed = await parser.parseStringPromise(xmlString);
                    const detailedXml = detailedParsed.xml || {};

                    // 处理Quote引用消息
                    if (detailedXml.Quote) {
                        message.quoteMsg = {
                            msgId: detailedXml.Quote.MsgId || '',
                            content: detailedXml.Quote.Content || '',
                            fromUser: detailedXml.Quote.FromUserName || '',
                            fromUserName: detailedXml.Quote.FromUserName || '',
                            msgType: detailedXml.Quote.MsgType || ''
                        };
                    }
                } catch (xml2jsError) {
                    console.warn('详细XML解析失败（可能是简单消息）:', xml2jsError.message);
                }
            }

            // 转换数字类型字段
            if (message.createTime) {
                message.createTime = parseInt(message.createTime);
            }
            if (message.fileSize) {
                message.fileSize = parseInt(message.fileSize);
            }

            return message;
        } catch (error) {
            console.error('XML解析失败:', error.message);
            // 记录错误的XML内容，但截断过长内容避免日志过大
            const safeXmlString = xmlString.length > 1000 ? xmlString.substring(0, 1000) + '...' : xmlString;
            console.error('失败的XML内容:', safeXmlString);
            throw error;
        }
    }

    /**
     * 创建回调消息处理器
     * @param {Object} db - 数据库实例
     * @returns {Function} 回调处理函数
     */
    static createCallbackHandler(db) {
        return async function(req, res) {
            try {
                // 从配置中获取必要信息（在实际使用时，需要从路由参数或其他地方获取）
                const { code } = req.params || {};
                const { msg_signature, timestamp, nonce } = req.query;

                if (!msg_signature || !timestamp || !nonce) {
                    return res.status(400).json({ error: '缺少必要的验证参数' });
                }

                // 注意：这里只是处理器的框架，实际的配置获取和解密逻辑需要在notifier.js中实现
                // 此函数主要用于提供消息解析和存储的公共逻辑

                return res.send('success');
            } catch (error) {
                console.error('❌ Callback处理错误:', error);
                res.status(500).send('error');
            }
        };
    }
}

module.exports = WeChatCallbackCrypto;