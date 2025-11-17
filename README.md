# 企业微信通知服务 | QYWX Push

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x%2B-green.svg">
  <img src="https://img.shields.io/badge/Docker-Supported-blue.svg">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg">
  <img src="https://img.shields.io/badge/WeChat-Enterprise-red.svg">
</p>

## 📖 项目概述

企业微信通知服务是一个功能强大、易于集成的企业微信消息推送解决方案，旨在帮助企业快速实现自动化消息通知功能。本服务提供了丰富的消息类型支持、灵活的配置管理、安全的API接口，以及直观的Web管理界面，使企业能够轻松构建属于自己的企业级消息通知系统。

## ✨ 核心特性

### 消息类型支持

- 📝 **文本消息** - 支持基本文本格式和换行
- 📊 **文本卡片消息** - 支持富文本展示，包含标题、描述和按钮
- 🖼️ **图片消息** - 支持发送图片文件
- 📋 **图文消息** - 支持多图文展示，适合推送文章、公告等
- 📎 **文件消息** - 支持发送各种文档文件
- 🔊 **语音消息** - 支持发送语音文件
- 🎬 **视频消息** - 支持发送视频文件
- 📌 **Markdown消息** - 支持Markdown格式内容展示

### 实用功能亮点

- 🔧 **灵活配置** - 支持多应用配置管理，每个应用独立配置企业微信参数
- 🔐 **安全加密** - 敏感信息加密存储，支持HTTPS传输
- 📊 **消息统计** - 提供消息发送和接收统计功能
- 💾 **消息存储** - 接收消息自动存储，支持历史消息查询
- 🎛️ **Web管理界面** - 提供直观的Web界面进行配置管理和消息发送测试
- 🔄 **回调支持** - 支持企业微信回调，接收用户发送的消息
- 📁 **文件上传** - 支持图片、文件、语音、视频等多种文件类型上传
- 🐳 **Docker支持** - 提供Docker镜像，支持容器化部署
- 🌐 **多平台兼容** - 支持Linux、Windows、macOS等多种操作系统

## 📚 详细文档

为了提供更清晰、更易于维护的文档，我们将详细内容拆分为多个专项文档：

### 部署与安装

- [📥 部署指南](./docs/deployment-guide.md) - 详细的安装和部署步骤，包括Docker部署和本地部署方法
- [⚙️ 环境变量配置](./docs/environment-variables.md) - 完整的环境变量说明和配置方法

### 使用指南

- [📋 使用指南](./docs/usage-guide.md) - 详细的使用方法、配置步骤和典型应用场景
- [📚 API参考文档](./docs/api-reference.md) - 完整的API接口说明和调用示例

### 技术文档

- [📁 项目结构](./docs/project-structure.md) - 详细的项目架构设计和目录结构说明
- [🔍 消息系统实现](./docs/message-system-implementation.md) - 消息存储和查询系统的实现细节

### 安全与维护

- [🛡️ 安全最佳实践](./docs/security-best-practices.md) - 安全配置和最佳实践建议

## 🔍 相关资源

### 官方文档

- [企业微信开发者文档](https://developer.work.weixin.qq.com/)
- [Node.js官方文档](https://nodejs.org/zh-cn/docs/)
- [Express.js文档](https://expressjs.com/zh-cn/)
- [SQLite官方文档](https://www.sqlite.org/docs.html)
- [Docker官方文档](https://docs.docker.com/)

## 📈 性能特点

- ⚡ **高性能** - Node.js异步处理，支持高并发请求
- 💾 **低内存** - 基于SQLite轻量级数据库，内存占用小
- 🚀 **快速响应** - 平均响应时间 < 100ms
- 📦 **小体积** - Docker镜像 < 200MB，部署快速
- 🔄 **高可用** - 支持健康检查，自动重启机制
- 📊 **可监控** - 内置日志记录，便于问题排查

## 🌐 兼容性

### 支持的Node.js版本
- ✅ Node.js 18.x (推荐)
- ✅ Node.js 19.x
- ✅ Node.js 20.x (LTS)

### 支持的操作系统
- ✅ Ubuntu 18.04+
- ✅ CentOS 7+
- ✅ Windows 10+
- ✅ macOS 10.15+
- ✅ Alpine Linux (Docker)

### 支持的部署平台
- ✅ Docker / Docker Compose
- ✅ ClawCloud
- ✅ AWS EC2
- ✅ 阿里云ECS
- ✅ 腾讯云CVM
- ✅ 本地服务器

## 📄 开源协议 | License

本项目采用 **MIT License** - 查看 [LICENSE](LICENSE) 文件了解详细条款。

MIT许可证允许您自由地使用、修改和分发本软件，无论是商业用途还是非商业用途，只需保留原始许可证声明。

## 行为准则

[本项目遵循如下的行为规范](./docs/CODE_OF_CONDUCT.md) 

## 🙏 致谢 | Acknowledgments

感谢所有为本项目做出贡献的开发者和用户！

- **企业微信团队**: 提供强大的API和平台支持
- **开源社区**: 提供各种优秀的依赖包和技术支持
- **原作者**: [wangwangit](https://github.com/wangwangit) 创建的基础版本
- **贡献者**: 所有参与代码贡献、问题报告和功能建议的社区成员

---

**企业微信通知服务 v2.0** | 企业级架构 · 多平台支持 · 安全可靠 · 易于扩展

如果本项目对您有帮助，请给我们一个⭐Star，这是对我们最大的鼓励和支持！
