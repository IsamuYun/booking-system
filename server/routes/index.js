// server/routes/index.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const counselorController = require('../controllers/counselorController');
const bookingController = require('../controllers/bookingController');
const adminController = require('../controllers/adminController');
const recurringController = require('../controllers/recurringController');
const authController = require('../controllers/authController');


router.get('/rooms', roomController.getRooms);
router.get('/counselors', counselorController.getCounselors);
router.post('/booking', bookingController.createBooking);
router.get('/admin/schedule', adminController.getAdminSchedule);
router.post('/admin/booking/:id', adminController.cancelBooking);
router.post('/bookings/:user_id', bookingController.getBookingsByUser);

router.get('/recurring/rules', recurringController.getRules);
router.post('/recurring/rules/add', recurringController.addRule);
router.get('/recurring/rules/delete/:id', recurringController.deleteRule);
router.post('/recurring/generate', recurringController.generateBookings);

router.post('/login', authController.loginByPhone);
router.post('/register', authController.register);

// ... 其他路由

module.exports = router;