#!/bin/bash

# Cloudflare D1 数据库修复脚本
# 用于修复 "生成回调URL失败: Unexpected end of JSON input" 错误

echo "=========================================="
echo "Cloudflare D1 数据库修复脚本"
echo "=========================================="
echo ""

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误：未找到 wrangler 命令"
    echo "请先安装 wrangler: npm install -g wrangler"
    exit 1
fi

echo "✅ 检测到 wrangler"
echo ""

# 获取数据库名称（从 wrangler.toml 读取）
DB_NAME="wechat-notifier-db"
echo "数据库名称: $DB_NAME"
echo ""

# 询问用户选择环境
echo "请选择要修复的环境："
echo "1) 本地开发环境 (--local)"
echo "2) 生产环境 (--remote)"
read -p "请输入选项 (1 或 2): " ENV_CHOICE

if [ "$ENV_CHOICE" = "1" ]; then
    ENV_FLAG="--local"
    ENV_NAME="本地"
elif [ "$ENV_CHOICE" = "2" ]; then
    ENV_FLAG="--remote"
    ENV_NAME="生产"
else
    echo "❌ 无效的选项"
    exit 1
fi

echo ""
echo "=========================================="
echo "开始修复 $ENV_NAME 环境数据库"
echo "=========================================="
echo ""

# 询问是否备份
if [ "$ENV_CHOICE" = "2" ]; then
    read -p "是否先备份数据？(y/n): " BACKUP_CHOICE
    if [ "$BACKUP_CHOICE" = "y" ] || [ "$BACKUP_CHOICE" = "Y" ]; then
        echo "📦 正在备份数据..."
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        wrangler d1 execute $DB_NAME --remote --command="SELECT * FROM configurations;" > "$BACKUP_FILE"
        echo "✅ 备份已保存到: $BACKUP_FILE"
        echo ""
    fi
fi

# 执行迁移
echo "🔄 执行数据库迁移..."
wrangler d1 execute $DB_NAME $ENV_FLAG --file=./migrations/001_allow_null_fields.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ 数据库修复完成！"
    echo "=========================================="
    echo ""
    echo "下一步："
    echo "1. 重新部署应用: npm run deploy"
    echo "2. 访问你的网站测试功能"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ 数据库修复失败"
    echo "=========================================="
    echo ""
    echo "请检查错误信息，或参考 CLOUDFLARE-DATABASE-MIGRATION.md 手动修复"
    echo ""
    exit 1
fi
