const ExcelJS = require('exceljs');
const { Room, Counselor, Booking } = require('../models/init')
const { Op } = require('sequelize');
const path = require('path');

// 计算上个月的工作表名称，格式：yyyy年m月
function getLastMonthSheetName() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-based: 0=1月，所以此值即为上个月月份数
    if (month === 0) {
        year -= 1;
        month = 12;
    }
    return `${year}年${month}月`;
}

// 辅助函数：将 Date 对象转为 "YYYY-MM-DD" 格式
function formatDate(date_value) {
    // 1. 安全检查：如果不是 Date 对象（可能是 null, 字符串或数字），直接返回原值或空串
    if (!date_value) {
        return "";
    }
    const date = new Date(date_value);

    // 2. 获取年月日
    const year = date.getUTCFullYear();
    // getMonth() 返回 0-11，所以需要 +1
    // padStart(2, '0') 用于补零，保证 "1月" 变成 "01月" (如果不需要补零可去掉)
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// 辅助函数: 将时间字符串转换为数字
function parseTimeSlot(time_str) {
    const [hour, minute] = time_str.split(':').map(Number);
    time = hour * 2;
    if (minute > 0) {
        time += 1;
    }
    return time;
}

// 辅助函数: 将时间提取出来
function extractStartTime(time_str) {
    if (!time_str || time_str.trim() === '') {
        return '';
    }
    [hour, minute] = time_str.split('-')[0].trim().split(':').map(String);
    hour = hour.padStart(2, '0');
    minute = minute.padStart(2, '0');
    start_time = `${hour}:${minute}`;
    return start_time;
}

function extractEndTime(time_str) {
    if (!time_str || time_str.trim() === '') {
        return '';
    }
    [hour, minute] = time_str.split('-')[1].trim().split(':').map(String);
    hour = hour.padStart(2, '0');
    minute = minute.padStart(2, '0');
    end_time = `${hour}:${minute}`;
    return end_time;
}

// 辅助函数: 将类型-姓名-备注转换为类型，姓名，备注
function parseName(name_str) {
    if (name_str === '') {
        return null;
    }
    let name_info = ['type', 'name', 'remark'];
    name_info = name_str.split('-').map(String);
    return name_info;
}

// 辅助函数: 将房间名称转换为房间 ID
function parseRoom(room_str) {
    if (room_str === '') {
        return 0;
    }
    else if (room_str === "咨询室 1") {
        return 1;
    }
    else if (room_str === "咨询室 2") {
        return 2;
    }
    else if (room_str === "咨询室 3") {
        return 3;
    }
    else if (room_str === "多功能室1") {
        return 4;
    }
    else if (room_str.includes("多功能室2")) {
        return 5;
    }
}

// 辅助函数: 将由姓名和类型组成特定的Key
function generateCounselorKey(type, name) {
    if (!type || !name) {
        return "";
    }
    type = type.trim();
    name = name.trim();
    if (type === '咨询') {
        return '内部-' + name;
    }
    if (name === '雪雪' || name === '叶闻' || name === '方跃璇') {
        return '合作-漫漫-' + name;
    }
    if (name === '墨提斯') {
        return '合作-墨提斯-' + name;
    }
    return '外部-' + name;
}

exports.uploadAndImport = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: '未收到文件，请上传 xlsx 文件' });
    }

    const filePath = req.file.path;
    const sheetName = getLastMonthSheetName();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
        return res.status(400).json({ success: false, message: `未找到工作表「${sheetName}」，请检查文件内容` });
    }

    // 预先加载所有房间和辅导员数据，减少后续查询次数
    const rooms = await Room.findAll();
    const rooms_map = {};
    rooms.forEach(room => {
        rooms_map[room.name] = room.id;
    });
    const counselors = await Counselor.findAll();
    const counselors_map = {};
    counselors.forEach(counselor => {
        counselors_map[`${counselor.type}-${counselor.name}`] = counselor;
    });
    
    const START_ROW = 3;
    const END_ROW = 155;
    const DATE_ROW = 2; // 日期在第 2 行
    const ROOM_COL = 1; // A 列为房间名称
    const TIME_COL = 2; // B 列为日期
    const START_COL = 3; // C 列开始为当月的第一天 1日
    const END_COL = 33;  // AG 列为当月的最后一天 31日

    console.log(`正在读取从 C${START_ROW} 到 AG${END_ROW} 的数据...`);

    let recordList = [];
    let last_record = {
        booking_date: '',
        start_time_slot: 0,
        start_time: '',
        end_time_slot: 0,
        end_time: '',
        counselor_id: 0,
        booker_name: '',
        booker_type: '',
        bocker_fee: 0,
        status: '',
        user_id: 0,
        room_id: 0,
        full_name: '',
        remark: '',
        booking_price: 0,
    };

    // 4. 双重循环遍历单元格
    for (let col = START_COL; col <= END_COL; col++) {
        for (let row = START_ROW; row <= END_ROW; row++) {
            let full_name = worksheet.getCell(row, col).text.trim();
            if (full_name == null || full_name === '') {
                if (last_record.full_name !== '') {
                    // 上一个记录不空，说明之前有记录，现在遇到空单元格，表示时间段结束，添加记录并重置 last_record
                    let duration = Math.round((last_record.end_time_slot - last_record.start_time_slot) * 0.5);
                    last_record.booking_fee = duration * last_record.booking_price;
                    recordList.push(last_record);
                    last_record = {full_name: ''}; // 重置 last_record，标记为没有记录
                }
                continue; // 跳过空单元格
            }
            let counselor_info = parseName(full_name);
            let type = counselor_info[0] || '';
            let name = counselor_info[1] || '';
            let remark = counselor_info[2] || '';
            let room_name = worksheet.getCell(row, ROOM_COL).text.trim();
            let room_id = parseRoom(room_name);
            let booking_date = formatDate(worksheet.getCell(DATE_ROW, col)); // 得到日期 Cell(Row = 2, Col = startCol)
            let time_str = worksheet.getCell(row, TIME_COL).text.trim();
            let start_time = extractStartTime(time_str);
            let start_time_slot = parseTimeSlot(start_time);
            let end_time = extractEndTime(time_str);
            let end_time_slot = parseTimeSlot(end_time);
            let counselor_key = generateCounselorKey(type, name);
            let counselor = counselors_map[counselor_key];
            if (!counselor) {
                console.warn(`⚠️ 未找到辅导员: 类型: ${type}, 姓名: ${name}, 备注: ${remark}, 键: ${counselor_key}, Row: ${row}, Col: ${col}`);
                continue; // 跳过没有匹配辅导员的记录
            }
            let booker_name = counselor.name;
            let booker_type = counselor.type;
            let counselor_id = counselor.id;
            let booking_price = room_id === 4 ? counselor.booking_multi_price : counselor.booking_price;
            
            let record = {
                booking_date: booking_date,
                start_time_slot: start_time_slot,
                start_time: start_time,
                end_time_slot: end_time_slot,
                end_time: end_time,
                counselor_id: counselor_id,
                booker_name: booker_name,
                booker_type: booker_type,
                status: 'booked',
                user_id: 1, // 由于没有用户信息，暂时设置为 1
                room_id: room_id,
                full_name: full_name,
                remark: remark,
                booking_price: booking_price,
            };
            if (last_record.full_name === '') {
                // 第一次记录，直接添加
                last_record = record;
                continue;
                //recordList.push(last_record);
                //continue;
            }
            else if (last_record.full_name === record.full_name && last_record.booking_date === record.booking_date && last_record.room_id === record.room_id) {
                // 与上一次记录相同，合并时间段
                last_record.end_time = record.end_time;
                last_record.end_time_slot = record.end_time_slot;
            }
            else {
                // 第一次记录或与上一次记录不同，添加新记录
                // 上一个记录不空，说明之前有记录，现在遇到空单元格，表示时间段结束，添加记录并重置 last_record
                let duration = Math.round((last_record.end_time_slot - last_record.start_time_slot) * 0.5);
                last_record.booking_fee = duration * last_record.booking_price;
                recordList.push(last_record);
                last_record = record;
            }
        }
    }

    // 6. 输出结果
    console.log('--- 提取结果 ---');
    console.log(`共找到 ${recordList.length} 条预定记录：`);
    let savedCount = 0;
    let skippedCount = 0;
    for (const record of recordList) {
        console.log(`房间: ${record.room_id}, \
            日期: ${record.booking_date}, 时间: ${record.start_time}-${record.end_time}, \
            费用: ¥${record.booking_fee}, 预定人: ${record.booker_name}, 类型: ${record.booker_type}`);

        // 7. 将记录保存到数据库
        const conflictBooking = await Booking.findOne({
            where: {
                room_id: record.room_id,
                booking_date: record.booking_date,
                status: 'booked',
                [Op.and]: [
                    // 检查时间段冲突
                    {
                        start_time_slot: { [Op.lt]: record.end_time_slot }
                    },
                    {
                        end_time_slot: { [Op.gt]: record.start_time_slot }
                    }
                ]
            }
        });

        if (conflictBooking) {
            console.log('该时段的房间已经被预订');
            skippedCount++;
            continue; // 跳过冲突的记录
        }

        await Booking.create({
            booking_date: record.booking_date,
            start_time_slot: record.start_time_slot,
            start_time: record.start_time,
            end_time_slot: record.end_time_slot,
            end_time: record.end_time,
            counselor_id: record.counselor_id,
            booker_name: record.booker_name,
            booker_type: record.booker_type,
            booking_fee: record.booking_fee,
            status: record.status,
            user_id: record.user_id,
            room_id: record.room_id,
        });

        console.log('已保存预定记录到数据库');
        savedCount++;
    }

    return res.json({
        success: true,
        message: `导入完成：共解析 ${recordList.length} 条，成功导入 ${savedCount} 条，跳过冲突 ${skippedCount} 条`,
        sheetName,
        total: recordList.length,
        saved: savedCount,
        skipped: skippedCount,
    });
}
