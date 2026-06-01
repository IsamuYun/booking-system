const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, SystemConfig } = require('../models/init');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret_change_in_production';

// POST /admin/auth/login —— 手机号 + 密码，仅 role='admin' 的 User 可登录
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ message: '手机号和密码不能为空' });
        }

        const user = await User.findOne({ where: { phone } });
        if (!user || user.role !== 'admin' || !user.password_hash) {
            return res.status(401).json({ message: '手机号或密码错误' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ message: '手机号或密码错误' });
        }

        const config = await SystemConfig.findOne({ where: { key: 'session_ttl' } });
        const ttl = config ? parseInt(config.value, 10) : 3600;

        const payload = {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: ttl });

        console.log(`[Auth] 管理员 ${phone} 登录成功，session TTL=${ttl}s`);
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
