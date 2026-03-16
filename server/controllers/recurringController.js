const { RecurringRule, Booking, Room, Counselor } = require('../models/init');
const { Op } = require('sequelize');

function getTimeStringFromSlot(slot) {
    const hour = Math.floor(slot / 2);
    const minute = (slot % 2) === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
}

function getDateStringFromDayOfWeek(dayOfWeek) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[dayOfWeek];
};

function getDateString(date) {
    let now = date;
    if (date === null) {
        now = new Date();
    }
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

// 获取所有规则列表
exports.getRules = async (req, res) => {
    try {
        const rules = await RecurringRule.findAll({
            include: [
                { model: Room, attributes: ['id', 'name', 'type'] },
                { model: Counselor, attributes: ['id', 'name', 'type', 'booking_price'] }
            ],
            order: [
                ['day_of_week', 'ASC'],
                ['room_id', 'ASC'],
                ['start_time_slot', 'ASC']
            ]
        });
        res.json({ success: true, data: rules });
    }
    catch (error) {
        console.error('获取规则失败:', error);
        res.status(500).json({ error: '获取规则失败' });
    }
};

// 添加新规则
exports.addRule = async (req, res) => {
    try {
        const { counselor_id, room_id, day_of_week, start_time, start_time_slot, end_time, end_time_slot } = req.body;
        const conflict_rule = await RecurringRule.findOne({
            where: {
                room_id,
                day_of_week,
                [Op.and]: [
                    {
                        start_time_slot: {
                            [Op.lt]: end_time_slot
                        }
                    },
                    {
                        end_time_slot: {
                            [Op.gt]: start_time_slot
                        }
                    }
                ]
            }
        });
        if (conflict_rule) {
            return res.json({ success: false, message: '同现有规则时间冲突' });
        }
        const rule = await RecurringRule.create({
            day_of_week,
            start_time,
            start_time_slot,
            end_time,
            end_time_slot,
            counselor_id,
            room_id,
        });
        res.json({ success: true, data: rule });
    }
    catch (error) {
        console.error('添加规则失败:', error);
        res.status(500).json({ error: '添加规则失败' });
    }
};

// 删除规则
exports.deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        await RecurringRule.destroy({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        console.error('删除规则失败:', error);
        res.status(500).json({ error: '删除规则失败' });
    }
};

// 根据规则生成未来30天的预约
exports.generateBookings = async (req, res) => {
    const { days = 30 } = req.body; // 默认生成未来30天的预约
    try {
        // 获取所有规则
        const rules = await RecurringRule.findAll({
            include: [
                { model: Room, attributes: ['id', 'name', 'type'] },
                { model: Counselor, attributes: ['id', 'name', 'type', 'booking_price', 'booking_multi_price'] }
            ],
            order: [
                ['day_of_week', 'ASC'],
                ['start_time_slot', 'ASC']
            ]
        });

        if (rules.length === 0) {
            console.log("没有规则");
            return res.json({ success: false, message: "没有规则" });
        }
        // 生成未来30天的预约
        const bookings = [];
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        let count = 0;

        // 遍历未来30天
        while (start < end) {
            // 遍历每一天的每个规则
            for (const rule of rules) {
                // 检查这一天是否是规则的那一天
                if (start.getDay() === rule.day_of_week) {
                    // 检查这一天是否已经预约
                    const conflict_booking = await Booking.findOne({
                        where: {
                            room_id: rule.Room.id,
                            booking_date: getDateString(start),
                            [Op.and]: [
                                {
                                    start_time_slot: {
                                        [Op.lt]: rule.end_time_slot
                                    }
                                },
                                {
                                    end_time_slot: {
                                        [Op.gt]: rule.start_time_slot
                                    }
                                }
                            ],
                        }
                    });

                    if (!conflict_booking) {
                        // 计算时长
                        const duration = Math.floor((rule.end_time_slot - rule.start_time_slot) * 0.5);
                        let booking_fee = 0.0;
                        if (rule.Room.type === '咨询室') {
                            booking_fee = duration * rule.Counselor.booking_price; // 咨询室的费用
                        }
                        else {
                            booking_fee = duration * rule.Counselor.booking_multi_price; // 多功能房的费用
                        }
                        // 如果这一天没有预约，就创建一个预约
                        const booking = await Booking.create({
                            booking_date: getDateString(start),
                            start_time_slot: rule.start_time_slot,
                            start_time: rule.start_time,
                            end_time_slot: rule.end_time_slot,
                            end_time: rule.end_time,
                            counselor_id: rule.Counselor.id,
                            room_id: rule.Room.id,
                            booker_name: rule.Counselor.name,
                            booker_type: rule.Counselor.type,
                            booking_fee: booking_fee,
                            status: 'recurring',
                            user_id: "mock_openid_002",
                        });
                        bookings.push(booking);
                        console.log(`预约成功 ${rule.Room.name} `);
                    }
                }
            }
            // 移动到下一天
            start.setDate(start.getDate() + 1);
        }

        res.json({ success: true });
    }
    catch (error) {
        console.error('生成预约失败:', error);
        res.status(500).json({ error: '生成预约失败' });
    }
};
