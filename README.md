# 企业微信通知服务 | WeChat Work Notification Service

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub%20Actions-orange.svg)](https://github.com/features/actions)

🚀 **专业级企业微信消息推送服务** - 支持多种消息格式、文件上传、回调处理的轻量级通知解决方案

## 🌟 核心特性 | Key Features

### 📱 多种消息格式支持
- **文本消息** - 基础文本通知，支持标题和内容
- **文本卡片** - 带链接跳转的卡片式消息，适合告警通知
- **Markdown消息** - 支持富文本格式，标题、粗体、链接、引用
- **图文消息** - 多图文推送，最多支持8个图文项
- **文件上传** - 支持PDF、Word、Excel、图片等多种文件格式
- **图片消息** - 专门的图片消息推送

### 🔄 双向通信能力
- **消息接收** - 接收企业微信用户发送的消息
- **回调验证** - 官方wxcrypt库，完全兼容企业微信回调验证
- **消息解密** - 自动解密企业微信推送的加密消息
- **事件处理** - 支持文本、图片、文件等多种消息类型处理

### 🛡️ 企业级安全
- **数据加密** - AES-256-CBC加密存储敏感配置
- **官方验证** - 使用企业微信官方回调验证算法
- **访问控制** - 支持IP白名单和Token验证
- **安全存储** - SQLite数据库本地存储，数据可控

### 🚀 部署友好
- **Docker支持** - 提供标准Docker镜像和ClawCloud优化镜像
- **一键部署** - Docker Compose一键启动
- **多平台支持** - 支持Linux、Windows、macOS
- **云平台优化** - 专门优化的ClawCloud部署配置

## ✨ 功能特性

- 📝 **多种消息格式**：文本、文本卡片、Markdown、图文、文件、图片
- 🔄 **双向通信**：支持企业微信回调消息接收
- 🛡️ **安全可靠**：数据加密存储，官方回调验证
- 🚀 **简单易用**：Web界面配置，RESTful API调用
- 📱 **测试友好**：内置消息发送测试页面

## 🚀 快速开始

### Docker部署（推荐）

```bash
# 1. 修改加密密钥
nano docker-compose.yml
# 将 ENCRYPTION_KEY 改为32位随机字符串

# 2. 启动服务
docker-compose up -d

# 3. 访问应用
http://your-server:12121
```

### 本地部署

```bash
# 1. 安装依赖
npm install

# 2. 启动服务
npm start

# 3. 访问应用
http://localhost:12121
```

## 📋 使用流程

### 1. 配置企业微信应用

1. **生成回调URL**：填写 CorpID、Token、AES密钥
2. **配置企业微信后台**：设置回调URL和IP白名单
3. **完善配置**：选择接收成员，获得API地址

### 2. 发送消息

```bash
# 文本消息
curl -X POST "http://your-server:12121/api/notify/your-code" \
  -H "Content-Type: application/json" \
  -d '{"title": "告警", "content": "服务器CPU过高"}'

# 文本卡片
curl -X POST "http://your-server:12121/api/notify/your-code/textcard" \
  -H "Content-Type: application/json" \
  -d '{"title": "系统告警", "description": "详细描述", "url": "https://example.com"}'

# Markdown消息
curl -X POST "http://your-server:12121/api/notify/your-code/markdown" \
  -H "Content-Type: application/json" \
  -d '{"content": "# 标题\n**粗体** *斜体*"}'

# 文件上传
curl -X POST "http://your-server:12121/api/notify/your-code/file" \
  -F "file=@report.pdf" -F "fileType=file"
```

## 🔧 API文档

- **主页面**：`/`
- **消息测试**：`/public/message-sender.html`
- **API文档**：`/public/enhanced-api-docs.html`

### 支持的消息格式

| 格式 | 端点 | 说明 |
|------|------|------|
| 文本 | `/api/notify/:code` | 基础文本消息 |
| 文本卡片 | `/api/notify/:code/textcard` | 带链接的卡片 |
| Markdown | `/api/notify/:code/markdown` | 富文本格式 |
| 图文 | `/api/notify/:code/news` | 多图文消息 |
| 文件 | `/api/notify/:code/file` | 文件上传 |

## 🛠️ 环境变量

```bash
PORT=12121                          # 服务端口
DB_PATH=/app/database/notifier.db   # 数据库路径
ENCRYPTION_KEY=your-32-char-key     # 加密密钥（必须修改）
NODE_ENV=production                 # 运行环境
WECHAT_API_BASE=https://qyapi.weixin.qq.com  # 企业微信API
```

## 📁 项目结构

```
├── src/
│   ├── api/routes.js          # 统一API路由
│   ├── core/
│   │   ├── wechat.js         # 企业微信API（支持所有格式）
│   │   ├── database.js       # 数据库操作
│   │   ├── crypto.js         # 数据加密
│   │   └── wechat-callback.js # 回调处理
│   └── services/notifier.js   # 业务逻辑（统一版本）
├── public/                    # 前端页面
├── database/                  # 数据存储
├── docker-compose.yml         # Docker配置
├── Dockerfile                 # 容器构建
└── server.js                  # 应用入口
```

## 🔒 安全建议

1. **修改加密密钥**：使用随机32字符字符串
2. **配置HTTPS**：生产环境启用SSL
3. **限制访问**：配置防火墙和IP白名单
4. **定期备份**：备份 `database` 目录

## 📞 故障排除

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 完全重建
docker-compose down && docker-compose up -d --build
```

## 🎯 部署方式

### Docker Hub 自动构建

项目已配置 GitHub Actions 自动构建：

```bash
# 使用标准镜像
docker pull your-username/wechat-notifier:latest

# 使用ClawCloud优化镜像
docker pull your-username/wechat-notifier:clawcloud
```

### ClawCloud 部署

```bash
# 使用ClawCloud专用配置
docker-compose -f docker-compose.clawcloud.yml up -d

# 或直接使用ClawCloud镜像
docker run -d \
  --name wechat-notifier \
  -p 12121:12121 \
  -e ENCRYPTION_KEY=your-32-char-key \
  your-username/wechat-notifier:clawcloud
```

### 本地开发

```bash
# 开发模式
npm run dev

# Docker构建测试
npm run docker:build
npm run docker:up
```

## 📦 Docker 镜像

- **标准镜像**：`Dockerfile` - 适用于大多数环境
- **ClawCloud镜像**：`Dockerfile.clawcloud` - 针对ClawCloud优化
- **自动构建**：GitHub Actions 自动构建并推送到 Docker Hub

## 🔧 NPM 脚本

```bash
npm run start          # 启动生产服务
npm run dev            # 开发模式（热重载）
npm run docker:build   # 构建标准Docker镜像
npm run docker:build:clawcloud  # 构建ClawCloud镜像
npm run docker:up      # 启动Docker服务
npm run docker:up:clawcloud     # 启动ClawCloud Docker服务
npm run docker:logs    # 查看Docker日志
npm run docker:down    # 停止Docker服务
```

## 🎯 使用场景 | Use Cases

### 🏢 企业运维监控
- **服务器告警** - CPU、内存、磁盘使用率告警推送
- **应用监控** - 应用异常、性能指标监控通知
- **日志告警** - 错误日志、异常事件实时推送
- **备份通知** - 数据库备份、文件备份完成通知

### 📊 业务数据推送
- **销售报表** - 日报、周报、月报自动推送
- **订单通知** - 新订单、退款、异常订单提醒
- **用户行为** - 用户注册、活跃度、留存率统计
- **财务数据** - 收入统计、成本分析、利润报告

### 🔔 自动化通知
- **CI/CD流程** - 构建成功、部署完成、测试结果
- **定时任务** - 定时脚本执行结果、数据同步状态
- **系统维护** - 维护窗口通知、升级完成提醒
- **安全事件** - 登录异常、权限变更、安全扫描结果

## 🔍 SEO关键词 | Keywords

**企业微信通知**, **WeChat Work API**, **企业微信机器人**, **消息推送服务**, **企业微信SDK**, **微信工作通知**, **企业微信开发**, **消息自动化**, **企业通讯**, **办公自动化**, **企业微信集成**, **微信企业号**, **消息推送平台**, **企业级通知**, **微信API接口**, **企业微信回调**, **消息队列**, **通知中心**, **企业微信webhook**, **自动化运维**

## 📈 性能特点 | Performance

- ⚡ **高性能** - Node.js异步处理，支持高并发请求
- 💾 **低内存** - 基于SQLite轻量级数据库，内存占用小
- 🚀 **快速响应** - 平均响应时间 < 100ms
- 📦 **小体积** - Docker镜像 < 200MB，部署快速
- 🔄 **高可用** - 支持健康检查，自动重启机制
- 📊 **可监控** - 内置日志记录，便于问题排查

## 🌐 兼容性 | Compatibility

### 支持的Node.js版本
- ✅ Node.js 18.x (推荐)
- ✅ Node.js 19.x
- ✅ Node.js 20.x (LTS)

### 支持的操作系统
- ✅ Ubuntu 18.04+
- ✅ CentOS 7+
- ✅ Windows 10+
- ✅ macOS 10.15+
- ✅ Alpine Linux (Docker)

### 支持的部署平台
- ✅ Docker / Docker Compose
- ✅ ClawCloud
- ✅ AWS EC2
- ✅ 阿里云ECS
- ✅ 腾讯云CVM
- ✅ 本地服务器

## 🔧 高级配置 | Advanced Configuration

### 环境变量详解

```bash
# 基础配置
PORT=12121                    # HTTP服务端口
NODE_ENV=production          # 运行环境: development/production
TZ=Asia/Shanghai            # 时区设置

# 数据库配置
DB_PATH=./database/notifier.db    # SQLite数据库文件路径

# 安全配置
ENCRYPTION_KEY=your-32-char-key   # AES加密密钥，必须32字符
JWT_SECRET=your-jwt-secret        # JWT签名密钥（可选）

# 企业微信API配置
WECHAT_API_BASE=https://qyapi.weixin.qq.com  # 企业微信API基础URL
WECHAT_TIMEOUT=10000                         # API请求超时时间(ms)

# 文件上传配置
UPLOAD_MAX_SIZE=20971520     # 最大文件大小(20MB)
UPLOAD_PATH=./uploads        # 文件上传目录

# 日志配置
LOG_LEVEL=info              # 日志级别: error/warn/info/debug
LOG_MAX_SIZE=10485760       # 日志文件最大大小(10MB)
LOG_MAX_FILES=5             # 保留日志文件数量
```

### Docker Compose 高级配置

```yaml
version: '3.8'
services:
  wechat-notifier:
    image: your-username/wechat-notifier:latest
    container_name: wechat-notifier
    restart: unless-stopped
    ports:
      - "12121:12121"
    volumes:
      - ./database:/app/database:rw
      - ./uploads:/app/uploads:rw
      - ./logs:/app/logs:rw
    environment:
      PORT: 12121
      NODE_ENV: production
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      TZ: Asia/Shanghai
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:12121/"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🔐 安全最佳实践 | Security Best Practices

### 1. 加密密钥管理
```bash
# 生成安全的32字符加密密钥
openssl rand -hex 16

# 或使用在线工具生成
# https://www.random.org/strings/
```

### 2. 网络安全配置
```bash
# 防火墙配置 (Ubuntu/CentOS)
sudo ufw allow 12121/tcp
sudo firewall-cmd --permanent --add-port=12121/tcp

# Nginx反向代理配置
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:12121;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 数据备份策略
```bash
# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/wechat-notifier"
mkdir -p $BACKUP_DIR

# 备份数据库
cp ./database/notifier.db $BACKUP_DIR/notifier_$DATE.db

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker-compose.yml

# 清理7天前的备份
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🐛 常见问题 | FAQ

### Q: 为什么端口显示3000而不是12121？
**A:** 检查以下配置：
1. `.env` 文件中的 `PORT` 设置
2. 系统环境变量中的 `PORT` 设置
3. Docker容器的端口映射配置

### Q: 消息发送失败怎么办？
**A:** 按以下步骤排查：
1. 检查企业微信配置是否正确
2. 验证IP白名单设置
3. 确认用户ID是否存在
4. 查看服务器日志获取详细错误信息

### Q: 文件上传失败？
**A:** 可能的原因：
1. 文件大小超过20MB限制
2. 文件格式不支持
3. 磁盘空间不足
4. 权限问题

### Q: 回调验证失败？
**A:** 检查项目：
1. Token和EncodingAESKey是否正确
2. 服务器时间是否同步
3. 网络连接是否正常
4. 企业微信后台配置是否正确

## 📞 技术支持 | Support

- 🐛 **Bug报告**: [GitHub Issues](https://github.com/your-username/wechat-notifier/issues)
- 💬 **功能建议**: [GitHub Discussions](https://github.com/your-username/wechat-notifier/discussions)
- 📖 **文档**: [项目Wiki](https://github.com/your-username/wechat-notifier/wiki)
- 📧 **邮件支持**: support@your-domain.com

## 🤝 贡献指南 | Contributing

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 开源协议 | License

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢 | Acknowledgments

- [企业微信API文档](https://developer.work.weixin.qq.com/)
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [SQLite](https://www.sqlite.org/)
- [Docker](https://www.docker.com/)

---

**v2.0 企业级版本** | 统一架构 · 多平台部署 · 自动化构建 · 生产就绪

⭐ 如果这个项目对你有帮助，请给个Star支持一下！