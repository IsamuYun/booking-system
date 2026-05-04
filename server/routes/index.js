// server/routes/index.js
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const roomController = require('../controllers/roomController');
const counselorController = require('../controllers/counselorController');
const bookingController = require('../controllers/bookingController');
const adminController = require('../controllers/adminController');
const recurringController = require('../controllers/recurringController');
const authController = require('../controllers/authController');
const reportController = require('../controllers/reportController');
const importController = require('../controllers/importController');
const adminAuthController = require('../controllers/adminAuthController');
const adminAuth = require('../middleware/adminAuth');

const xlsUpload = multer({
    dest: path.join(__dirname, '../data/xls/'),
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.xlsx')) {
            cb(null, true);
        } else {
            cb(new Error('仅支持 .xlsx 格式的文件'));
        }
    },
});

// ── 管理后台鉴权路由（公开） ─────────────────────────────────────
router.post('/admin/auth/login', adminAuthController.login);
router.get('/admin/auth/me', adminAuth, adminAuthController.me);

// ── 小程序兼容路由（不加 auth，避免破坏小程序） ─────────────────
router.get('/rooms', roomController.getRooms);
router.get('/counselors', counselorController.getCounselors);
router.post('/booking', bookingController.createBooking);
router.get('/bookings/daily-grouped', bookingController.getDailyGrouped);
router.post('/bookings/:user_id', bookingController.getBookingsByUser);
router.get('/admin/schedule', adminController.getAdminSchedule);
router.post('/admin/booking/:id', adminController.cancelBooking);
router.get('/recurring/rules', recurringController.getRules);
router.post('/recurring/rules/add', recurringController.addRule);
router.get('/recurring/rules/delete/:id', recurringController.deleteRule);
router.post('/recurring/generate', recurringController.generateBookings);
router.post('/login', authController.loginByPhone);
router.post('/register', authController.register);

// ── Web 管理后台专用路由（需要 adminAuth） ───────────────────────

// 咨询室管理
router.get('/admin/rooms', adminAuth, roomController.getAllRooms);
router.post('/admin/rooms', adminAuth, roomController.createRoom);
router.put('/admin/rooms/:id', adminAuth, roomController.updateRoom);
router.delete('/admin/rooms/:id', adminAuth, roomController.deleteRoom);

// 咨询师管理
router.post('/admin/counselors', adminAuth, counselorController.createCounselor);
router.put('/admin/counselors/:id', adminAuth, counselorController.updateCounselor);
router.delete('/admin/counselors/:id', adminAuth, counselorController.deleteCounselor);

// 导入（adminAuth 先于 multer 执行）
router.post('/admin/import', adminAuth, (req, res, next) => {
    xlsUpload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[multer error]', err.message);
            return res.status(400).json({
                success: false,
                message: `文件上传失败: ${err.message}`,
                logs: [{ level: 'error', msg: err.message }],
            });
        }
        importController.uploadAndImport(req, res, next);
    });
});

// 月度报表
router.get('/admin/report', adminAuth, reportController.exportMonthlyReport);

module.exports = router;
