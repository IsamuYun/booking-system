// server/routes/index.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const counselorController = require('../controllers/counselorController');
const bookingController = require('../controllers/bookingController');

router.get('/rooms', roomController.getRooms);
router.get('/counselors', counselorController.getCounselors);
router.post('/booking', bookingController.createBooking);
// ... 其他路由

module.exports = router;