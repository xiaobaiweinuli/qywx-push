# 从传统版本迁移到 Cloudflare Pages

本指南帮助你将现有的 Node.js + SQLite 版本迁移到 Cloudflare Pages + D1 版本。

## 📋 迁移概览

### 主要变化

1. **运行环境**: Node.js Express → Cloudflare Workers/Pages Functions
2. **数据库**: SQLite → Cloudflare D1
3. **缓存**: 内存/文件 → Workers KV
4. **部署**: 传统服务器/Docker → 边缘计算网络

### 兼容性

- ✅ 所有核心功能保持兼容
- ✅ API 端点保持一致
- ✅ 数据库结构基本相同
- ⚠️ 文件上传需要调整（使用 R2 或外部存储）

## 🔄 迁移步骤

### 1. 导出现有数据

#### 导出配置数据

```bash
sqlite3 data/wechat-notifier.db "SELECT * FROM configurations;" > configurations.csv
```

#### 导出消息数据

```bash
sqlite3 data/wechat-notifier.db "SELECT * FROM received_messages;" > messages.csv
```

#### 或导出完整数据库

```bash
sqlite3 data/wechat-notifier.db .dump > backup.sql
```

### 2. 准备 Cloudflare 环境

按照 [cloudflare-deployment.md](./cloudflare-deployment.md) 完成：

1. 创建 D1 数据库
2. 初始化表结构
3. 创建 KV 命名空间
4. 配置环境变量

### 3. 数据迁移

#### 方式一：使用 SQL 脚本

如果你导出了完整的 SQL 脚本：

```bash
# 清理不兼容的 SQL 语句
sed -i 's/PRAGMA.*//g' backup.sql
sed -i 's/BEGIN TRANSACTION;//g' backup.sql
sed -i 's/COMMIT;//g' backup.sql

# 导入到 D1
wrangler d1 execute wechat-notifier-db --file=backup.sql
```

#### 方式二：使用 CSV 导入

创建导入脚本 `import-data.js`:

```javascript
import { readFileSync } from 'fs';

const configurations = readFileSync('configurations.csv', 'utf-8')
    .split('\n')
    .slice(1) // 跳过标题行
    .filter(line => line.trim())
    .map(line => {
        const [id, code, corpid, encrypted_corpsecret, agentid, touser, description, ...rest] = line.split(',');
        return { code, corpid, encrypted_corpsecret, agentid, touser, description };
    });

// 生成 INSERT 语句
configurations.forEach(config => {
    console.log(`INSERT INTO configurations (code, corpid, encrypted_corpsecret, agentid, touser, description) VALUES ('${config.code}', '${config.corpid}', '${config.encrypted_corpsecret}', ${config.agentid}, '${config.touser}', '${config.description}');`);
});
```

运行并导入：

```bash
node import-data.js > import.sql
wrangler d1 execute wechat-notifier-db --file=import.sql
```

### 4. 验证数据

```bash
# 检查配置数量
wrangler d1 execute wechat-notifier-db --command "SELECT COUNT(*) FROM configurations"

# 检查消息数量
wrangler d1 execute wechat-notifier-db --command "SELECT COUNT(*) FROM received_messages"

# 查看示例数据
wrangler d1 execute wechat-notifier-db --command "SELECT * FROM configurations LIMIT 5"
```

### 5. 更新客户端配置

如果你有客户端或其他服务调用此 API，更新 API 基础 URL：

```
旧: http://your-server:12121/api/...
新: https://your-project.pages.dev/api/...
```

### 6. 测试功能

1. **测试配置管理**
   ```bash
   curl https://your-project.pages.dev/api/configuration/your-code
   ```

2. **测试消息发送**
   ```bash
   curl -X POST https://your-project.pages.dev/api/notify/your-code \
     -H "Content-Type: application/json" \
     -d '{"title":"测试","content":"迁移测试消息"}'
   ```

3. **测试消息查询**
   ```bash
   curl https://your-project.pages.dev/api/messages/your-code?page=1&limit=10
   ```

### 7. 切换流量

#### 渐进式迁移（推荐）

1. 保持旧服务运行
2. 部署新服务到 Cloudflare
3. 使用少量流量测试新服务
4. 逐步增加新服务流量
5. 确认稳定后完全切换
6. 保留旧服务一段时间作为备份

#### 直接切换

1. 更新 DNS 记录指向 Cloudflare Pages
2. 或更新客户端配置
3. 监控错误和性能

## ⚠️ 注意事项

### 功能差异

1. **文件上传**
   - 传统版本：直接存储到服务器文件系统
   - Cloudflare 版本：需要使用 R2 或外部存储服务
   - 建议：使用企业微信的媒体文件 API

2. **执行时间限制**
   - Workers 有 CPU 时间限制（免费版 10ms）
   - 优化长时间运行的操作
   - 使用异步处理和队列

3. **环境变量**
   - 传统版本：`.env` 文件
   - Cloudflare 版本：Dashboard 配置或 `.dev.vars`（仅本地）

### 数据一致性

- 迁移期间可能有数据不一致
- 建议在低峰期进行迁移
- 做好数据备份

### 回滚计划

准备回滚方案：

1. 保留旧服务器配置
2. 保留数据库备份
3. 记录 DNS 更改
4. 准备快速切换脚本

## 🔍 迁移后检查清单

- [ ] 所有配置已迁移
- [ ] 历史消息已迁移
- [ ] API 端点正常工作
- [ ] 消息发送功能正常
- [ ] 消息查询功能正常
- [ ] 回调功能正常（如果使用）
- [ ] 性能满足要求
- [ ] 监控和日志配置完成
- [ ] 备份策略已建立
- [ ] 文档已更新

## 📊 性能对比

### 传统版本
- 响应时间：50-200ms（取决于服务器位置）
- 并发能力：受服务器配置限制
- 可用性：单点故障风险
- 成本：固定服务器成本

### Cloudflare 版本
- 响应时间：10-50ms（全球边缘节点）
- 并发能力：自动扩展，几乎无限
- 可用性：99.99%+ SLA
- 成本：按使用量计费，免费额度充足

## 🆘 遇到问题？

### 常见问题

1. **数据导入失败**
   - 检查 SQL 语法兼容性
   - 分批导入大量数据
   - 检查字符编码

2. **API 响应不一致**
   - 检查环境变量配置
   - 验证数据库绑定
   - 查看 Workers 日志

3. **性能问题**
   - 优化数据库查询
   - 使用 KV 缓存
   - 减少外部 API 调用

### 获取帮助

- 查看 [Cloudflare Community](https://community.cloudflare.com/)
- 提交 GitHub Issue
- 查看项目文档

## 📚 相关文档

- [Cloudflare 部署指南](./cloudflare-deployment.md)
- [API 参考文档](./api-reference.md)
- [安全最佳实践](./security-best-practices.md)

---

**企业微信通知服务 v3.0** | 从传统架构到边缘计算的平滑迁移
