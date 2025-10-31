# 企业微信通知服务 - API参考文档

本文档详细介绍了企业微信通知服务的API接口，包括消息发送、配置管理和消息查询等功能。

## 基础信息

- **服务默认端口**: 12121
- **API基础路径**: `/api`
- **健康检查**: `GET /`
- **Web管理界面**: `http://your-server:12121/admin`

## 消息发送端点

| 接口路径 | 方法 | 描述 |
|---------|------|------|
| `/api/send/text` | POST | 发送文本消息 |
| `/api/send/textcard` | POST | 发送文本卡片消息 |
| `/api/send/image` | POST | 发送图片消息 |
| `/api/send/news` | POST | 发送图文消息 |
| `/api/send/file` | POST | 发送文件消息 |
| `/api/send/voice` | POST | 发送语音消息 |
| `/api/send/video` | POST | 发送视频消息 |
| `/api/send/markdown` | POST | 发送Markdown消息 |

## 配置管理端点

| 接口路径 | 方法 | 描述 |
|---------|------|------|
| `/api/configs` | GET | 获取所有配置列表 |
| `/api/configs` | POST | 创建新配置 |
| `/api/configs/:code` | GET | 获取指定配置详情 |
| `/api/configs/:code` | PUT | 更新指定配置 |
| `/api/configs/:code` | DELETE | 删除指定配置 |
| `/api/configs/:code/test` | POST | 测试配置有效性 |
| `/api/configs/:code/reset-token` | POST | 重置配置Token |

## 消息查询端点

| 接口路径 | 方法 | 描述 |
|---------|------|------|
| `/api/messages/:code` | GET | 查询消息历史记录 |
| `/api/messages/:code/:id` | GET | 获取指定消息详情 |
| `/api/messages/:code/:id/read` | PUT | 标记消息为已读 |
| `/api/messages/:code/stats` | GET | 获取消息统计信息 |
| `/api/messages/:code/search` | GET | 搜索消息内容 |

## 文件上传端点

| 接口路径 | 方法 | 描述 |
|---------|------|------|
| `/api/upload/image` | POST | 上传图片文件 |
| `/api/upload/file` | POST | 上传普通文件 |
| `/api/upload/voice` | POST | 上传语音文件 |
| `/api/upload/video` | POST | 上传视频文件 |

## 通用参数说明

### 消息接收者参数

所有消息发送接口支持以下接收者参数：

- **touser**: 指定接收者，多个用户用`|`分隔，如`user1|user2`
- **toparty**: 指定部门，多个部门用`|`分隔
- **totag**: 指定标签，多个标签用`|`分隔
- **safe**: 是否是保密消息，0表示可对外分享，1表示不能分享且内容显示水印

### 配置参数

配置管理接口的请求体参数：

```json
{
  "code": "your-unique-code",
  "name": "配置名称",
  "corpId": "企业ID",
  "agentId": "应用ID",
  "secret": "应用密钥",
  "token": "回调Token",
  "aesKey": "加密密钥",
  "isEnabled": true,
  "description": "配置描述"
}
```

## 消息格式示例

### 文本消息

```json
{
  "touser": "user1|user2",
  "msgtype": "text",
  "text": {
    "content": "这是一条测试消息\n支持换行"
  },
  "safe": 0
}
```

### 文本卡片消息

```json
{
  "touser": "user1",
  "msgtype": "textcard",
  "textcard": {
    "title": "测试通知",
    "description": "<div class=\"gray\">2023年5月1日</div><div class=\"normal\">这是一条测试文本卡片消息</div><div class=\"highlight\">请点击查看详情</div>",
    "url": "http://example.com",
    "btntxt": "详情"
  }
}
```

### 图文消息

```json
{
  "touser": "@all",
  "msgtype": "news",
  "news": {
    "articles": [
      {
        "title": "第一条图文消息",
        "description": "这是第一条图文消息的描述",
        "url": "http://example.com/news/1",
        "picurl": "http://example.com/images/1.jpg"
      },
      {
        "title": "第二条图文消息",
        "description": "这是第二条图文消息的描述",
        "url": "http://example.com/news/2",
        "picurl": "http://example.com/images/2.jpg"
      }
    ]
  }
}
```

### 图片消息

```json
{
  "touser": "user1",
  "msgtype": "image",
  "image": {
    "media_id": "MEDIA_ID"
  }
}
```

## 统一响应格式

### 成功响应

```json
{
  "ok": true,
  "data": {
    "message_id": "MESSAGE_ID",
    "invaliduser": "",
    "invalidparty": "",
    "invalidtag": ""
  },
  "message": "消息发送成功"
}
```

### 错误响应

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  },
  "message": "操作失败"
}
```

## 错误码说明

| 错误码 | 描述 |
|-------|------|
| 400 | 请求参数错误 |
| 401 | 未授权或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 502 | 企业微信API请求失败 |
| 503 | 服务暂时不可用 |

## 调用示例

### 使用cURL

```bash
# 发送文本消息
curl -X POST http://your-server:12121/api/send/text \
-H "Content-Type: application/json" \
-d '{"touser":"user1","msgtype":"text","text":{"content":"测试消息"}}'

# 发送文本卡片消息
curl -X POST http://your-server:12121/api/send/textcard \
-H "Content-Type: application/json" \
-d '{"touser":"user1","msgtype":"textcard","textcard":{"title":"测试通知","description":"<div>测试消息</div>","url":"http://example.com","btntxt":"详情"}}'
```

### 使用Node.js

```javascript
const axios = require('axios');

async function sendNotification() {
  try {
    const response = await axios.post('http://your-server:12121/api/send/text', {
      touser: 'user1|user2',
      msgtype: 'text',
      text: {
        content: '这是一条来自Node.js的测试消息'
      }
    });
    console.log('消息发送成功:', response.data);
  } catch (error) {
    console.error('消息发送失败:', error.response?.data || error.message);
  }
}
```

### 使用Python

```python
import requests
import json

url = "http://your-server:12121/api/send/text"
payload = {
    "touser": "user1|user2",
    "msgtype": "text",
    "text": {
        "content": "这是一条来自Python的测试消息"
    }
}
headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

## 消息接收配置

### 回调URL设置

在企业微信后台设置回调URL：

```
http://your-server:12121/api/wechat/callback/your-code
```

### 回调验证

服务会自动处理企业微信的回调验证请求，确保Token和EncodingAESKey与企业微信后台配置一致。

## Web界面使用

除了API调用外，您还可以通过Web管理界面发送消息：

1. 访问 `http://your-server:12121/admin`
2. 登录管理界面（初始无需认证）
3. 在左侧菜单选择"发送消息"
4. 选择配置代码和消息类型
5. 填写消息内容和接收者
6. 点击"发送"按钮测试

[返回主文档](./../README.md)