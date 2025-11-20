# 代理服务器设置指南

## 为什么需要代理服务器？

Cloudflare Pages/Workers 的 IP 地址：
- ❌ 数量庞大（数千个）
- ❌ 会动态变化
- ❌ 无法全部添加到企业微信白名单

**解决方案：使用一台有固定 IP 的服务器作为代理**

## 快速开始（5分钟）

### 步骤 1：准备服务器

你需要一台有固定 IP 的服务器，可以选择：

**推荐选项（按成本排序）：**

1. **阿里云轻量应用服务器** - ¥24/月起
   - 网址：https://www.aliyun.com/product/swas
   - 配置：1核1G即可
   - 优点：国内访问快，稳定

2. **腾讯云轻量应用服务器** - ¥25/月起
   - 网址：https://cloud.tencent.com/product/lighthouse
   - 配置：1核1G即可
   - 优点：价格便宜，易用

3. **Vultr** - $5/月起
   - 网址：https://www.vultr.com
   - 配置：1核512M即可
   - 优点：按小时计费，随时删除

4. **DigitalOcean** - $4/月起
   - 网址：https://www.digitalocean.com
   - 配置：1核512M即可
   - 优点：界面友好，文档完善

### 步骤 2：部署代理服务器

#### 方法 A：一键部署（推荐）

```bash
# 1. SSH 连接到你的服务器
ssh root@your-server-ip

# 2. 下载部署脚本
wget https://raw.githubusercontent.com/your-repo/cloudflare/proxy-server/deploy.sh

# 3. 运行部署脚本
chmod +x deploy.sh
sudo ./deploy.sh

# 4. 记录显示的 IP 地址
```

#### 方法 B：手动部署

```bash
# 1. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 创建项目目录
mkdir -p ~/wechat-proxy
cd ~/wechat-proxy

# 3. 下载代码
git clone https://github.com/your-repo/qywx-push.git
cd qywx-push/proxy-server

# 4. 安装依赖
npm install

# 5. 启动服务
npm install -g pm2
pm2 start server.js --name wechat-proxy
pm2 save
pm2 startup

# 6. 获取服务器 IP
curl http://localhost:3000/ip
```

#### 方法 C：使用 Docker

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh

# 2. 运行容器
docker run -d \
  --name wechat-proxy \
  --restart always \
  -p 3000:3000 \
  -e API_KEY=your-secret-key \
  your-dockerhub-username/wechat-proxy:latest

# 3. 查看日志
docker logs -f wechat-proxy
```

### 步骤 3：配置企业微信白名单

1. 登录 [企业微信管理后台](https://work.weixin.qq.com)
2. 进入 **应用管理** > 选择你的应用
3. 找到 **企业可信IP** 设置
4. 添加你的代理服务器 IP
5. 保存

### 步骤 4：配置 Cloudflare

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 选择你的项目
4. 点击 **Settings** > **Environment variables**
5. 添加变量：
   ```
   Name: PROXY_URL
   Value: http://your-server-ip:3000/api/wechat
   ```
6. 如果设置了 API 密钥，还需添加：
   ```
   Name: PROXY_API_KEY
   Value: your-api-key
   ```
7. 保存并重新部署

### 步骤 5：测试

访问你的 Cloudflare Pages 网站，尝试：
1. 生成回调URL
2. 完成配置
3. 发送测试消息

如果一切正常，你应该能成功发送消息！

## 验证代理服务器

### 检查服务状态

```bash
# 方法 1：访问健康检查端点
curl http://your-server-ip:3000/health

# 方法 2：使用 PM2
pm2 status

# 方法 3：查看日志
pm2 logs wechat-proxy
```

### 测试代理功能

```bash
# 测试获取 token（替换为你的实际参数）
curl "http://your-server-ip:3000/api/wechat/cgi-bin/gettoken?corpid=YOUR_CORPID&corpsecret=YOUR_SECRET"
```

## 常见问题

### Q1: 服务器端口无法访问

**检查防火墙：**

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw status

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**检查云服务商安全组：**
- 阿里云：进入实例 > 安全组 > 添加规则
- 腾讯云：进入实例 > 防火墙 > 添加规则
- 允许入站规则：TCP 端口 3000

### Q2: 代理服务器重启后服务停止

使用 PM2 设置开机自启：

```bash
pm2 startup
pm2 save
```

### Q3: 如何更新代理服务器

```bash
cd ~/wechat-proxy
git pull
npm install
pm2 restart wechat-proxy
```

### Q4: 如何查看代理日志

```bash
# 实时日志
pm2 logs wechat-proxy

# 查看最近 100 行
pm2 logs wechat-proxy --lines 100

# 清空日志
pm2 flush
```

### Q5: 代理服务器占用多少资源？

非常少！
- CPU: < 1%
- 内存: ~50MB
- 流量: 几乎可以忽略（API 调用很小）

最便宜的 VPS（1核512M）完全够用。

## 安全建议

### 1. 启用 API 密钥保护

```bash
# 设置环境变量
export API_KEY=your-random-secret-key

# 或在 PM2 中设置
pm2 start server.js --name wechat-proxy --env API_KEY=your-secret-key
```

### 2. 使用 HTTPS

安装 Nginx 和 Let's Encrypt：

```bash
# 安装 Nginx
sudo apt install nginx

# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# Nginx 配置
sudo nano /etc/nginx/sites-available/wechat-proxy
```

Nginx 配置示例：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 限制访问来源

只允许 Cloudflare IP 访问：

```nginx
# 在 Nginx 配置中添加
location / {
    # Cloudflare IP 范围（示例）
    allow 173.245.48.0/20;
    allow 103.21.244.0/22;
    # ... 更多 Cloudflare IP
    deny all;
    
    proxy_pass http://localhost:3000;
}
```

## 成本分析

### 最低成本方案

- **服务器**: ¥24/月（阿里云轻量）
- **域名**: ¥10/年（可选）
- **总计**: 约 ¥25/月

### 与其他方案对比

| 方案 | 月成本 | 优点 | 缺点 |
|------|--------|------|------|
| 代理服务器 | ¥25 | 完全控制，稳定 | 需要维护 |
| 第三方代理 | ¥100+ | 无需维护 | 贵，依赖第三方 |
| 传统 VPS | ¥30+ | 全功能 | 配置复杂 |

## 监控和维护

### 设置监控

使用 UptimeRobot 或类似服务监控代理服务器：

1. 注册 [UptimeRobot](https://uptimerobot.com)（免费）
2. 添加监控：`http://your-server-ip:3000/health`
3. 设置告警（邮件/短信）

### 定期维护

```bash
# 每月执行一次

# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 更新 Node.js 包
cd ~/wechat-proxy
npm update

# 3. 重启服务
pm2 restart wechat-proxy

# 4. 检查日志
pm2 logs wechat-proxy --lines 50
```

## 总结

使用代理服务器是在 Cloudflare 上部署企业微信通知服务的**最佳方案**：

✅ 解决 IP 白名单问题
✅ 成本低（¥25/月）
✅ 配置简单（5分钟）
✅ 稳定可靠
✅ 完全控制

如果你有任何问题，请查看：
- [详细解决方案文档](./CLOUDFLARE-IP-WHITELIST-SOLUTION.md)
- [代理服务器 README](./proxy-server/README.md)
- [常见错误文档](./COMMON-ERRORS-CN.md)

---

**最后更新：** 2024-11-20
