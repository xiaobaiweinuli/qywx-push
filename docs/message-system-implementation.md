# 企业微信通知服务 - 消息存储和查询系统实现文档

## 1. 项目概述

本文档详细描述了企业微信通知服务中新增的消息存储和查询系统的设计、实现和使用方法。该系统旨在提供完整的消息生命周期管理，包括消息接收、存储、查询、统计和状态管理功能。

## 2. 系统架构

### 2.1 核心组件

- **数据库模块 (Database)**: 负责消息数据的持久化存储和检索
- **回调处理模块 (WeChatCallbackCrypto)**: 增强的XML解析和消息处理功能
- **通知服务 (NotifierService)**: 集成消息存储和查询功能
- **API路由**: 提供消息管理的RESTful接口

### 2.2 数据流

```
企业微信消息 → 回调接口 → 消息解密 → XML解析 → 消息存储 → 消息处理/查询
```

## 3. 数据库设计

### 3.1 数据表结构

#### 3.1.1 `received_messages` 表

```sql
CREATE TABLE IF NOT EXISTS received_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    config_code TEXT NOT NULL,
    from_user TEXT,
    to_user TEXT,
    agent_id TEXT,
    msg_type TEXT NOT NULL,
    content TEXT,
    media_id TEXT,
    file_name TEXT,
    file_size INTEGER,
    event_type TEXT,
    event_key TEXT,
    quote_msg TEXT,
    create_time DATETIME NOT NULL,
    received_at DATETIME NOT NULL,
    is_read INTEGER DEFAULT 0,
    read_at DATETIME,
    FOREIGN KEY (config_code) REFERENCES configurations(code) ON DELETE CASCADE,
    UNIQUE(message_id, config_code)
);
```

#### 3.1.2 索引设计

```sql
CREATE INDEX IF NOT EXISTS idx_messages_config_code ON received_messages(config_code);
CREATE INDEX IF NOT EXISTS idx_messages_created_time ON received_messages(create_time);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON received_messages(from_user);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON received_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_msg_type ON received_messages(msg_type);
```

#### 3.1.3 全文搜索支持 (FTS5)

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS message_search USING fts5(
    message_id,
    content,
    from_user,
    to_user,
    file_name,
    content=received_messages,
    content_rowid=id
);
```

## 4. 核心功能实现

### 4.1 消息接收与存储

**文件**: `src/services/notifier.js`

核心实现函数 `handleCallbackMessage` 现在会：
- 解密企业微信消息
- 解析XML内容（支持引用消息）
- 构建完整的消息对象
- 存储消息到数据库
- 异步更新消息统计

```javascript
async function handleCallbackMessage(code, encryptedData, msgSignature, timestamp, nonce) {
    // 解密消息
    const xmlString = crypto.decryptMsg(msgSignature, timestamp, nonce, encryptedData);
    
    // 解析XML消息（使用增强版异步解析）
    const message = await crypto.parseXMLMessage(xmlString);
    
    // 构建完整的消息对象
    const fullMessage = {
        message_id: message.msgId || uuidv4(),
        config_code: code,
        from_user: message.fromUserName,
        to_user: message.toUserName,
        agent_id: message.agentId || config.agentid,
        msg_type: message.msgType,
        content: message.content,
        // ... 其他字段
        received_at: new Date(),
        is_read: false
    };
    
    // 存储消息到数据库
    await db.saveReceivedMessage(fullMessage);
    
    // 异步更新消息统计
    updateMessageStats(code, message.msgType).catch(err => {
        console.error('❌ 更新消息统计失败:', err);
    });
}
```

### 4.2 增强的XML解析

**文件**: `src/core/wechat-callback.js`

增强的 `parseXMLMessage` 函数现在支持：
- 异步解析
- 引用消息处理
- 更多消息类型支持
- 更好的错误处理和日志记录

```javascript
async parseXMLMessage(xmlString) {
    // 首先尝试使用x2o快速解析
    let parsed = x2o(xmlString);
    const xml = parsed.xml || parsed;
    
    // 基础消息对象
    const message = {
        fromUserName: xml.FromUserName || '',
        toUserName: xml.ToUserName || '',
        msgType: xml.MsgType || '',
        // ... 其他基础字段
    };
    
    // 如果检测到可能包含Quote元素，使用xml2js进行更详细的解析
    if (xmlString.includes('Quote')) {
        // 使用xml2js深度解析引用消息
    }
    
    return message;
}
```

### 4.3 消息查询与管理

**文件**: `src/services/notifier.js`

新增了以下核心功能函数：

1. **构建查询条件**
   ```javascript
   function buildMessageQuery(queryParams) {
       // 根据查询参数构建SQL条件
   }
   ```

2. **消息分页查询**
   ```javascript
   async function queryMessages(configCode, queryParams) {
       // 执行消息查询，支持多条件筛选、分页和排序
   }
   ```

3. **消息状态管理**
   ```javascript
   async function markMessageAsRead(messageId, configCode) {
       // 标记消息为已读状态
   }
   ```

4. **消息统计**
   ```javascript
   async function getMessageStats(configCode, timeRange = {}) {
       // 获取消息统计信息
   }
   ```

## 5. API接口设计

### 5.1 消息查询接口

#### GET /api/messages/:code

**功能**: 查询消息历史记录
**参数**:
- `code`: 配置代码（URL路径参数）
- 查询参数：
  - `startDate`: 开始日期（ISO格式）
  - `endDate`: 结束日期（ISO格式）
  - `msgType`: 消息类型
  - `fromUser`: 发送者（模糊匹配）
  - `toUser`: 接收者（模糊匹配）
  - `keyword`: 内容关键字（模糊匹配）
  - `isRead`: 是否已读
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
  - `sortBy`: 排序字段（默认received_at）
  - `sortOrder`: 排序方向（asc/desc，默认desc）

**返回示例**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "messages": [
      {
        "message_id": "msg_123456",
        "config_code": "test_config",
        "from_user": "user_123",
        "msg_type": "text",
        "content": "测试消息内容",
        "create_time": "2024-01-01T12:00:00.000Z",
        "received_at": "2024-01-01T12:00:00.000Z",
        "is_read": false
      }
    ]
  }
}
```

