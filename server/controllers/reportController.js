const { Booking, User, Room, Counselor } = require("../models/init");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");

exports.exportMonthlyReport = async (req, res) => {
    try {
        const month = req.query.month; // 格式: "2026-02"
        if (!month) {
            return res.status(400).send("缺少月份参数");
        }

        // 1. 查询当月所有有效订单
        const bookings = await Booking.findAll({
            where: {
                booking_date: { [Op.like]: `${month}%` },
                status: { [Op.ne]: 'cancelled' }
            },
            include: [
                { model: Room, attributes: ['name'] },
                { model: Counselor, attributes: ['name', 'booking_price', 'booking_multi_price'] }
            ],
            order: [['booking_date', 'ASC'], ['start_time_slot', 'ASC']],
            raw: true,
            nest: true
        });

        // 2.创建Excel工作簿
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${month} 月账单`);

        // 3. 设置表头(Columns)
        worksheet.columns = [
            { header: '日期', key: 'date', width: 15 },
            { header: '开始时间', key: 'start-time', width: 15 },
            { header: '结束时间', key: 'end-time', width: 15 },
            { header: '小时数', key: 'duration', width: 15 },
            { header: '租赁人', key: 'counselor', width: 15 },
            { header: '咨询师类型', key: 'type', width: 15 },
            { header: '咨询室', key: 'room', width: 10 },
            { header: '租赁费用/小时 (元)', key: 'booking-price', width: 10 },
            { header: '应收费用(元)', key: 'booking-fee', width: 15 },
            { header: '收费情况', key: 'status', width: 10 },
            { header: '收款日期', key: 'paid-date', width: 10 },
            { header: '已收费(元)', key: 'paid-fee', width: 10 },
            { header: '备注', key: 'note', width: 15 },
        ];

        // 4. 添加行
        let total_fee = 0;
        let total_internal_fee = 0;
        let total_external_fee = 0;
        let total_duration = 0;
        let has_smile = false;
        let booking_real_price = 0;
        const month_fee = 4000;
        let duration = 0;

        bookings.forEach((booking) => {
            duration = (booking.end_time_slot - booking.start_time_slot) * 0.5;
            total_duration += duration;
            if (booking.Counselor.name === '笑凡') {
                if (has_smile === false) {
                    has_smile = true;
                }
                return;
            }
            if (booking.Room.name === '多功能室1') {
                booking_real_price = booking.Counselor.booking_multi_price;
            }
            else {
                booking_real_price = booking.Counselor.booking_price;
            }
            if (booking.booker_type === '内部') {
                paid_status = '月结';
            }
            else {
                paid_status = '未付';
            }

            worksheet.addRow({
                date: booking.booking_date,
                'start-time': booking.start_time,
                'end-time': booking.end_time,
                duration: duration,
                counselor: booking.Counselor.name,
                type: booking.booker_type,
                room: booking.Room.name,
                'booking-price': booking_real_price,
                'booking-fee': booking.booking_fee,
                status: paid_status,
                'paid-date': '',
                'paid-fee': booking.booking_fee,
                note: booking.note,
            });
            if (booking.booker_type !== '内部') {
                total_fee += booking.booking_fee;
                total_external_fee += booking.booking_fee;
            }
            else {
                total_fee += booking.booking_fee;
                total_internal_fee += booking.booking_fee;
            }
        });
        if (has_smile) {
            worksheet.addRow({
                date: month,
                'start-time': '',
                'end-time': '',
                duration: '',
                counselor: '笑凡',
                type: '内部',
                room: '多功能室1',
                'booking-price': 4000.00,
                'booking-fee': month_fee,
                status: '月结',
                'paid-date': '',
                'paid-fee': month_fee,
                note: '笑凡的包月费',
            });
        }

        const headerRow = worksheet.getRow(1);
        headerRow.font = {
            name: 'Arial',
            size: 14,
            bold: true
        };
        headerRow.commit();

        worksheet.addRow({});
        let totalRow = worksheet.addRow({ date: '总租赁时长 （小时)', duration: total_duration });
        totalRow.font = { size: 14, bold: true };
        totalRow.commit();

        totalRow = worksheet.addRow({ date: '总应收费用（元）', duration: total_fee });
        totalRow.font = { size: 14, bold: true };
        totalRow.commit();

        totalRow = worksheet.addRow({ date: '内部费用（元）', duration: total_internal_fee });
        totalRow.font = { size: 14, bold: true };
        totalRow.commit();

        totalRow = worksheet.addRow({ date: '外部费用（元）', duration: total_external_fee });
        totalRow.font = { size: 14, bold: true };
        totalRow.commit();

        res.setHeader(
            'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition', `attachment; filename="${month}-report.xlsx"`
        );

        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error('导出月报时出错:', error);
        res.status(500).send('导出月报时出错');
    }
}
