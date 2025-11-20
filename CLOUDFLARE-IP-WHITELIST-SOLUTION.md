# Cloudflare 部署 IP 白名单问题解决方案

## 问题说明

企业微信要求配置 IP 白名单才能调用 API，但 Cloudflare Pages/Workers 的出口 IP 地址：
- 数量庞大（数千个）
- 会动态变化
- 无法全部添加到企业微信白名单（白名单有数量限制）

错误示例：
```
not allow to access from your ip, hint: [1763634821486503300563436], 
from ip: 172.71.81.104
```

## 解决方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| 方案1: 使用代理服务器 | 完美解决IP问题 | 需要额外服务器 | ⭐⭐⭐⭐⭐ |
| 方案2: 使用 Cloudflare Workers + 固定IP服务 | 无需自己维护服务器 | 需要付费服务 | ⭐⭐⭐⭐ |
| 方案3: 混合部署 | 灵活 | 架构复杂 | ⭐⭐⭐ |
| 方案4: 完全放弃 Cloudflare | 不推荐 | 失去 Cloudflare 优势 | ⭐ |

---

## 方案 1：使用代理服务器（推荐）

### 架构
```
Cloudflare Pages → 你的代理服务器（固定IP） → 企业微信 API
```

### 实现步骤

#### 1. 准备一台有固定 IP 的服务器

可以使用：
- 阿里云/腾讯云/AWS 的 VPS（最便宜的即可）
- 甚至可以用家里的电脑 + DDNS

#### 2. 在服务器上部署代理服务

创建 `proxy-server.js`：

```javascript
// 简单的企业微信 API 代理服务器
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 代理所有企业微信 API 请求
app.all('/proxy/*', async (req, res) => {
    try {
        const targetUrl = req.params[0];
        const fullUrl = `https://qyapi.weixin.qq.com/${targetUrl}`;
        
        console.log(`代理请求: ${req.method} ${fullUrl}`);
        
        const response = await axios({
            method: req.method,
            url: fullUrl,
            params: req.query,
            data: req.body,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('代理错误:', error.message);
        res.status(500).json({
            error: '代理请求失败',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`代理服务器运行在端口 ${PORT}`);
});
```

#### 3. 部署代理服务器

```bash
# 安装依赖
npm install express axios

# 使用 PM2 保持运行
npm install -g pm2
pm2 start proxy-server.js
pm2 save
pm2 startup
```

#### 4. 修改 Cloudflare 代码

修改 `src/services/notifier-cf.js`，添加代理支持：

```javascript
// 在文件顶部添加配置
const USE_PROXY = true; // 是否使用代理
const PROXY_URL = 'https://your-proxy-server.com/proxy'; // 你的代理服务器地址

// 修改所有企业微信 API 调用
async function fetchWeChatAPI(endpoint, options = {}) {
    const url = USE_PROXY 
        ? `${PROXY_URL}/${endpoint}`
        : `https://qyapi.weixin.qq.com/${endpoint}`;
    
    return fetch(url, options);
}

// 使用示例
const response = await fetchWeChatAPI(
    `cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`
);
```

#### 5. 配置企业微信白名单

在企业微信管理后台添加你的代理服务器 IP。

### 成本估算
- 最便宜的 VPS：约 ¥10-30/月
- 流量成本：几乎可以忽略（API 调用流量很小）

---

## 方案 2：使用 Cloudflare Workers + 固定 IP 服务

### 使用第三方固定 IP 服务

有一些服务提供固定 IP 的 HTTP 代理：

1. **Bright Data**（原 Luminati）
   - 提供固定 IP 代理
   - 按流量计费
   - 网址：https://brightdata.com

2. **Oxylabs**
   - 企业级代理服务
   - 提供固定 IP
   - 网址：https://oxylabs.io

3. **国内服务**
   - 阿里云 API 网关
   - 腾讯云 API 网关

### 实现方式

```javascript
// 在 Cloudflare Workers 中使用代理
const PROXY_URL = 'http://your-fixed-ip-proxy.com:port';
const PROXY_AUTH = 'username:password';

async function fetchWithProxy(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Proxy-Authorization': `Basic ${btoa(PROXY_AUTH)}`
        },
        // 某些代理服务需要特殊配置
    });
}
```

---

## 方案 3：混合部署

### 架构
```
前端 + 静态资源 → Cloudflare Pages
API 调用 → 你的服务器（固定IP）
```

### 实现
1. Cloudflare Pages 只托管前端页面
2. 所有企业微信 API 调用通过你自己的服务器
3. 前端通过 CORS 调用你的服务器 API

### 优点
- 前端享受 Cloudflare CDN 加速
- API 调用有固定 IP
- 架构清晰

### 缺点
- 需要维护两套部署
- 跨域配置

---

## 方案 4：获取 Cloudflare IP 范围（不推荐）

### Cloudflare 官方 IP 列表

Cloudflare 提供了 IP 范围列表：
- IPv4: https://www.cloudflare.com/ips-v4
- IPv6: https://www.cloudflare.com/ips-v6

但是：
1. **IP 数量太多**（数百个 CIDR 块）
2. **企业微信白名单有数量限制**
3. **IP 会变化**，需要定期更新
4. **不是所有 IP 都会被使用**

### 获取脚本

```bash
# 获取 Cloudflare IPv4 范围
curl https://www.cloudflare.com/ips-v4

