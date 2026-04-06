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

router.post('/admin/import', xlsUpload.single('file'), importController.uploadAndImport);

router.get('/rooms', roomController.getRooms);
router.get('/counselors', counselorController.getCounselors);
router.post('/booking', bookingController.createBooking);

router.get('/bookings/daily-grouped', bookingController.getDailyGrouped);

router.get('/admin/schedule', adminController.getAdminSchedule);
router.post('/admin/booking/:id', adminController.cancelBooking);
router.post('/bookings/:user_id', bookingController.getBookingsByUser);

router.get('/recurring/rules', recurringController.getRules);
router.post('/recurring/rules/add', recurringController.addRule);
router.get('/recurring/rules/delete/:id', recurringController.deleteRule);
router.post('/recurring/generate', recurringController.generateBookings);

router.post('/login', authController.loginByPhone);
router.post('/register', authController.register);
router.get('/admin/report', reportController.exportMonthlyReport);

// ... 其他路由

module.exports = router;