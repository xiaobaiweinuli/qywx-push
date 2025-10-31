# 企业微信通知服务 - 使用指南

本文档详细介绍了企业微信通知服务的使用方法、配置步骤和典型应用场景。

## 快速开始

### 1. 配置企业微信应用

#### 后台配置

1. **登录企业微信管理后台**：访问 [https://work.weixin.qq.com/](https://work.weixin.qq.com/)
2. **创建应用**：
   - 进入"应用管理" → "自建" → "创建应用"
   - 填写应用名称、描述，上传应用头像
   - 设置应用可见范围（部门/成员）
3. **获取凭证**：
   - 记录应用的 `AgentId`、`Secret`
   - 获取企业的 `CorpID`（在"我的企业" → "企业信息"中）
4. **配置IP白名单**：
   - 在应用详情页，找到"企业可信IP"
   - 添加您服务器的公网IP地址

#### 服务配置

1. **访问管理界面**：`http://your-server:12121/admin`
2. **创建配置**：
   - 点击"配置管理" → "新增配置"
   - 填写配置信息：
     - 配置代码：唯一标识，如 `myapp`
     - 配置名称：如"测试应用"
     - CorpID、AgentId、Secret：企业微信获取的凭证
     - Token 和 EncodingAESKey：用于消息回调（可选）
3. **保存配置**：点击"保存"按钮
4. **测试连接**：点击"测试"按钮验证配置有效性

### 2. 发送消息

#### API调用

使用API发送文本消息示例：

```bash
# 使用cURL发送文本消息
curl -X POST http://your-server:12121/api/send/text \
-H "Content-Type: application/json" \
-d '{
  "touser": "user1|user2",
  "msgtype": "text",
  "text": {
    "content": "这是一条测试消息\n支持换行"
  }
}'
```

#### Web界面测试

1. 访问管理界面：`http://your-server:12121/admin`
2. 点击左侧菜单"发送消息"
3. 选择配置代码
4. 选择消息类型（如文本消息）
5. 填写接收者（如 `@all` 或具体用户ID）
6. 填写消息内容
7. 点击"发送"按钮

## 典型使用场景

### 1. 运维监控告警系统

**应用场景**：将企业微信通知服务集成到监控系统，实现自动化告警推送

**配置示例**：
```javascript
// Node.js监控告警推送示例
const axios = require('axios');

async function sendAlert(alertInfo) {
  try {
    const response = await axios.post('http://your-server:12121/api/send/textcard', {
      touser: 'user1|user2',
      title: `[严重] ${alertInfo.service} 故障告警`,
      description: `
          <div class="gray">${new Date().toLocaleString()}</div>
          <div class="normal">服务: ${alertInfo.service}</div>
          <div class="highlight">故障类型: ${alertInfo.type}</div>
          <div class="normal">详情: ${alertInfo.details}</div>
        `,
      url: alertInfo.dashboardUrl,
      btntxt: '查看详情'
    });
    return response.data;
  } catch (error) {
    console.error('告警发送失败:', error);
  }
}
```

### 2. DevOps自动化流程通知

**应用场景**：CI/CD流水线集成，推送构建结果、部署状态和测试报告

**实现方案**：
- 在Jenkins/GitLab CI中添加webhook调用
- 配置构建成功/失败/开始时触发通知
- 可针对不同环境（开发/测试/生产）配置不同接收人

**Jenkins Pipeline示例**：
```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                // 构建步骤
            }
        }
    }
    post {
        success {
            script {
                sh '''
                curl -X POST http://your-server:12121/api/send/text \
                -H "Content-Type: application/json" \
                -d '{"touser":"dev-team","msgtype":"text","text":{"content":"构建成功: '$JOB_NAME' #'$BUILD_NUMBER"}}'
                '''
            }
        }
        failure {
            // 发送失败通知
        }
    }
}
```

### 3. 企业内部审批流程通知

**应用场景**：与OA系统集成，推送审批提醒、审批结果通知

**功能特点**：
- 支持@指定审批人，确保及时处理
- 可附加审批表单详情，支持图文混排
- 支持审批状态变更通知（待审批、已同意、已拒绝）

### 4. 数据报表自动推送

**应用场景**：定时生成并推送业务报表、系统运行状态报告

**实现方法**：
- 使用cron作业定时执行数据处理脚本
- 生成图表并上传至服务器
- 通过企业微信推送图文消息，包含报表链接和关键数据摘要

```javascript
// 报表推送示例
async function sendDailyReport() {
  const reportData = await generateReport(); // 获取报表数据
  
  // 上传图表到服务器
  const chartUrl = await uploadChart(reportData.chartPath);
  
  await axios.post('http://your-server:12121/api/send/news', {
    touser: 'management-team',
    articles: [{
      title: `${reportData.date} 业务日报`,
      description: `日活: ${reportData.dau}\n转化率: ${reportData.conversion}%\n营收: ¥${reportData.revenue}`,
      url: reportData.fullReportUrl,
      picurl: chartUrl
    }]
  });
}
```

### 5. 员工关怀与团队通知

**应用场景**：生日祝福、入职周年提醒、团队活动通知

**配置建议**：
- 结合员工数据库，自动化发送生日祝福
- 支持个性化消息模板，增加情感连接
- 可批量发送但支持个性化内容定制

### 6. 客户服务通知集成

**应用场景**：将客服系统与企业微信连接，实时推送客户需求和反馈

**实现方案**：
- 配置客服系统webhook指向企业微信通知服务
- 设置关键词过滤和优先级分类
- 实现自动分配和提醒机制，确保客户问题及时处理

## 消息类型详解

### 文本消息

最简单的消息类型，支持换行和@提及用户：

```json
{
  "touser": "user1|user2",
  "msgtype": "text",
  "text": {
    "content": "@user1 这是一条测试消息\n第二行内容"
  }
}
```

### 文本卡片消息

支持富文本展示，包含标题、描述和按钮：

```json
{
  "touser": "@all",
  "msgtype": "textcard",
  "textcard": {
    "title": "重要通知",
    "description": "<div class=\"gray\">2023年5月1日</div><div class=\"normal\">请所有员工参加下午3点的会议</div>",
    "url": "http://example.com/meeting",
    "btntxt": "详情"
  }
}
```

### 图文消息

支持多图文展示，适合推送文章、公告等内容：

```json
{
  "touser": "@all",
  "msgtype": "news",
  "news": {
    "articles": [
      {
        "title": "企业新闻标题",
        "description": "新闻描述...",
        "url": "http://example.com/news/1",
        "picurl": "http://example.com/images/news1.jpg"
      }
    ]
  }
}
```

### 图片消息

发送图片文件：

```json
{
  "touser": "user1",
  "msgtype": "image",
  "image": {
    "media_id": "MEDIA_ID"
  }
}
```

## 接收用户消息

### 配置步骤

1. **在管理界面配置Token和EncodingAESKey**：
   - 进入配置管理
   - 编辑现有配置或创建新配置
   - 填写Token和EncodingAESKey
   - 保存配置

2. **在企业微信后台设置回调URL**：
   - 进入应用详情页
   - 找到"接收消息"设置
   - 回调URL填写：`http://your-server:12121/api/wechat/callback/your-code`
   - Token和EncodingAESKey需与管理界面一致

3. **验证回调配置**：
   - 点击"保存"后，企业微信会发送验证请求
   - 服务会自动处理验证

### 消息处理

接收的消息会自动存储到数据库中，您可以通过以下方式管理：

1. **Web界面查看**：在管理界面的"消息管理"中查看
2. **API查询**：使用`/api/messages/:code`接口查询
3. **自定义处理**：可以扩展服务以支持自定义消息处理逻辑

## 最佳实践

### 消息格式规范

- **标题简洁**：标题控制在20字以内，突出重点
- **内容清晰**：重要信息放在前面，避免冗长
- **格式一致**：统一团队的消息格式，便于识别
- **适时通知**：避免在非工作时间发送非紧急通知

### 性能优化

- **批量发送**：尽量合并相似的通知，减少API调用
- **缓存策略**：合理利用Token缓存，避免频繁调用企业微信API
- **异步处理**：对非紧急通知使用异步发送方式
- **监控告警**：设置合理的告警阈值，避免告警风暴

### 安全使用

- **权限控制**：严格控制谁可以发送什么类型的消息
- **敏感信息**：避免在消息中包含敏感信息
- **审计日志**：记录所有消息发送操作，便于追溯
- **定期检查**：定期检查应用的使用情况和权限设置

[返回主文档](./../README.md)