# 企业微信通知服务 - 部署指南

本文档详细介绍了企业微信通知服务的各种部署方式，包括Docker部署、本地部署和其他部署选项。

## 前置条件

在部署前，请确保您已满足以下要求：

- **Node.js**: 18.x 或更高版本（本地部署）
- **Docker**: 20.10 或更高版本（Docker部署）
- **Docker Compose**: 2.0 或更高版本（Docker Compose部署）
- **企业微信**: 需要有企业微信管理员权限或应用创建权限
- **服务器**: 推荐2核4G内存，支持公网访问（用于回调功能）
- **密钥生成**: 准备一个32字符的加密密钥（用于敏感信息加密）

## Docker 部署

### 标准Docker部署

1. **克隆项目（可选）**

```bash
git clone https://github.com/xiaobaiweinuli/qywx-push.git
cd qywx-push
```

2. **生成加密密钥**

```bash
# 使用OpenSSL生成32字符密钥
openssl rand -hex 16
```

3. **启动服务**

```bash
docker run -d \
  --name wechat-notifier \
  -p 12121:12121 \
  -v $(pwd)/database:/app/database:rw \
  -v $(pwd)/uploads:/app/uploads:rw \
  -v $(pwd)/logs:/app/logs:rw \
  -e ENCRYPTION_KEY=your-32-char-key \
  xiaobaiweinuli/qywx-push:latest
```

4. **验证服务状态**

```bash
# 检查容器运行状态
docker ps

# 查看服务日志
docker logs -f wechat-notifier
```

### Docker Compose 部署

1. **创建环境变量文件**

```bash
# .env 文件
ENCRYPTION_KEY=your-32-char-key
```

2. **使用标准配置启动**

```bash
docker-compose up -d
```

3. **使用ClawCloud配置启动**

```bash
docker-compose -f docker-compose.clawcloud.yml up -d
```

### Docker Compose 高级配置

```yaml
version: '3.8'
services:
  wechat-notifier:
    image: xiaobaiweinuli/qywx-push:latest
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

## 本地部署

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/xiaobaiweinuli/qywx-push.git
cd qywx-push
```

2. **安装依赖**

```bash
npm install --production
```

3. **配置环境变量**

创建 `.env` 文件：

```bash
# .env 文件
ENCRYPTION_KEY=your-32-char-key
PORT=12121
NODE_ENV=production
```

4. **启动服务**

```bash
# 生产模式
npm start

# 开发模式（含热重载）
npm run dev
```

### 开发环境配置

开发模式下，服务会自动监听文件变化并重新加载，便于开发调试：

```bash
# 启动开发服务器
npm run dev

# 构建Docker镜像并测试
npm run docker:build
npm run docker:up
```

## 部署方式

### Docker Hub 自动构建

项目已配置 GitHub Actions 自动构建：

```bash
# 使用标准镜像
docker pull xiaobaiweinuli/qywx-push:latest

# 使用ClawCloud优化镜像
docker pull xiaobaiweinuli/qywx-push:clawcloud
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
  xiaobaiweinuli/qywx-push:clawcloud
```

## Docker 镜像

- **标准镜像**：`Dockerfile` - 适用于大多数环境
- **ClawCloud镜像**：`Dockerfile.clawcloud` - 针对ClawCloud优化
- **自动构建**：GitHub Actions 自动构建并推送到 Docker Hub

## NPM 脚本

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

## 网络配置

### 防火墙设置

确保服务器防火墙允许12121端口访问：

```bash
# Ubuntu/CentOS 防火墙配置
sudo ufw allow 12121/tcp
sudo firewall-cmd --permanent --add-port=12121/tcp
sudo firewall-cmd --reload
```

### Nginx 反向代理配置

为了支持HTTPS和更好的安全性，建议配置Nginx反向代理：

```nginx
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

## 数据备份策略

为确保数据安全，建议定期备份数据库和配置文件：

```bash
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

## 部署后验证

部署完成后，建议进行以下验证：

1. **访问健康检查接口**：`http://your-server:12121/`
2. **访问Web管理界面**：`http://your-server:12121/admin`
3. **测试消息发送功能**：使用API或Web界面发送测试消息

## 常见部署问题

### 端口不一致

如果端口显示不是12121，请检查：
1. `.env` 文件中的 `PORT` 设置
2. Docker Compose配置中的端口映射
3. 服务器防火墙设置

### 数据持久化

Docker部署时确保正确配置了数据卷挂载：
```yaml
volumes:
  - ./database:/app/database:rw  # 持久化数据库
  - ./uploads:/app/uploads:rw    # 持久化上传文件
  - ./logs:/app/logs:rw          # 持久化日志
```

[返回主文档](./../README.md)