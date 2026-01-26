const { Booking, Counselor, Room } = require('../models/init');
const { Op } = require('sequelize');

function getTimeStringFromSlot(slot) {
    const hour = Math.floor(slot / 2);
    const minute = (slot % 2) === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
}

exports.createBooking = async (req, res) => {
    const {
        room_id,
        counselor_id,
        booking_date,
        start_time_slot,
        end_time_slot
    } = req.body;

    //const userId = req.user.id;         // 从请求中获取用户ID
    const userId = req.user.openid;       // 从请求中获取用户ID

    try {
        // 1. 获取请求中的咨询师的信息，为了拿到姓名和价格
        const counselor = await Counselor.findOne({
            where: { id: counselor_id }
        });
        if (!counselor) {
            return res.status(403).json({ message: "未找到咨询师" + counselor_id });
        }

        // 2. 获取房间的信息
        const room = await Room.findByPk(room_id);
        if (!room) {
            return res.status(404).json({ message: "未找到房间" + room_id });
        }
        // 3. 计算费用
        // 时长 = 结束点 - 开始 （1 = 0.5小时）
        const duration = Math.floor((end_time_slot - start_time_slot) * 0.5);
        let booking_fee = 0.0;
        if (room.type === '咨询室') {
            booking_fee = duration * counselor.booking_price; // 咨询室的费用
        }
        else {
            booking_fee = duration * counselor.booking_multi_price; // 多功能房的费用
        }

        const conflictBooking = await Booking.findOne({
            where: {
                room_id,
                booking_date: booking_date,
                status: 'booked',
                [Op.and]: [
                    // 检查时间段冲突
                    {
                        start_time_slot: { [Op.lt]: end_time_slot }
                    },
                    {
                        end_time_slot: { [Op.gt]: start_time_slot }
                    }
                ]
            }
        });

        if (conflictBooking) {
            return res.status(409).json({ message: '该时段的房间已经被预订' });
        }

        console.log('创建预约:', userId, room_id, counselor_id, counselor.name, counselor.type, booking_date, start_time_slot, end_time_slot, booking_fee);

        // 2. 创建预约
        const newBooking = await Booking.create({
            booking_date: booking_date,
            start_time_slot: start_time_slot,
            start_time: getTimeStringFromSlot(start_time_slot),
            end_time_slot: end_time_slot,
            end_time: getTimeStringFromSlot(end_time_slot),
            booker_name: counselor.name,
            booker_type: counselor.type,
            booking_fee: booking_fee,
            status: 'booked',
            user_id: userId,
            counselor_id: counselor_id,
            room_id: room_id,

        });

        res.json({ success: true, data: newBooking });
    }
    catch (error) {
        console.error('预约失败:', error);
        res.status(500).json({ error: '预约失败' });
    }
};

exports.getBookingsByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await Booking.findAll({
            where: { user_id: userId },
            include: [
                { model: Room, attributes: ['id', 'name', 'type'] },
                { model: Counselor, attributes: ['id', 'name', 'type'] }
            ],
            order: [
                ['booking_date', 'DESC'],
                ['start_time_slot', 'DESC']
            ]
        });
        res.json({ success: true, data: bookings });
    }
    catch (error) {
        console.error('获取预约失败:', error);
        res.status(500).json({ error: '获取预约失败' });
    }
};
