// 数据库迁移脚本 - 添加企业微信消息类型支持字段
// 使用方法: node migrate-db.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'database', 'notifier.db');

console.log('开始数据库迁移...');
console.log(`数据库路径: ${dbPath}`);

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
        process.exit(1);
    }
    console.log('SQLite数据库连接成功');
    
    // 开始迁移
    performMigration(db);
});

function performMigration(db) {
    db.serialize(() => {
        // 添加缺失的企业微信消息类型支持字段
        const migrationSQLs = [
            // 语音消息相关字段
            `ALTER TABLE received_messages ADD COLUMN format TEXT`,
            `ALTER TABLE received_messages ADD COLUMN recognition TEXT`,
            
            // 图片/视频相关字段
            `ALTER TABLE received_messages ADD COLUMN thumb_media_id TEXT`,
            
            // 位置消息相关字段
            `ALTER TABLE received_messages ADD COLUMN location_x REAL`,
            `ALTER TABLE received_messages ADD COLUMN location_y REAL`,
            `ALTER TABLE received_messages ADD COLUMN scale REAL`,
            `ALTER TABLE received_messages ADD COLUMN label TEXT`,
            
            // 链接消息相关字段
            `ALTER TABLE received_messages ADD COLUMN title TEXT`,
            `ALTER TABLE received_messages ADD COLUMN description TEXT`,
            `ALTER TABLE received_messages ADD COLUMN url TEXT`,
            
            // 应用类型字段
            `ALTER TABLE received_messages ADD COLUMN app_type TEXT`
        ];
        
        let migrationCount = 0;
        let errorCount = 0;
        
        migrationSQLs.forEach((sql, index) => {
            db.run(sql, (err) => {
                migrationCount++;
                
                if (err) {
                    console.warn(`添加字段失败 (可能已存在): ${sql}`, err.message);
                    errorCount++;
                } else {
                    console.log(`成功添加字段: ${sql}`);
                }
                
                // 检查是否所有迁移都已完成
                if (migrationCount === migrationSQLs.length) {
                    console.log('\n迁移完成！');
                    console.log(`成功添加: ${migrationCount - errorCount} 个字段`);
                    console.log(`已存在或失败: ${errorCount} 个字段`);
                    
                    // 验证表结构
                    verifyTableStructure(db);
                }
            });
        });
    });
}

function verifyTableStructure(db) {
    console.log('\n验证表结构...');
    
    db.all(`PRAGMA table_info(received_messages)`, (err, columns) => {
        if (err) {
            console.error('获取表结构失败:', err.message);
            closeDatabase();
            return;
        }
        
        console.log('received_messages 表字段列表:');
        columns.forEach(col => {
            console.log(`- ${col.name} (${col.type})`);
        });
        
        // 检查关键字段是否存在
        const requiredColumns = ['format', 'recognition', 'thumb_media_id', 'location_x', 'location_y', 'scale', 'label', 'title', 'description', 'url', 'app_type'];
        const missingColumns = requiredColumns.filter(col => 
            !columns.some(c => c.name === col)
        );
        
        if (missingColumns.length > 0) {
            console.log('\n警告: 以下字段仍然缺失:');
            missingColumns.forEach(col => console.log(`- ${col}`));
        } else {
            console.log('\n✅ 所有必需字段都已添加成功！');
        }
        
        closeDatabase();
    });
}

function closeDatabase() {
    console.log('\n关闭数据库连接...');
    db.close((err) => {
        if (err) {
            console.error('关闭数据库连接失败:', err.message);
        } else {
            console.log('数据库连接已关闭');
        }
        process.exit(0);
    });
}

// 捕获异常
process.on('uncaughtException', (err) => {
    console.error('迁移过程中发生未捕获的异常:', err);
    if (db) {
        db.close();
    }
    process.exit(1);
});