# 企业微信通知服务 - 项目结构

本文档详细介绍了企业微信通知服务的项目架构设计和目录结构。

## 架构设计

### 整体架构

企业微信通知服务采用经典的三层架构设计：

1. **API层**：处理HTTP请求，提供RESTful API接口
2. **服务层**：实现核心业务逻辑，处理消息发送、配置管理等功能
3. **数据层**：负责数据持久化和检索，使用SQLite数据库

### 核心组件

- **API路由**：处理所有HTTP请求和响应
- **通知服务**：企业微信消息发送的核心服务
- **配置管理**：管理企业微信应用配置
- **加密模块**：处理消息加密和解密
- **数据库模块**：数据持久化和查询
- **日志系统**：记录系统运行状态和操作日志
- **Web界面**：提供管理和测试功能的前端界面

### 数据流

```
客户端请求 → API路由 → 服务层处理 → 数据库操作/企业微信API调用 → 响应
```

## 目录结构

```
qywx-push/                 # 项目根目录
├── .dockerignore          # Docker忽略文件配置
├── .github/               # GitHub相关配置（如Actions工作流）
├── .gitignore             # Git忽略文件配置
├── Dockerfile             # 标准Docker构建文件
├── Dockerfile.clawcloud   # ClawCloud优化版Docker构建文件
├── LICENSE                # 开源许可证
├── README.md              # 项目主文档
├── database/              # SQLite数据库目录
│   └── notifier.db        # 数据库文件
├── docker-compose.clawcloud.yml  # ClawCloud Docker Compose配置
├── docker-compose.yml     # 标准Docker Compose配置
├── docs/                  # 项目文档目录
│   ├── api-reference.md            # API参考文档
│   ├── deployment-guide.md         # 部署指南
│   ├── environment-variables.md    # 环境变量配置
│   ├── message-system-implementation.md  # 消息系统实现文档
│   ├── project-structure.md        # 项目结构文档
│   ├── security-best-practices.md  # 安全最佳实践
│   └── usage-guide.md              # 使用指南
├── package-lock.json      # npm依赖锁定文件
├── package.json           # npm项目配置文件
├── public/                # 静态资源目录（Web界面）
│   ├── css/               # CSS样式文件
│   ├── js/                # JavaScript脚本
│   └── index.html         # Web界面入口
├── server.js              # 应用入口文件
├── src/                   # 源代码目录
│   ├── controllers/       # API控制器
│   ├── core/              # 核心模块
│   ├── middlewares/       # 中间件
│   ├── models/            # 数据模型
│   ├── routes/            # API路由定义
│   ├── services/          # 业务服务层
│   ├── utils/             # 工具函数
│   └── validators/        # 数据验证器
├── uploads/               # 文件上传目录
└──改造建议.md             # 项目改造建议（中文）
```

## 模块说明

### src/controllers/

控制器负责处理HTTP请求，调用相应的服务，并返回响应：

- `config.controller.js`：配置管理控制器
- `message.controller.js`：消息发送控制器
- `upload.controller.js`：文件上传控制器
- `wechat.controller.js`：企业微信回调控制器

### src/core/

核心模块包含系统的基础组件：

- `database.js`：数据库连接和操作
- `logger.js`：日志系统
- `wechat-callback.js`：企业微信回调处理
- `wechat-api.js`：企业微信API客户端

### src/services/

服务层实现核心业务逻辑：

- `config.service.js`：配置管理服务
- `notifier.service.js`：消息通知服务
- `upload.service.js`：文件上传服务
- `crypto.service.js`：加密解密服务

### src/models/

数据模型定义：

- `config.model.js`：配置数据模型
- `message.model.js`：消息数据模型
- `stats.model.js`：统计数据模型

### src/routes/

API路由定义：

- `api.routes.js`：API路由汇总
- `config.routes.js`：配置管理路由
- `message.routes.js`：消息发送路由
- `upload.routes.js`：文件上传路由
- `wechat.routes.js`：企业微信回调路由

### src/middlewares/

中间件提供通用功能：

- `auth.middleware.js`：认证中间件
- `error.middleware.js`：错误处理中间件
- `logger.middleware.js`：请求日志中间件
- `validation.middleware.js`：数据验证中间件

### src/utils/

工具函数：

- `response.js`：统一响应格式
- `validator.js`：验证工具
- `date.js`：日期处理工具
- `file.js`：文件处理工具

## 架构特点

### 模块化设计

- **高内聚低耦合**：各模块职责明确，依赖关系清晰
- **易于扩展**：可以方便地添加新功能或修改现有功能
- **可测试性**：模块化设计便于单元测试和集成测试

### 安全性设计

- **数据加密**：敏感信息使用AES加密存储
- **输入验证**：所有用户输入都经过严格验证
- **错误处理**：统一的错误处理机制，避免信息泄露
- **日志记录**：关键操作都有日志记录，便于审计

### 性能优化

- **连接池**：数据库连接池管理
- **缓存机制**：企业微信Token缓存
- **异步处理**：使用Node.js异步特性提高并发性能
- **资源限制**：文件上传大小限制，防止资源耗尽

## 数据库结构

### 主要数据表

#### configurations 表

存储企业微信应用配置：

```sql
CREATE TABLE IF NOT EXISTS configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    corpId TEXT NOT NULL,
    agentId TEXT NOT NULL,
    secret TEXT NOT NULL,
    token TEXT,
    aesKey TEXT,
    isEnabled INTEGER DEFAULT 1,
    description TEXT,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL
);
```

#### received_messages 表

存储接收到的企业微信消息：

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

#### message_stats 表

存储消息统计信息：

```sql
CREATE TABLE IF NOT EXISTS message_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_code TEXT NOT NULL,
    date TEXT NOT NULL,
    total_received INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    text_messages INTEGER DEFAULT 0,
    image_messages INTEGER DEFAULT 0,
    file_messages INTEGER DEFAULT 0,
    news_messages INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (config_code) REFERENCES configurations(code) ON DELETE CASCADE,
    UNIQUE(config_code, date)
);
```

## 开发工作流

### 开发环境设置

1. 克隆代码库
2. 安装依赖：`npm install`
3. 设置环境变量：创建 `.env` 文件
4. 启动开发服务器：`npm run dev`

### 构建与部署

1. 代码提交和PR
2. GitHub Actions自动构建Docker镜像
3. 部署到目标环境
4. 运行健康检查和功能测试

[返回主文档](./../README.md)