# 精简版Dockerfile - 适用于所有平台
FROM node:18-alpine

WORKDIR /app

# 安装系统依赖 (包含 sqlite3 编译所需的依赖)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev \
    pkgconfig

# 安装Node.js依赖
COPY package*.json ./
RUN npm install --production

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/database && chmod 755 /app/database

EXPOSE 12121
CMD ["npm"， "start"]
