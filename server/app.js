const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sequelize, AdminUser, SystemConfig } = require('./models/init');
const routes = require('./routes/index');

// 首次启动时创建默认管理员账号和系统配置（幂等操作）
async function initDefaults() {
    // 系统配置：session 有效期（秒）
    await SystemConfig.findOrCreate({
        where: { key: 'session_ttl' },
        defaults: { value: '3600', description: 'Web 管理后台 session 有效期（秒）' },
    });

    // 默认管理员账号
    const exists = await AdminUser.findOne({ where: { username: 'admin' } });
    if (!exists) {
        const hash = await bcrypt.hash('Password1234', 10);
        await AdminUser.create({
            username: 'admin',
            password_hash: hash,
            display_name: '系统管理员',
        });
        console.log('[Init] 已创建默认管理员账号 admin / Password1234');
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
    await initDefaults();
    const PORT = process.env.PORT || 5100;
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
        console.log(`服务器正在运行，地址: ${HOST}, 端口号: ${PORT}`);
    });
}).catch(err => {
    console.error('数据库同步失败:', err);
});

