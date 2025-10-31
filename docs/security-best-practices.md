# 企业微信通知服务 - 安全最佳实践

本文档详细介绍了企业微信通知服务的安全配置和最佳实践，帮助您保护系统和数据安全。

## 系统安全配置

### 凭证管理

- **敏感信息保护**：
  - 不要将 corpid、secret 等敏感信息硬编码在代码中
  - 使用环境变量或加密配置文件存储敏感信息
  - 定期轮换应用密钥和加密密钥（建议每3-6个月）
  - 实施最小权限原则，为企业微信应用分配必要的最小权限

- **密钥生成**：
  ```bash
  # 使用OpenSSL生成安全的32字符加密密钥
  openssl rand -hex 16
  ```

### 网络安全

- **传输安全**：
  - 生产环境必须配置HTTPS，防止数据传输被窃听
  - 使用有效的SSL/TLS证书，避免使用自签名证书
  - 禁用不安全的加密套件和协议版本

- **访问控制**：
  - 实施IP白名单，限制只有企业微信服务器可访问回调接口
  - 使用WAF(Web应用防火墙)防护常见Web攻击
  - 配置适当的防火墙规则，只开放必要的端口
  - 禁用开发环境调试选项，如debug模式

- **Nginx反向代理配置**：
  ```nginx
  server {
      listen 443 ssl;
      server_name your-domain.com;
      
      ssl_certificate /path/to/cert.pem;
      ssl_certificate_key /path/to/key.pem;
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_prefer_server_ciphers on;
      ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
      
      location / {
          proxy_pass http://localhost:12121;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
      
      # 限制访问管理界面
      location /admin {
          allow 192.168.1.0/24;  # 允许特定IP段访问
          deny all;  # 拒绝其他所有访问
          
          proxy_pass http://localhost:12121/admin;
          proxy_set_header Host $host;
      }
  }
  ```

### 认证授权

- **管理接口保护**：
  - 对管理接口实施访问控制和身份验证
  - 考虑实施API密钥认证或OAuth2.0授权
  - 定期审查授权日志，检测可疑访问
  - 为管理界面配置基本认证或其他安全机制

- **会话安全**：
  - 设置适当的会话超时时间
  - 使用安全的Cookie配置（HttpOnly, Secure, SameSite）
  - 定期轮换会话密钥

## 数据安全措施

### 数据加密

- **存储加密**：
  - 使用强加密算法保护敏感数据（如用户信息、消息内容）
  - 确保数据库文件访问权限正确设置（建议600或640权限）
  - 敏感配置项使用AES加密存储

- **传输加密**：
  - 传输中的数据通过HTTPS加密
  - 确保与企业微信API的通信使用TLS 1.2或更高版本
  - 避免在日志中记录敏感信息

### 数据备份与恢复

- **备份策略**：
  - 制定定期备份策略，建议每日自动备份数据库
  - 备份文件应存储在与主服务器不同的位置
  - 定期测试备份恢复流程，确保备份有效
  - 保留多个历史版本的备份，以防数据损坏长期未被发现

- **自动备份脚本示例**：
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

### 日志安全

- **日志管理**：
  - 避免在日志中记录敏感信息（如密码、token）
  - 实施日志轮换和归档策略，防止磁盘空间耗尽
  - 考虑集中式日志管理，提高安全性和可审计性
  - 定期审查日志，识别可疑活动

- **日志配置**：
  ```javascript
  // 示例日志配置（生产环境）
  const logger = {
    level: 'info',
    format: 'json',
    maxSize: '10m',
    maxFiles: '5d',
    // 敏感信息脱敏配置
    redact: {
      paths: ['req.headers.authorization', 'req.body.corpId', 'req.body.secret'],
      censor: '[REDACTED]'
    }
  };
  ```

## 持续安全维护

### 依赖管理

- **漏洞扫描**：
  - 定期执行 `npm audit` 检查并修复依赖漏洞
  - 设置依赖自动更新或定期审查机制
  - 移除未使用的依赖，减少攻击面
  - 使用固定版本号而非范围版本号，避免自动引入有漏洞的新版本

- **安全更新**：
  ```bash
  # 检查依赖漏洞
  npm audit
  
  # 自动修复漏洞
  npm audit fix
  
  # 更新到最新安全版本
  npm update
  ```

### 监控与响应

- **安全监控**：
  - 实施异常行为监控，及时发现可疑活动
  - 配置关键事件告警机制
  - 制定安全事件响应计划
  - 定期进行安全审计和渗透测试

- **入侵检测**：
  - 监控异常的API调用模式
  - 检测暴力破解尝试
  - 监控异常的文件系统活动
  - 设置资源使用阈值告警

### 合规性

- **数据处理**：
  - 确保数据处理符合相关法规要求
  - 尊重用户隐私，仅收集必要数据
  - 明确数据保留期限，及时清理过期数据
  - 建立数据泄露响应流程

- **审计跟踪**：
  - 记录所有关键操作的审计日志
  - 包括谁、何时、做了什么操作
  - 日志应包含足够的上下文信息
  - 确保日志完整性和不可篡改性

## 容器安全

### Docker安全最佳实践

- **镜像安全**：
  - 使用官方或经过验证的基础镜像
  - 定期更新基础镜像以修复已知漏洞
  - 最小化镜像大小，移除不必要的组件
  - 使用多阶段构建减少攻击面

- **容器配置**：
  - 以非root用户运行容器
  - 限制容器资源使用
  - 使用只读文件系统（除必要的挂载点外）
  - 禁用不必要的Linux能力

- **示例Dockerfile安全配置**：
  ```dockerfile
  FROM node:18-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  
  FROM node:18-alpine
  WORKDIR /app
  COPY --from=builder /app/node_modules ./node_modules
  COPY . .
  
  # 创建非root用户
  RUN addgroup -g 1001 -S appuser && \
      adduser -S appuser -u 1001
  USER appuser
  
  # 配置资源限制
  LIMIT_NOFILE=65535
  
  EXPOSE 12121
  CMD ["npm", "start"]
  ```

## 安全检查清单

### 部署前检查

- [ ] 已生成强随机的ENCRYPTION_KEY（32字符）
- [ ] 生产环境已配置HTTPS
- [ ] 企业微信应用已配置IP白名单
- [ ] 数据库文件访问权限已设置为600或640
- [ ] 已禁用开发环境调试选项
- [ ] 已配置适当的日志级别和轮换策略
- [ ] 已设置定期备份机制

### 定期检查

- [ ] 每月执行一次依赖漏洞扫描
- [ ] 每季度轮换一次加密密钥和应用密钥
- [ ] 每半年进行一次安全审计
- [ ] 定期审查访问日志，检测异常活动
- [ ] 定期检查备份的完整性和可恢复性

## 事件响应

### 安全事件处理流程

1. **检测与报告**：识别潜在的安全事件并报告
2. **评估与分类**：评估事件的严重性和影响范围
3. **遏制与消除**：采取措施遏制事件并消除威胁
4. **恢复与加固**：恢复系统正常运行并加固安全措施
5. **总结与改进**：总结经验教训并改进安全策略

### 常见安全事件处理

- **凭证泄露**：立即轮换所有相关凭证，检查是否有未授权访问
- **数据泄露**：评估泄露范围，通知相关方，加固防护措施
- **服务中断**：恢复服务，分析原因，防止再次发生
- **恶意攻击**：隔离受影响系统，清除恶意代码，加强监控

[返回主文档](./../README.md)