const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AdminUser, SystemConfig } = require('../models/init');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret_change_in_production';

// POST /admin/auth/login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }

        const user = await AdminUser.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 从数据库读取 session 有效期
        const config = await SystemConfig.findOne({ where: { key: 'session_ttl' } });
        const ttl = config ? parseInt(config.value, 10) : 3600;

        const payload = {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: ttl });

        console.log(`[Auth] 管理员 ${username} 登录成功，session TTL=${ttl}s`);
        res.json({
            token,
            user: payload,
            expires_in: ttl,
        });
    } catch (err) {
        console.error('[Auth] 登录失败:', err);
        res.status(500).json({ message: '服务器错误' });
    }
};

// GET /admin/auth/me  （需要 adminAuth middleware）
exports.me = (req, res) => {
    res.json({ user: req.adminUser });
};