# 输出示例：
# 173.245.48.0/20
# 103.21.244.0/22
# 103.22.200.0/22
# ... (很多)
```

### 为什么不推荐
- 企业微信白名单通常限制在 **20-50 个 IP**
- Cloudflare 有 **数百个 IP 段**
- **无法全部添加**

---

## 推荐方案：代理服务器

### 最简单的实现

如果你有一台服务器（或者愿意购买最便宜的 VPS），这是最佳方案：

#### 1. 一键部署脚本

创建 `deploy-proxy.sh`：

```bash
#!/bin/bash

# 安装 Node.js（如果没有）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 创建项目目录
mkdir -p ~/wechat-proxy
cd ~/wechat-proxy

# 创建 package.json
cat > package.json << 'EOF'
{
  "name": "wechat-proxy",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0"
  }
}
EOF

# 创建代理服务器
cat > server.js << 'EOF'
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// CORS 支持
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 代理企业微信 API
app.all('/api/wechat/*', async (req, res) => {
    try {
        const path = req.params[0];
        const url = `https://qyapi.weixin.qq.com/${path}`;
        
        console.log(`[${new Date().toISOString()}] ${req.method} ${url}`);
        
        const response = await axios({
            method: req.method,
            url: url,
            params: req.query,
            data: req.body,
            timeout: 30000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('代理错误:', error.message);
        res.status(error.response?.status || 500).json({
            error: '代理请求失败',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`代理服务器运行在端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
});
EOF

# 安装依赖
npm install

# 安装 PM2
sudo npm install -g pm2

# 启动服务
pm2 start server.js --name wechat-proxy
pm2 save
pm2 startup

echo "代理服务器部署完成！"
echo "请在企业微信后台添加此服务器的 IP 到白名单"
echo "服务器 IP: $(curl -s ifconfig.me)"
```

#### 2. 使用方法

```bash
# 在你的服务器上运行
chmod +x deploy-proxy.sh
./deploy-proxy.sh
```

#### 3. 修改 Cloudflare 代码

在 `wrangler.toml` 中添加：

```toml
[vars]
PROXY_URL = "http://your-server-ip:3000/api/wechat"
USE_PROXY = "true"
```

---

## 结论

### 如果你想继续使用 Cloudflare Pages

**必须使用代理服务器**，这是唯一可行的方案。

### 推荐配置

1. **购买最便宜的 VPS**（¥10-30/月）
   - 阿里云轻量应用服务器
   - 腾讯云轻量应用服务器
   - Vultr/DigitalOcean

2. **部署代理服务**（5分钟）
   - 使用上面的一键脚本
   - 获取服务器 IP

3. **配置企业微信白名单**
   - 添加你的服务器 IP

4. **修改 Cloudflare 代码**
   - 所有企业微信 API 调用通过代理

### 如果不想使用代理

那么 **Cloudflare Pages 不适合这个项目**，建议：
- 使用传统的 VPS 部署（Node.js + SQLite）
- 使用 Vercel（但 Vercel 也有类似的 IP 问题）
- 使用国内的 Serverless 平台（阿里云函数计算、腾讯云云函数）

---

## 下一步

请告诉我你的选择：

1. **使用代理服务器** → 我帮你修改代码以支持代理
2. **放弃 Cloudflare** → 我帮你准备传统部署方案
3. **其他方案** → 我们一起讨论

---

**最后更新：** 2024-11-20
