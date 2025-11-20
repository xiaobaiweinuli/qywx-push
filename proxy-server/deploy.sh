#!/bin/bash

# 企业微信 API 代理服务器一键部署脚本

set -e

echo "=========================================="
echo "企业微信 API 代理服务器部署脚本"
echo "=========================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "无法检测操作系统"
    exit 1
fi

echo "检测到操作系统: $OS"
echo ""

# 安装 Node.js
echo "正在安装 Node.js..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
else
    echo "不支持的操作系统: $OS"
    exit 1
fi

echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"
echo ""

# 创建项目目录
PROJECT_DIR="/opt/wechat-proxy"
echo "创建项目目录: $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 复制文件（如果在当前目录）
if [ -f "../server.js" ]; then
    cp ../server.js .
    cp ../package.json .
fi

# 安装依赖
echo "正在安装依赖..."
npm install --production

# 安装 PM2
echo "正在安装 PM2..."
npm install -g pm2

# 配置防火墙
echo "配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 3000/tcp
    echo "已允许端口 3000"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --reload
    echo "已允许端口 3000"
fi

# 启动服务
echo "启动服务..."
pm2 start server.js --name wechat-proxy
pm2 save
pm2 startup

# 获取服务器 IP
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "服务器信息："
echo "- 本地地址: http://localhost:3000"
echo "- 公网 IP: $(curl -s ifconfig.me)"
echo ""
echo "下一步："
echo "1. 访问 http://$(curl -s ifconfig.me):3000/health 检查服务状态"
echo "2. 访问 http://$(curl -s ifconfig.me):3000/ip 获取 IP 地址"
echo "3. 将上述 IP 添加到企业微信管理后台的 IP 白名单"
echo "4. 在 Cloudflare 项目中配置代理 URL"
echo ""
echo "常用命令："
echo "- 查看日志: pm2 logs wechat-proxy"
echo "- 重启服务: pm2 restart wechat-proxy"
echo "- 停止服务: pm2 stop wechat-proxy"
echo "- 查看状态: pm2 status"
echo ""
echo "=========================================="
