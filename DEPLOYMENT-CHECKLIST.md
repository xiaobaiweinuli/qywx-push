# Cloudflare Pages 部署验证清单

## 部署前检查

- [x] 数据库迁移已执行
- [x] 代码已推送到 cloudflare 分支
- [x] 静态文件路径已修复

## 自动部署

Cloudflare Pages 会自动检测到 cloudflare 分支的更新并触发部署。

查看部署状态：
1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 选择你的项目
4. 查看 **Deployments** 标签

## 部署后验证

### 1. 基础功能测试

访问你的网站：`https://qywx-push.pages.dev`

- [ ] 首页正常加载
- [ ] 样式显示正常（无 Tailwind CSS 警告）
- [ ] 所有导航链接可用

### 2. 配置功能测试

#### 第一步：生成回调URL

1. [ ] 填写企业微信配置信息：
   - CorpID
   - Callback Token
   - EncodingAESKey (43位)

2. [ ] 点击"生成回调URL"
3. [ ] 验证结果：
   - [ ] 成功生成 Code
   - [ ] 显示回调URL
   - [ ] 无 "Unexpected end of JSON input" 错误

#### 第二步：完善配置

1. [ ] 填写剩余信息：
   - CorpSecret
   - AgentID
   - 选择接收用户

2. [ ] 点击"完成配置"
3. [ ] 验证结果：
   - [ ] 配置保存成功
   - [ ] 显示 API 地址
   - [ ] 显示回调地址

### 3. 消息发送测试

访问：`https://qywx-push.pages.dev/message-sender.html`

- [ ] 页面正常加载
- [ ] JavaScript 文件正常加载（无 MIME type 错误）
- [ ] 可以切换不同消息类型标签

#### 测试各种消息类型

1. [ ] **文本消息**
   - 填写标题和内容
   - 点击发送
   - 验证企业微信收到消息

2. [ ] **文本卡片**
   - 填写标题、描述、链接
   - 点击发送
   - 验证卡片显示正确

3. [ ] **Markdown消息**
   - 输入 Markdown 格式内容
   - 点击发送
   - 验证格式渲染正确

4. [ ] **图文消息**
   - 添加图文项
   - 填写标题、链接、描述
   - 点击发送
   - 验证图文显示正确

5. [ ] **文件消息**
   - 上传文件（图片或文档）
   - 点击发送
   - 验证文件接收成功

### 4. 消息查询测试

访问：`https://qywx-push.pages.dev/message-viewer.html`

- [ ] 页面正常加载
- [ ] 输入配置 Code
- [ ] 可以查看消息列表
- [ ] 筛选功能正常
- [ ] 分页功能正常

### 5. API 文档测试

- [ ] 基础 API 文档可访问：`/api-docs.html`
- [ ] 增强 API 文档可访问：`/enhanced-api-docs.html`
- [ ] 文档内容显示完整

### 6. 回调功能测试（如果启用）

1. [ ] 在企业微信管理后台配置回调URL
2. [ ] 验证回调URL（企业微信会发送验证请求）
3. [ ] 发送测试消息到企业微信
4. [ ] 在消息查询页面查看接收到的消息

## 常见问题排查

### 问题 1：生成回调URL失败

**错误信息：** `Unexpected end of JSON input`

**解决方案：**
```bash
# 执行数据库迁移
wrangler d1 execute wechat-notifier-db --remote --file=./migrations/001_allow_null_fields.sql

# 或使用快速修复脚本
./fix-cloudflare-db.sh  # Mac/Linux
fix-cloudflare-db.bat   # Windows
```

### 问题 2：JavaScript 文件无法加载

**错误信息：** `MIME type ('text/html') is not executable`

**解决方案：**
- 检查 HTML 中的脚本路径
- 确保使用 `/script.js` 而不是 `/public/script.js`
- 已在最新版本中修复

### 问题 3：样式显示异常

**可能原因：**
- CDN 资源加载失败
- Tailwind CSS 配置问题

**解决方案：**
- 检查浏览器控制台错误
- 确认 CDN 链接可访问
- 清除浏览器缓存

### 问题 4：环境变量未生效

**解决方案：**
1. 在 Cloudflare Dashboard 中配置环境变量
2. 必需的环境变量：
   - `ENCRYPTION_KEY` - 数据加密密钥
3. 重新部署项目

### 问题 5：数据库连接失败

**解决方案：**
1. 检查 `wrangler.toml` 中的 `database_id`
2. 确认数据库已创建：
   ```bash
   wrangler d1 list
   ```
3. 如果数据库不存在，创建新数据库：
   ```bash
   wrangler d1 create wechat-notifier-db
   ```

## 性能监控

### 查看实时日志

```bash
wrangler pages deployment tail
```

### 查看部署历史

在 Cloudflare Dashboard 中：
1. 进入项目
2. 点击 **Deployments** 标签
3. 查看每次部署的状态和日志

### 监控指标

关注以下指标：
- 请求数量
- 响应时间
- 错误率
- 数据库查询次数

## 回滚方案

如果部署出现问题，可以快速回滚：

1. 在 Cloudflare Dashboard 中找到上一个成功的部署
2. 点击 **Rollback** 按钮
3. 或者在本地回退代码：
   ```bash
   git revert HEAD
   git push origin cloudflare
   ```

## 成功标准

所有以下项目都应该正常工作：

- ✅ 网站可访问，无 404 错误
- ✅ 所有页面正常加载，无 JavaScript 错误
- ✅ 可以成功创建配置（两步流程）
- ✅ 可以发送各种类型的消息
- ✅ 可以查询接收到的消息
- ✅ API 文档可访问
- ✅ 回调功能正常（如果启用）

## 下一步

部署成功后：

1. **配置自定义域名**（可选）
   - 在 Cloudflare Dashboard 中添加自定义域名
   - 配置 DNS 记录

2. **设置告警**
   - 配置 Cloudflare 告警规则
   - 监控错误率和性能

3. **备份数据**
   - 定期导出 D1 数据库数据
   - 保存配置信息

4. **文档更新**
   - 更新 README 中的部署 URL
   - 记录任何自定义配置

## 相关文档

- [快速修复指南](./QUICK-FIX-CN.md)
- [数据库迁移指南](./CLOUDFLARE-DATABASE-MIGRATION.md)
- [Cloudflare 部署指南](./docs/cloudflare-deployment.md)
- [API 参考文档](./docs/api-reference.md)

---

**最后更新：** 2024-11-20
**部署版本：** cloudflare 分支
**数据库版本：** 001_allow_null_fields
