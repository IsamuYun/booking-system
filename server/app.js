require('./config/loadEnv')();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sequelize, User, SystemConfig } = require('./models/init');
const { migrateAdminUsers } = require('./scripts/migrateAdminUsers');
const routes = require('./routes/index');

const DEFAULT_ADMIN_PHONE = process.env.DEFAULT_ADMIN_PHONE || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Password1234';

// 首次启动时创建默认管理员账号和系统配置（幂等操作）
async function initDefaults() {
    // 系统配置：session 有效期（秒）
    await SystemConfig.findOrCreate({
        where: { key: 'session_ttl' },
        defaults: { value: '3600', description: 'Web 管理后台 session 有效期（秒）' },
    });

    // 默认管理员账号（仅当系统内没有任何 admin 用户时创建）
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
        const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
        await User.create({
            phone: DEFAULT_ADMIN_PHONE,
            name: '系统管理员',
            role: 'admin',
            password_hash: hash,
            openid: '',
        });
        console.log(`[Init] 已创建默认管理员账号 ${DEFAULT_ADMIN_PHONE} / ${DEFAULT_ADMIN_PASSWORD}`);
    }
}

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", routes);

// 全局错误处理：确保始终返回 JSON，不返回 HTML 错误页
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]', err.stack || err.message || err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: err.message || '服务器内部错误',
    });
});

// 启动服务器前，同步数据库
// { force: false } 确保不会删除已有数据, 只会创建缺失的表
sequelize.sync({ force: false }).then(async () => {
    console.log('数据库同步完成');
    // 一次性把旧 AdminUsers 表的数据迁移到 Users 表，然后丢弃旧表
    await migrateAdminUsers();
    await initDefaults();
    const PORT = process.env.PORT || 5100;
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
        console.log(`服务器正在运行，地址: ${HOST}, 端口号: ${PORT}`);
    });
}).catch(err => {
    console.error('数据库同步失败:', err);
});
