const { Room, Booking } = require('../models/init');

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({ raw: true });
    res.status(200).json({ data: rooms });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: '名称和类型为必填项' });
    const room = await Room.create({ name, type, isAvailable: true });
    res.status(201).json({ data: room });
  } catch (error) {
    console.error('创建咨询室失败:', error);
    res.status(500).json({ error: '创建咨询室失败' });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, isAvailable } = req.body;
    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ error: '咨询室不存在' });
    await room.update({ name, type, isAvailable });
    res.json({ data: room });
  } catch (error) {
    console.error('更新咨询室失败:', error);
    res.status(500).json({ error: '更新咨询室失败' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ error: '咨询室不存在' });
    await room.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('删除咨询室失败:', error);
    res.status(500).json({ error: '删除咨询室失败' });
  }
};
const { Op } = require('sequelize');

// 一天的时间段
const TIME_SLOTS = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47];

function getTimeStringFromSlot(slot) {
    const hour = Math.floor(slot / 2);
    const minute = (slot % 2) === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
}

exports.getRooms = async (req, res) => {
    try {
        // 获取前端请求的时间
        let { booking_date } = req.query;
        if (!booking_date) {
            // 如果没有提供日期，则使用今天的日期
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            booking_date = `${year}-${month}-${day}`;
        }
        // 获取所有可用的房间
        const rooms = await Room.findAll({
            // 只获取可用的房间
            where: { isAvailable: true },
            raw: true   // 获取纯JSON对象
        });

        // 获取该日期已被预订的房间和时间段
        const bookings = await Booking.findAll({
            where: {
                booking_date: booking_date,
                status: { [Op.ne]: 'cancelled' }
            },
            attributes: ['room_id', 'start_time_slot', 'end_time_slot'],
            raw: true
        });

        // 每个房间计算一遍可用的时间段
        const room_availability = rooms.map(room => {
            // 找到当前房间的所有预订记录
            const room_bookings = bookings.filter(b => b.room_id === room.id);
            // 计算被占用的时间段
            let occupied_slots = new Set();
            room_bookings.forEach(b => {
                for (let slot = b.start_time_slot; slot < b.end_time_slot; slot++) {
                    occupied_slots.add(slot);
                }
            });
            // 计算可用的时间段 = 全部时间段 - 被占用的时间段
            const available_slots = TIME_SLOTS.filter(slot => !occupied_slots.has(slot));

            const available_slots_text = [];
            available_slots.forEach(slot => {
                let text = getTimeStringFromSlot(slot);
                available_slots_text.push(text);
            });

            return {
                ...room,
                available_slots: available_slots,
                available_slots_text: available_slots_text,
                is_full: available_slots.length === 0
            };
        });
        console.log(`房间可用时间查询 日期: ${booking_date} 结果:`, room_availability);
        res.status(200).json({ date: booking_date, data: room_availability });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}