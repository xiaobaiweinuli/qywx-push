// 企业微信API交互模块 - 统一版本
// 支持所有消息格式：文本、图片、文件、图文、文本卡片、Markdown

const axios = require('axios');

class WeChatService {
    constructor(apiBase = 'https://qyapi.weixin.qq.com') {
        this.apiBase = apiBase;
        this.tokenCache = new Map();
    }

    // 获取访问凭证
    async getToken(corpid, corpsecret) {
        const cacheKey = `${corpid}_${corpsecret}`;
        const cached = this.tokenCache.get(cacheKey);
        
        if (cached && cached.expires > Date.now()) {
            return cached.token;
        }

        const response = await axios.get(`${this.apiBase}/cgi-bin/gettoken`, {
            params: { corpid, corpsecret }
        });

        const { data } = response;
        if (data.errcode !== 0) {
            throw new Error(`获取token失败: ${data.errmsg} (${data.errcode})`);
        }

        const expiresIn = (data.expires_in || 7200) * 1000;
        this.tokenCache.set(cacheKey, {
            token: data.access_token,
            expires: Date.now() + expiresIn - 300000
        });

        return data.access_token;
    }

    // 统一消息发送接口 - 支持所有格式
    async sendMessage(accessToken, agentid, touser, messageData) {
        const messageBody = {
            touser: Array.isArray(touser) ? touser.join('|') : touser,
            agentid: String(agentid), // 确保agentid是字符串格式
            ...this.buildMessageBody(messageData)
        };

        const response = await axios.post(
            `${this.apiBase}/cgi-bin/message/send?access_token=${accessToken}`,
            messageBody
        );

        const { data } = response;
        if (data.errcode !== 0) {
            throw new Error(`发送消息失败: ${data.errmsg} (${data.errcode})`);
        }

        return data;
    }

    // 构建消息体
    buildMessageBody(messageData) {
        // 兼容旧版本文本消息
        if (typeof messageData === 'string') {
            return { msgtype: 'text', text: { content: messageData } };
        }

        const { type, ...content } = messageData;
        switch (type) {
            case 'text': return { msgtype: 'text', text: { content: content.content } };
            case 'textcard': return { msgtype: 'textcard', textcard: content };
            case 'markdown': return { msgtype: 'markdown', markdown: { content: content.content } };
            case 'news': return { msgtype: 'news', news: { articles: content.articles } };
            case 'image': return { msgtype: 'image', image: { media_id: content.media_id } };
            case 'file': return { msgtype: 'file', file: { media_id: content.media_id } };
            default: throw new Error(`不支持的消息类型: ${type}`);
        }
    }

    // 上传媒体文件
    async uploadMedia(accessToken, type, filePath) {
        const FormData = require('form-data');
        const fs = require('fs');
        
        const form = new FormData();
        form.append('media', fs.createReadStream(filePath));
        form.append('type', type);

        const response = await axios.post(
            `${this.apiBase}/cgi-bin/media/upload?access_token=${accessToken}&type=${type}`,
            form,
            { headers: form.getHeaders() }
        );

        const { data } = response;
        if (data.errcode !== 0) {
            throw new Error(`上传文件失败: ${data.errmsg} (${data.errcode})`);
        }

        return data.media_id;
    }

    // 获取所有成员
    async getAllUsers(accessToken) {
        const departments = await this.getDepartmentList(accessToken);
        const allUsers = [];
        const userSet = new Set();

        for (const dept of departments) {
            const users = await this.getUserList(accessToken, dept.id);
            users.forEach(user => {
                if (!userSet.has(user.userid)) {
                    userSet.add(user.userid);
                    allUsers.push({
                        userid: user.userid,
                        name: user.name,
                        department: dept.name
                    });
                }
            });
        }

        return allUsers;
    }

    // 获取部门列表
    async getDepartmentList(accessToken) {
        const response = await axios.get(`${this.apiBase}/cgi-bin/department/list`, {
            params: { access_token: accessToken }
        });

        const { data } = response;
        if (data.errcode !== 0) {
            throw new Error(`获取部门列表失败: ${data.errmsg} (${data.errcode})`);
        }

        return data.department || [];
    }

    // 获取部门成员
    async getUserList(accessToken, departmentId = 1) {
        const response = await axios.get(`${this.apiBase}/cgi-bin/user/list`, {
            params: { access_token: accessToken, department_id: departmentId }
        });

        const { data } = response;
        if (data.errcode !== 0) {
            throw new Error(`获取成员列表失败: ${data.errmsg} (${data.errcode})`);
        }

	        return data.userlist || [];
	    }
	
	    // 获取用户详细信息
	    async getUserDetail(corpid, corpsecret, userid) {
	        const accessToken = await this.getToken(corpid, corpsecret);
	        const response = await axios.get(`${this.apiBase}/cgi-bin/user/get`, {
	            params: { access_token: accessToken, userid: userid }
	        });
	
	        const { data } = response;
	        if (data.errcode !== 0) {
	            // 忽略用户不存在的错误，返回null
	            if (data.errcode === 60111) {
	                return null;
	            }
	            throw new Error(`获取用户详情失败: ${data.errmsg} (${data.errcode})`);
	        }
	
	        return data;
	    }
	}
	
	module.exports = WeChatService;