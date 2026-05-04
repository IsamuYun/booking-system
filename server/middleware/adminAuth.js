const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret_change_in_production';

module.exports = function adminAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: '未登录，请先登录管理后台' });
    }
    const token = auth.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.adminUser = payload;
        next();
    } catch (err) {
        const msg = err.name === 'TokenExpiredError'
            ? '登录已过期，请重新登录'
            : '无效的登录凭证，请重新登录';
        return res.status(401).json({ message: msg });
    }
};
