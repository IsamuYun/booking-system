// server/config/seed.js
// 种子数据脚本，用于初始化数据库中的默认数据

const { sequelize, Counselor, Room, User } = require('../models/init');

async function seed() {
    try {
        console.log('🔄 正在初始化数据库...');
        await sequelize.sync({ force: true }); // 重置数据库

        // 创建默认用户
        const users = await User.bulkCreate([
            { openid: '', name: 'Isamu', role: 'admin', phone: '13764318517' },
            { openid: '', name: '张燏', role: 'admin', phone: '18049931007' },
            { openid: '', name: '助理-Sindy', role: 'user', phone: '17717521038' },
            { openid: '', name: '访客-Fish', role: 'guest', phone: '13501640597' },
        ]);

        // 创建房间
        const rooms = await Room.bulkCreate([
            { name: '咨询室1', type: '咨询室', isAvailable: true },
            { name: '咨询室2', type: '咨询室', isAvailable: true },
            { name: '咨询室3', type: '咨询室', isAvailable: true },
            { name: '多功能室1', type: '多功能室', isAvailable: true },
            { name: '多功能室2', type: '咨询室', isAvailable: true }
        ]);
        console.log(`✅ 已创建 ${rooms.length} 个房间`);

        // 创建咨询师档案
        const counselors = await Counselor.bulkCreate([
            { name: '潘若思', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '印梅', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '张劼', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '闫萍', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '仝静', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '赵嫕', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '大文', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '周立红', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '丽华', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '陈蕾', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '杨静', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '宫海蓉', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '冯吉星', type: '内部', booking_price: 50.0, booking_multi_price: 50.0, status: 1 },
            { name: '周秀宇', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '符瑶', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '郭欣悦', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '徐明燕', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '杨飞', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },
            { name: '曹晓春', type: '内部', booking_price: 70.0, booking_multi_price: 120.0, status: 1 },

            { name: '悦悦', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '周家琦', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '高小昕', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '闫萍', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '雪雪', type: '合作-漫漫', booking_price: 80.0, booking_multi_price: 120.0, status: 1 },
            { name: '金超轶', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '马梦捷', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '王芳培', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '朱晓雨', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '瑛姿', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '许丽芳', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '梅兰', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '叶闻', type: '合作-漫漫', booking_price: 80.0, booking_multi_price: 120.0, status: 1 },
            { name: '方跃璇', type: '合作-漫漫', booking_price: 80.0, booking_multi_price: 120.0, status: 1 },
            { name: '墨提斯', type: '合作-墨提斯', booking_price: 80.0, booking_multi_price: 120.0, status: 1 },
            { name: '傅贤婧', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '许媜', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '李菁', type: '外部', booking_price: 90.0, booking_multi_price: 120.0, status: 1 },
            { name: '笑凡', type: '外部', booking_price: 0.0, booking_multi_price: 0.0, status: 1 },

            { name: '冯吉星', type: '外部', booking_price: 50.0, booking_multi_price: 50.0, status: 1 },
        ]);
        console.log(`✅ 已创建 ${counselors.length} 个咨询师档案`);
    }
    catch (error) {
        console.error('❌ 数据初始化失败:', error);
    }
    finally {
        await sequelize.close();
        console.log('🔒 数据库连接已关闭');
    }
}

// 执行
seed();