const { Room, Booking, Counselor } = require('../models/init');
const { Op } = require('sequelize');

exports.getAdminSchedule = async (req, res) => {
    try {
        const { date } = req.query; // 期望的日期格式为 'YYYY-MM-DD'
        if (!date) {
            return res.status(400).json({ message: '缺少日期参数' });
        }

        // 获取所有咨询室
        const rooms = await Room.findAll({ raw: true });

        // 获取指定日期的所有预约记录
        const bookings = await Booking.findAll({
            where: {
                booking_date: date,
            },
            include: [
                { model: Room, attributes: ['name'] },
                { model: Counselor, attributes: ['name', 'type'] },
            ],
            order: [
                ['start_time_slot', 'ASC'],
                ['room_id', 'ASC']
            ],
            raw: true,
            nest: true
        });

        // 获取所有咨询师信息
        const counselors = await Counselor.findAll({ raw: true });

        // 将所有预约记录按时间排序，添加咨询师姓名，咨询室类型，房间名称
        const enrichedBookings = bookings.map(b => ({
            id: b.id,
            booking_date: b.booking_date,
            start_time: b.start_time,
            end_time: b.end_time,
            room_id: b.room_id,
            room_name: b.Room ? b.Room.name : '未知房间',
            counselor_id: b.counselor_id,
            counselor_name: b.Counselor ? b.Counselor.name : '未知咨询师',
            counselor_type: b.Counselor ? b.Counselor.type : '未知类型',
            booker_name: b.booker_name,
            price: b.booking_fee,
            status: b.status,
        }));

        res.json({
            data: enrichedBookings
        });
    }
    catch (error) {
        console.error('获取管理员日程失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 取消预约
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findByPk(id);
        if (!booking) {
            return res.status(404).json({ message: '预约记录未找到' });
        }

        // 更新预约状态为已取消
        booking.status = 'cancelled';
        await booking.save();
        res.json({ message: '预约已取消' });
    }
    catch (error) {
        console.error('取消预约失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};


