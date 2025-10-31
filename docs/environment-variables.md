# 企业微信通知服务 - 环境变量配置

本文档详细介绍了企业微信通知服务的环境变量配置选项，帮助您正确设置服务参数。

## 基础环境变量

### 服务配置

| 环境变量 | 默认值 | 描述 | 必填 |
|---------|-------|------|------|
| `PORT` | `12121` | HTTP服务端口 | 否 |
| `NODE_ENV` | `production` | 运行环境 (development/production) | 否 |
| `TZ` | `Asia/Shanghai` | 时区设置 | 否 |
| `HOST` | `0.0.0.0` | 服务监听地址 | 否 |

### 数据库配置

| 环境变量 | 默认值 | 描述 | 必填 |
|---------|-------|------|------|
| `DB_PATH` | `./database/notifier.db` | SQLite数据库文件路径 | 否 |
| `DB_MAX_CONNECTIONS` | `10` | 最大数据库连接数 | 否 |

### 安全配置

| 环境变量 | 默认值 | 描述 | 必填 |
|---------|-------|------|------|
| `ENCRYPTION_KEY` | 无 | AES加密密钥，必须32字符 | 是 |
| `JWT_SECRET` | 无 | JWT签名密钥（可选） | 否 |
| `SESSION_SECRET` | 无 | 会话密钥（可选） | 否 |

### 企业微信API配置

| 环境变量 | 默认值 | 描述 | 必填 |
|---------|-------|------|------|
| `WECHAT_API_BASE` | `https://qyapi.weixin.qq.com` | 企业微信API基础URL | 否 |
| `WECHAT_TIMEOUT` | `10000` | API请求超时时间(ms) | 否 |
| `WECHAT_RETRY_TIMES` | `3` | API请求重试次数 | 否 |
| `WECHAT_RETRY_DELAY` | `1000` | API请求重试间隔(ms) | 否 |

### 文件上传配置

| 环境变量 | 默认值 | 描述 | 必填 |
|---------|-------|------|------|
| `UPLOAD_MAX_SIZE` | `20971520` | 最大文件大小(20MB) | 否 |
| `UPLOAD_PATH` | `./uploads` | 文件上传目录 | 否 |
| `UPLOAD_ALLOWED_TYPES` | 多种 | 允许的文件类型 | 否 |

### 日志配置

| 环境变量 | 默认值 | 描述 | 必填 |
|---------|-------|------|------|
| `LOG_LEVEL` | `info` | 日志级别 (error/warn/info/debug) | 否 |
| `LOG_PATH` | `./logs` | 日志文件目录 | 否 |
| `LOG_MAX_SIZE` | `10485760` | 日志文件最大大小(10MB) | 否 |
| `LOG_MAX_FILES` | `5` | 保留日志文件数量 | 否 |
| `LOG_FORMAT` | `json` | 日志格式 (json/text) | 否 |

## 配置方法

### 1. 使用 .env 文件

创建一个 `.env` 文件在项目根目录：

```bash
# .env 文件示例
ENCRYPTION_KEY=your-32-character-encryption-key
PORT=12121
NODE_ENV=production
TZ=Asia/Shanghai
LOG_LEVEL=info
```

### 2. Docker 环境变量

在 Docker 命令中直接设置环境变量：

```bash
docker run -d \
  --name wechat-notifier \
  -p 12121:12121 \
  -e ENCRYPTION_KEY=your-32-char-key \
  -e PORT=12121 \
  -e LOG_LEVEL=info \
  xiaobaiweinuli/qywx-push:latest
```

### 3. Docker Compose 环境变量

在 `docker-compose.yml` 文件中设置环境变量：

```yaml
services:
  wechat-notifier:
    image: xiaobaiweinuli/qywx-push:latest
    environment:
      - ENCRYPTION_KEY=your-32-char-key
      - PORT=12121
      - LOG_LEVEL=info
      - TZ=Asia/Shanghai
```

### 4. 命令行环境变量

在启动命令前直接指定环境变量：

```bash
# Linux/macOS
ENCRYPTION_KEY=your-32-char-key PORT=12121 npm start

# Windows
set ENCRYPTION_KEY=your-32-char-key
set PORT=12121
npm start
```

## 安全提示

### 加密密钥安全

**`ENCRYPTION_KEY` 是非常重要的安全参数**，请务必：

1. **使用强随机生成的密钥**：至少32个字符，包含字母、数字和特殊字符
2. **妥善保管**：不要在代码仓库、日志或配置文件中明文存储
3. **定期轮换**：建议每3-6个月更换一次密钥
4. **不同环境使用不同密钥**：开发、测试和生产环境应使用独立的密钥

### 密钥生成方法

```bash
# 使用OpenSSL生成32字符密钥（推荐）
openssl rand -hex 16

# 使用Node.js生成
node -e "console.log(crypto.randomBytes(16).toString('hex'))"

# 使用Python生成
python3 -c "import secrets; print(secrets.token_hex(16))"
```

## 高级配置示例

### 完整的 .env 文件示例

```bash
# 基础配置
PORT=12121
NODE_ENV=production
TZ=Asia/Shanghai
HOST=0.0.0.0

# 安全配置
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-key

# 数据库配置
DB_PATH=/data/database/notifier.db
DB_MAX_CONNECTIONS=10

# 文件上传配置
UPLOAD_MAX_SIZE=52428800  # 50MB
UPLOAD_PATH=/data/uploads

# 日志配置
LOG_LEVEL=info
LOG_PATH=/data/logs
LOG_MAX_SIZE=20971520  # 20MB
LOG_MAX_FILES=10

# 企业微信API配置
WECHAT_API_BASE=https://qyapi.weixin.qq.com
WECHAT_TIMEOUT=15000
WECHAT_RETRY_TIMES=3
```

### 开发环境配置

```bash
# 开发环境 .env 文件
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
TZ=Asia/Shanghai
ENCRYPTION_KEY=development-encryption-key-32
```

## 配置验证

启动服务后，您可以通过以下方式验证配置是否生效：

1. 查看服务日志，确认端口、环境等参数是否正确加载
2. 访问健康检查接口，检查服务状态
3. 尝试发送一条测试消息，验证企业微信API连接是否正常

## 注意事项

1. 所有路径配置都相对于应用程序的工作目录
2. Docker环境下，建议使用数据卷挂载配置文件和数据目录
3. 生产环境中，务必确保 `NODE_ENV=production` 以获得最佳性能
4. 定期检查和更新环境变量，特别是安全相关的配置

[返回主文档](./../README.md)