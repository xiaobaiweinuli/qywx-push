# 企业微信 API 代理服务器

解决 Cloudflare Pages/Workers 无法添加到企业微信 IP 白名单的问题。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 使用 PM2（推荐）
npm run pm2:start
```

### 3. 获取服务器 IP

```bash
curl http://localhost:3000/ip
```

将返回的 IP 地址添加到企业微信管理后台的 IP 白名单。

## 环境变量

创建 `.env` 文件：

```env
PORT=3000
API_KEY=your-secret-api-key  # 可选，用于保护代理服务器
```

## API 端点

### 健康检查

```bash
GET /health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2024-11-20T12:00:00.000Z",
  "uptime": 123.456,
  "memory": {...}
}
```

### 获取服务器 IP

```bash
GET /ip
```

响应：
```json
{
  "ip": "1.2.3.4",
  "message": "请将此 IP 添加到企业微信白名单"
}
```

### 代理企业微信 API

```bash
# 原始请求
GET https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=xxx&corpsecret=yyy

# 通过代理
GET http://your-server:3000/api/wechat/cgi-bin/gettoken?corpid=xxx&corpsecret=yyy
```

## 部署

### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name wechat-proxy

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs wechat-proxy

# 重启服务
pm2 restart wechat-proxy
```

### 使用 Docker

```bash
# 构建镜像
docker build -t wechat-proxy .

# 运行容器
docker run -d -p 3000:3000 --name wechat-proxy wechat-proxy
```

### 使用 Systemd

创建 `/etc/systemd/system/wechat-proxy.service`：

```ini
[Unit]
Description=WeChat API Proxy Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/proxy-server
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl enable wechat-proxy
sudo systemctl start wechat-proxy
sudo systemctl status wechat-proxy
```

## 安全建议

1. **使用 API 密钥**
   ```bash
   export API_KEY=your-secret-key
   ```

2. **使用 HTTPS**
   - 配置 Nginx 反向代理
   - 使用 Let's Encrypt 证书

3. **限制访问来源**
   - 在防火墙中只允许 Cloudflare IP 访问
   - 使用 Nginx 的 `allow`/`deny` 指令

4. **监控和日志**
   - 使用 PM2 监控进程
   - 定期检查日志文件

## 故障排除

### 服务器无法启动

检查端口是否被占用：
```bash
lsof -i :3000
```

### 无法连接到企业微信

检查服务器出口 IP：
```bash
curl http://localhost:3000/ip
```

确认该 IP 已添加到企业微信白名单。

### 代理请求失败

查看日志：
```bash
pm2 logs wechat-proxy
```

## 性能优化

1. **启用 Gzip 压缩**
2. **使用连接池**
3. **添加请求缓存**（对于 access_token 等）
4. **使用 Nginx 作为反向代理**

## 许可证

MIT
