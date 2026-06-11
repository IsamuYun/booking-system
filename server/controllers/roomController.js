const { Room, Booking } = require('../models/init');
const { Op } = require('sequelize');

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const DEFAULT_USAGE_PAST_DAYS = 15;
const DEFAULT_USAGE_DAYS = 31;
const MAX_USAGE_DAYS = 90;

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
// 一天的时间段
const TIME_SLOTS = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47];

function getTimeStringFromSlot(slot) {
    const hour = Math.floor(slot / 2);
    const minute = (slot % 2) === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
}

function getSlotStateText(state) {
    if (state === 'busy') return '已预约';
    if (state === 'rest') return '休息';
    return '空闲';
}

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function parseDateString(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function normalizeUsageDays(value) {
    const days = Number(value);
    if (!Number.isInteger(days)) {
        return DEFAULT_USAGE_DAYS;
    }
    return Math.min(Math.max(days, 1), MAX_USAGE_DAYS);
}

function groupBookingsByDate(bookings) {
    return bookings.reduce((grouped, booking) => {
        if (!grouped[booking.booking_date]) {
            grouped[booking.booking_date] = [];
        }
        grouped[booking.booking_date].push(booking);
        return grouped;
    }, {});
}

function buildUsageDay(room, date, offset, bookings) {
    const dateString = getLocalDateString(date);
    const occupiedSlots = new Set();

    bookings.forEach(booking => {
        for (let slot = booking.start_time_slot; slot < booking.end_time_slot; slot++) {
            if (TIME_SLOTS.includes(slot)) {
                occupiedSlots.add(slot);
            }
        }
    });

    const isRest = !room.isAvailable;
    const slots = TIME_SLOTS.map(slot => {
        const state = isRest ? 'rest' : occupiedSlots.has(slot) ? 'busy' : 'free';
        return {
            slot,
            start_time: getTimeStringFromSlot(slot),
            end_time: getTimeStringFromSlot(slot + 1),
            state,
            state_text: getSlotStateText(state),
        };
    });

    const availableSlots = slots.filter(slot => slot.state === 'free');
    const occupiedSlotNumbers = [...occupiedSlots].sort((a, b) => a - b);
    const occupancyPercent = isRest
        ? 0
        : Math.round((occupiedSlotNumbers.length / TIME_SLOTS.length) * 100);

    return {
        date: dateString,
        date_label: `${date.getMonth() + 1}月${date.getDate()}日 · 周${WEEKDAYS[date.getDay()]}`,
        week_label: offset === 0 ? '今天' : `周${WEEKDAYS[date.getDay()]}`,
        month_label: `${date.getMonth() + 1}月`,
        date_num: date.getDate(),
        offset,
        is_today: offset === 0,
        is_past: offset < 0,
        is_rest: isRest,
        is_full: !isRest && availableSlots.length === 0,
        occupancy_percent: occupancyPercent,
        occupied_slots: occupiedSlotNumbers,
        occupied_slots_text: occupiedSlotNumbers.map(getTimeStringFromSlot),
        available_slots: availableSlots.map(slot => slot.slot),
        available_slots_text: availableSlots.map(slot => slot.start_time),
        slots,
        bookings: bookings.map(booking => ({
            id: booking.id,
            start_time_slot: booking.start_time_slot,
            end_time_slot: booking.end_time_slot,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status,
        })),
    };
}

exports.getRoomUsage = async (req, res) => {
    console.log(`查询房间使用状况 请求参数: room_id=${req.params.room_id} days=${req.query.days} start_date=${req.query.start_date}`);
    try {
        const roomId = Number(req.params.room_id);
        if (!Number.isInteger(roomId) || roomId <= 0) {
            return res.status(400).json({ message: '无效的房间 ID' });
        }

        const days = normalizeUsageDays(req.query.days);
        const today = getTodayDate();
        const startDate = req.query.start_date
            ? parseDateString(req.query.start_date)
            : addDays(today, -DEFAULT_USAGE_PAST_DAYS);

        if (!startDate) {
            return res.status(400).json({ message: 'start_date 格式应为 YYYY-MM-DD' });
        }

        const endDate = addDays(startDate, days - 1);
        const startDateString = getLocalDateString(startDate);
        const endDateString = getLocalDateString(endDate);

        const room = await Room.findByPk(roomId, { raw: true });
        if (!room) {
            return res.status(404).json({ message: '未找到房间' + roomId });
        }

        const bookings = await Booking.findAll({
            where: {
                room_id: roomId,
                booking_date: {
                    [Op.between]: [startDateString, endDateString],
                },
                status: { [Op.ne]: 'cancelled' },
            },
            attributes: [
                'id',
                'booking_date',
                'start_time_slot',
                'start_time',
                'end_time_slot',
                'end_time',
                'status',
            ],
            order: [
                ['booking_date', 'ASC'],
                ['start_time_slot', 'ASC'],
            ],
            raw: true,
        });

        const bookingsByDate = groupBookingsByDate(bookings);
        const usage = Array.from({ length: days }, (_, index) => {
            const date = addDays(startDate, index);
            const dateString = getLocalDateString(date);
            const offset = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
            return buildUsageDay(room, date, offset, bookingsByDate[dateString] || []);
        });

        res.status(200).json({
            success: true,
            data: {
                room,
                start_date: startDateString,
                end_date: endDateString,
                days,
                usage,
            },
        });
    }
    catch (error) {
        console.error('查询房间使用状况失败:', error);
        res.status(500).json({ error: '查询房间使用状况失败' });
    }
};

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
