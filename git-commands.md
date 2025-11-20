# Git 命令 - 创建 Cloudflare 分支并上传到 GitHub

## 方法 1: 创建新分支（推荐）

```bash
# 1. 创建并切换到新分支 cloudflare
git checkout -b cloudflare

# 2. 添加所有 Cloudflare 相关文件
git add functions/
git add src/core/database-cf.js
git add src/core/crypto-cf.js
git add src/services/notifier-cf.js
git add wrangler.toml
git add schema.sql
git add .dev.vars.example
git add setup-and-test.mjs
git add package.json
git add README.md
git add README-CLOUDFLARE.md
git add QUICKSTART-CLOUDFLARE.md
git add DEPLOYMENT-COMPARISON.md
git add CLOUDFLARE-MIGRATION-SUMMARY.md
git add CHANGELOG-CLOUDFLARE.md
git add PROJECT-STRUCTURE.md
git add LOCAL-DEVELOPMENT-GUIDE.md
git add QUICK-REFERENCE.md
git add STEP-BY-STEP-TUTORIAL.md
git add FRONTEND-BACKEND-INTEGRATION.md
git add TESTING-CHECKLIST.md
git add FINAL-TEST-REPORT.md
git add TEST-RESULTS.md
git add .gitignore.cloudflare
git add docs/cloudflare-deployment.md
git add docs/migration-guide.md
git add docs/frontend-compatibility.md
git add CLOUDFLARE-IMPLEMENTATION-COMPLETE.md

# 3. 提交更改
git commit -m "feat: 添加 Cloudflare Pages 支持

- 添加 Cloudflare Pages Functions 路由
- 实现 D1 数据库适配器
- 实现 Web Crypto API 加密
- 添加 Workers KV 缓存支持
- 完整的文档和教程
- 自动化设置脚本
- 修复 touser 字段类型问题
- 添加自动数据库初始化
- 前端页面完全兼容
- 本地开发环境测试通过"

# 4. 推送到 GitHub
git push -u origin cloudflare
```

## 方法 2: 简化版（添加所有文件）

```bash
# 1. 创建并切换到新分支
git checkout -b cloudflare

# 2. 添加所有更改（排除 .wrangler）
git add .

# 3. 提交
git commit -m "feat: 添加 Cloudflare Pages 完整支持"

# 4. 推送
git push -u origin cloudflare
```

## 方法 3: 如果已经在 main 分支提交了

```bash
# 1. 基于当前 main 创建 cloudflare 分支
git branch cloudflare

# 2. 切换到 cloudflare 分支
git checkout cloudflare

# 3. 推送到 GitHub
git push -u origin cloudflare

# 4. 切换回 main 分支（可选）
git checkout main
```

## 查看分支状态

```bash
# 查看所有分支
git branch -a

# 查看当前分支
git branch

# 查看远程分支
git branch -r
```

## 如果需要更新 .gitignore

在提交前，确保 `.gitignore` 包含：

```
# Cloudflare
.wrangler/
.dev.vars
wrangler.toml.backup
.mf/
```

## 推送后的操作

1. 访问 GitHub 仓库
2. 会看到提示创建 Pull Request
3. 可以选择：
   - 创建 PR 合并到 main
   - 或保持 cloudflare 分支独立

## 如果遇到问题

### 问题 1: 推送被拒绝
```bash
# 强制推送（谨慎使用）
git push -u origin cloudflare --force
```

### 问题 2: 需要设置上游分支
```bash
git push --set-upstream origin cloudflare
```

### 问题 3: 需要先拉取远程更改
```bash
git pull origin cloudflare --rebase
git push -u origin cloudflare
```

## 删除本地临时文件

在提交前，建议清理临时文件：

```bash
# 删除 .wrangler 目录（已在 .gitignore 中）
Remove-Item -Path .wrangler -Recurse -Force -ErrorAction SilentlyContinue

# 查看将要提交的文件
git status
```

## 完整流程示例

```bash
# 1. 确保在正确的目录
cd D:\15268\Desktop\qywx-push

# 2. 查看当前状态
git status

# 3. 创建新分支
git checkout -b cloudflare

# 4. 添加所有更改
git add .

# 5. 提交
git commit -m "feat: 添加 Cloudflare Pages 完整支持

包含功能：
- Cloudflare Pages Functions
- D1 数据库支持
- Workers KV 缓存
- Web Crypto API
- 完整文档
- 自动化脚本
- 测试通过"

# 6. 推送到 GitHub
git push -u origin cloudflare

# 7. 查看结果
git log --oneline -5
```

## 推荐的提交信息格式

```
feat: 添加 Cloudflare Pages 支持

主要更新：
- ✨ 新增 Cloudflare Pages Functions 路由系统
- 💾 实现 D1 数据库适配器（自动初始化）
- 🔐 实现 Web Crypto API 加密
- 🗄️ 添加 Workers KV 缓存支持
- 📚 完整的部署和开发文档
- 🤖 自动化设置和测试脚本
- 🐛 修复 touser 字段类型问题
- ✅ 本地开发环境测试通过

技术栈：
- Cloudflare Pages + Functions
- D1 Database (SQLite)
- Workers KV
- Web Crypto API

文档：
- 快速开始指南
- 部署指南
- 迁移指南
- API 参考
- 测试清单

测试状态：✅ 全部通过
```
