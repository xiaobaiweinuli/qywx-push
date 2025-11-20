#!/usr/bin/env node

/**
 * 自动化设置和测试 Cloudflare 本地环境
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function info(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function step(message) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`${message}`, 'bright');
    log(`${'='.repeat(60)}`, 'cyan');
}

function exec(command, options = {}) {
    try {
        const result = execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
        return result;
    } catch (err) {
        if (!options.ignoreError) {
            throw err;
        }
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 检查 Wrangler 是否已安装
function checkWrangler() {
    step('检查 Wrangler CLI');
    try {
        const version = exec('wrangler --version', { silent: true });
        success(`Wrangler 已安装: ${version.trim()}`);
        return true;
    } catch (err) {
        error('Wrangler 未安装');
        info('请运行: npm install -g wrangler');
        return false;
    }
}

// 检查登录状态
function checkLogin() {
    step('检查登录状态');
    try {
        const whoami = exec('wrangler whoami', { silent: true });
        success('已登录 Cloudflare');
        info(whoami.trim());
        return true;
    } catch (err) {
        error('未登录 Cloudflare');
        info('请运行: wrangler login');
        return false;
    }
}

// 创建 D1 数据库
function createD1Database() {
    step('创建 D1 数据库');
    
    try {
        // 检查数据库是否已存在
        const dbList = exec('wrangler d1 list', { silent: true });
        if (dbList && dbList.includes('wechat-notifier-db')) {
            warning('数据库 wechat-notifier-db 已存在');
            
            // 提取 database_id
            const lines = dbList.split('\n');
            for (const line of lines) {
                if (line.includes('wechat-notifier-db')) {
                    const match = line.match(/([a-f0-9-]{36})/);
                    if (match) {
                        const dbId = match[1];
                        info(`使用现有数据库 ID: ${dbId}`);
                        return dbId;
                    }
                }
            }
        }
        
        // 创建新数据库
        info('创建新数据库...');
        const output = exec('wrangler d1 create wechat-notifier-db', { silent: true });
        
        // 提取 database_id
        const match = output.match(/database_id\s*=\s*"([^"]+)"/);
        if (match) {
            const dbId = match[1];
            success(`数据库创建成功: ${dbId}`);
            return dbId;
        } else {
            throw new Error('无法提取 database_id');
        }
    } catch (err) {
        error(`创建数据库失败: ${err.message}`);
        throw err;
    }
}

// 初始化数据库表结构
function initDatabase() {
    step('初始化数据库表结构');
    
    try {
        info('执行 schema.sql...');
        exec('wrangler d1 execute wechat-notifier-db --file=./schema.sql');
        success('数据库表结构初始化成功');
        
        // 验证表已创建
        info('验证表结构...');
        const tables = exec('wrangler d1 execute wechat-notifier-db --command "SELECT name FROM sqlite_master WHERE type=\'table\'"', { silent: true });
        
        if (tables && (tables.includes('configurations') && tables.includes('received_messages'))) {
            success('表结构验证成功');
            info('已创建表: configurations, received_messages');
        } else {
            warning('表结构验证失败，但继续执行');
        }
    } catch (err) {
        error(`初始化数据库失败: ${err.message}`);
        throw err;
    }
}

// 创建 KV 命名空间
function createKVNamespace() {
    step('创建 KV 命名空间');
    
    try {
        // 检查 KV 是否已存在
        const kvList = exec('wrangler kv namespace list', { silent: true, ignoreError: true });
        if (kvList && kvList.includes('CACHE')) {
            warning('KV 命名空间 CACHE 已存在');
            
            // 提取 KV ID
            const match = kvList.match(/"id":\s*"([^"]+)"/);
            if (match) {
                const kvId = match[1];
                info(`使用现有 KV ID: ${kvId}`);
                return kvId;
            }
        }
        
        // 创建新 KV
        info('创建新 KV 命名空间...');
        const output = exec('wrangler kv namespace create CACHE', { silent: true });
        
        // 提取 KV ID
        const match = output.match(/id\s*=\s*"([^"]+)"/);
        if (match) {
            const kvId = match[1];
            success(`KV 命名空间创建成功: ${kvId}`);
            return kvId;
        } else {
            throw new Error('无法提取 KV ID');
        }
    } catch (err) {
        error(`创建 KV 命名空间失败: ${err.message}`);
        throw err;
    }
}

// 更新 wrangler.toml
function updateWranglerToml(dbId, kvId) {
    step('更新 wrangler.toml 配置');
    
    try {
        const tomlPath = path.join(__dirname, 'wrangler.toml');
        let content = fs.readFileSync(tomlPath, 'utf8');
        
        // 更新 database_id
        content = content.replace(
            /database_id\s*=\s*"[^"]*"/,
            `database_id = "${dbId}"`
        );
        
        // 更新 KV id
        content = content.replace(
            /id\s*=\s*"[^"]*"/,
            `id = "${kvId}"`
        );
        
        fs.writeFileSync(tomlPath, content, 'utf8');
        success('wrangler.toml 更新成功');
        info(`Database ID: ${dbId}`);
        info(`KV ID: ${kvId}`);
    } catch (err) {
        error(`更新 wrangler.toml 失败: ${err.message}`);
        throw err;
    }
}

// 生成加密密钥
function generateEncryptionKey() {
    step('生成加密密钥');
    
    const key = crypto.randomBytes(32).toString('hex');
    success('加密密钥生成成功');
    info(`密钥: ${key.substring(0, 16)}...`);
    return key;
}

// 创建 .dev.vars 文件
function createDevVars(encryptionKey) {
    step('创建 .dev.vars 文件');
    
    try {
        const devVarsPath = path.join(__dirname, '.dev.vars');
        
        if (fs.existsSync(devVarsPath)) {
            warning('.dev.vars 文件已存在');
            const content = fs.readFileSync(devVarsPath, 'utf8');
            if (content.includes('ENCRYPTION_KEY=') && !content.includes('your-')) {
                info('使用现有的加密密钥');
                return;
            }
        }
        
        const content = `ENCRYPTION_KEY=${encryptionKey}\n`;
        fs.writeFileSync(devVarsPath, content, 'utf8');
        success('.dev.vars 文件创建成功');
    } catch (err) {
        error(`创建 .dev.vars 失败: ${err.message}`);
        throw err;
    }
}

// 测试数据库连接
function testDatabase() {
    step('测试数据库连接');
    
    try {
        info('查询数据库...');
        const result = exec('wrangler d1 execute wechat-notifier-db --command "SELECT COUNT(*) as count FROM configurations"', { silent: true });
        
        if (result) {
            success('数据库连接测试成功');
            info('可以正常查询数据');
        }
    } catch (err) {
        error(`数据库连接测试失败: ${err.message}`);
        throw err;
    }
}

// 主函数
async function main() {
    log('\n' + '='.repeat(60), 'bright');
    log('🚀 Cloudflare Pages 自动化设置和测试', 'bright');
    log('='.repeat(60) + '\n', 'bright');
    
    try {
        // 1. 检查 Wrangler
        if (!checkWrangler()) {
            process.exit(1);
        }
        
        // 2. 检查登录状态
        if (!checkLogin()) {
            process.exit(1);
        }
        
        // 3. 创建 D1 数据库
        const dbId = createD1Database();
        
        // 4. 初始化数据库
        initDatabase();
        
        // 5. 创建 KV 命名空间
        const kvId = createKVNamespace();
        
        // 6. 更新 wrangler.toml
        updateWranglerToml(dbId, kvId);
        
        // 7. 生成加密密钥
        const encryptionKey = generateEncryptionKey();
        
        // 8. 创建 .dev.vars
        createDevVars(encryptionKey);
        
        // 9. 测试数据库连接
        testDatabase();
        
        // 10. 显示总结
        step('设置完成');
        success('所有配置已完成！');
        info('配置摘要:');
        info(`  - Database ID: ${dbId}`);
        info(`  - KV ID: ${kvId}`);
        info(`  - 加密密钥: 已生成并保存到 .dev.vars`);
        info(`  - 数据库表: configurations, received_messages`);
        
        log('\n' + '='.repeat(60), 'cyan');
        success('环境设置成功！');
        log('='.repeat(60), 'cyan');
        info('下一步:');
        info('  1. 运行 npm run dev 启动开发服务器');
        info('  2. 访问 http://localhost:8788/');
        info('  3. 开始开发和测试');
        log('='.repeat(60) + '\n', 'cyan');
        
    } catch (err) {
        error(`\n设置失败: ${err.message}`);
        error('请查看上面的错误信息并手动修复');
        process.exit(1);
    }
}

// 运行
main().catch(err => {
    error(`未捕获的错误: ${err.message}`);
    process.exit(1);
});
