// 测试数据库修复
const dbModule = require('./src/core/database');
const Database = dbModule.Database || dbModule;
const { v4: uuidv4 } = require('uuid');

async function testMessageSave() {
    console.log('开始测试消息保存...');
    
    try {
        const db = new Database('./database/notifier.db');
        
        // 初始化数据库连接
        console.log('初始化数据库连接...');
        await db.init();
        
        // 构造测试消息对象
        const testMessage = {
            message_id: `test_msg_${Date.now()}`,
            config_code: 'ae519120-3723-4af4-bd61-e881bb7560aa',
            from_user: 'test_user',
            from_user_name: '测试用户',
            to_user: 'test_to',
            agent_id: 1000002,
            msg_type: 'text',
            content: '测试修复后的消息保存功能',
            createTime: Math.floor(Date.now() / 1000),
            quoteMsg: {
                msgId: 'quoted_msg_123',
                content: '这是一条被引用的消息',
                fromUser: 'quoted_user',
                fromUserName: '被引用用户',
                msgType: 'text'
            }
        };
        
        console.log('准备保存测试消息:', testMessage.message_id);
        await db.saveReceivedMessage(testMessage);
        console.log('✅ 测试成功：消息保存成功！');
        
        // 验证是否保存成功
        const count = await new Promise((resolve, reject) => {
            db.db.get('SELECT COUNT(*) as count FROM received_messages WHERE message_id = ?', 
                [testMessage.message_id], 
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                }
            );
        });
        
        if (count === 1) {
            console.log('✅ 验证成功：消息确实保存在数据库中！');
        } else {
            console.log('❌ 验证失败：数据库中未找到保存的消息');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error(error);
    }
}

// 运行测试
testMessageSave().then(() => {
    console.log('测试完成');
    process.exit(0);
}).catch(err => {
    console.error('测试过程中发生错误:', err);
    process.exit(1);
});