### 5.2 消息统计接口

#### GET /api/messages/:code/stats

**功能**: 获取消息统计信息
**参数**:
- `code`: 配置代码（URL路径参数）
- 查询参数：
  - `startDate`: 开始日期
  - `endDate`: 结束日期

**返回示例**:
```json
{
  "success": true,
  "data": {
    "total_messages": 150,
    "unread_count": 25,
    "by_type": {
      "text": 80,
      "image": 30,
      "event": 40
    },
    "by_date": [
      { "date": "2024-01-01", "count": 10 },
      { "date": "2024-01-02", "count": 15 }
    ]
  }
}
```

### 5.3 消息状态更新接口

#### PATCH /api/messages/:code/:messageId/read

**功能**: 标记单条消息为已读
**参数**:
- `code`: 配置代码（URL路径参数）
- `messageId`: 消息ID（URL路径参数）

#### PATCH /api/messages/:code/batch/read

**功能**: 批量标记消息为已读
**参数**:
- `code`: 配置代码（URL路径参数）
- 请求体：
  ```json
  {
    "messageIds": ["msg_123", "msg_456", "msg_789"]
  }
  ```

### 5.4 消息类型参考接口

#### GET /api/messages/types

**功能**: 获取支持的消息类型列表

## 6. 安全性考虑

- **权限验证**: 所有消息管理API都通过`validateConfigAccess`中间件验证配置访问权限
- **数据隔离**: 每个配置只能访问自己的消息数据
- **参数验证**: 所有输入参数都进行严格验证
- **错误处理**: 完善的错误处理和日志记录

## 7. 性能优化

- **索引设计**: 为常用查询字段创建索引
- **分页查询**: 限制查询结果数量，避免大量数据查询
- **异步处理**: 非关键操作异步执行，提高响应速度
- **全文搜索**: 使用SQLite FTS5实现高效的全文搜索功能

## 8. 使用示例

### 8.1 查询消息示例

```javascript
// 查询最近一周的未读文本消息
fetch('/api/messages/my_config?msgType=text&isRead=false&startDate=2024-01-01')
  .then(response => response.json())
  .then(data => {
    console.log('消息列表:', data.data.messages);
    console.log('总消息数:', data.data.total);
  });
```

### 8.2 标记消息已读示例

```javascript
// 批量标记消息已读
fetch('/api/messages/my_config/batch/read', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messageIds: ['msg_123', 'msg_456']
  })
}).then(response => response.json())
  .then(data => console.log('标记结果:', data));
```

## 9. 测试

系统包含单元测试，位于`test/message-system.test.js`，覆盖以下功能：
- 消息存储功能
- 消息查询功能
- 消息状态管理

运行测试：
```bash
npm test
```

## 10. 部署注意事项

- 确保数据库目录有写入权限
- 定期清理旧消息，避免数据库过大
- 监控数据库性能，必要时调整索引和查询
- 考虑添加消息备份和恢复功能