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

// 安全读取单元格文本：ExcelJS 在某些情况（公式结果为 null、合并单元格等）
// 会对 null 调用 .toString() 导致崩溃，这里统一用 try-catch 保护
function getCellText(worksheet, row, col) {
    try {
        const cell = worksheet.getCell(row, col);
        const text = cell.text;
        return (text === null || text === undefined) ? '' : String(text);
    } catch {
        return '';
    }
}

// 安全读取单元格原始值，并解包 ExcelJS 公式结果对象
// 例如日期公式 =DATE(2024,4,1) 的 cell.value 是 { formula:'...', result:<Date> }
function getCellValue(worksheet, row, col) {
    try {
        const cell = worksheet.getCell(row, col);
        const v = cell.value;
        if (v !== null && v !== undefined && typeof v === 'object' && 'result' in v) {
            return v.result; // 解包公式结果
        }
        return v;
    } catch {
        return null;
    }
}

// 辅助函数：将 Date / Excel序列数 / 字符串 转为 "YYYY-MM-DD" 格式
function formatDate(date_value) {
    if (date_value === null || date_value === undefined) return '';

    let date;
    if (date_value instanceof Date) {
        date = date_value;
    } else if (typeof date_value === 'number') {
        // Excel 日期序列数：自 1899-12-30 起的天数
        date = new Date(Date.UTC(1899, 11, 30) + date_value * 86400000);
    } else {
        date = new Date(date_value);
    }

    if (isNaN(date.getTime())) return '';

    const year  = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day   = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 辅助函数: 将时间字符串转换为数字
function parseTimeSlot(time_str) {
    if (!time_str || !time_str.includes(':')) return null;
    const parts = time_str.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    const [hour, minute] = parts;
    return hour * 2 + (minute > 0 ? 1 : 0);
}

// 辅助函数: 提取开始时间
function extractStartTime(time_str) {
    if (!time_str || time_str.trim() === '') return '';
    const parts = time_str.split('-');
    if (parts.length < 2) return '';
    const timeParts = parts[0].trim().split(':').map(String);
    if (timeParts.length < 2) return '';
    return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
}

function extractEndTime(time_str) {
    if (!time_str || time_str.trim() === '') return '';
    const parts = time_str.split('-');
    if (parts.length < 2) return '';
    const timeParts = parts[1].trim().split(':').map(String);
    if (timeParts.length < 2) return '';
    return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
}

// 辅助函数: 将类型-姓名-备注转换为数组
function parseName(name_str) {
    if (!name_str || name_str === '') return null;
    return name_str.split('-').map(String);
}

// 辅助函数: 将房间名称转换为房间 ID（动态查表）
function lookupRoomId(room_str, rooms_map, log) {
    if (!room_str || room_str.trim() === '') return null;
    const trimmed = room_str.trim();

    // 1. 精确匹配
    if (rooms_map[trimmed] !== undefined) return rooms_map[trimmed];

    // 2. 去空格后精确匹配（如 "咨询室 1" → "咨询室1"）
    const normalized = trimmed.replace(/\s+/g, '');
    for (const [key, id] of Object.entries(rooms_map)) {
        if (key.replace(/\s+/g, '') === normalized) return id;
    }

    // 3. 前缀匹配：单元格内容以某个房间名开头（如 "多功能室2（29F" → "多功能室2"）
    for (const [key, id] of Object.entries(rooms_map)) {
        const keyNorm = key.replace(/\s+/g, '');
        if (normalized.startsWith(keyNorm)) {
            log('info', `房间前缀匹配: 「${room_str}」→「${key}」(id=${id})`);
            return id;
        }
    }

    log('warn', `房间名称无法匹配: 「${room_str}」，数据库中已有: [${Object.keys(rooms_map).join(', ')}]`);
    return null;
}

// 辅助函数: 将由姓名和类型组成特定的Key
function generateCounselorKey(type, name) {
    if (!type || !name) return '';
    type = type.trim();
    name = name.trim();
    if (type === '咨询') return '内部-' + name;
    if (name === '雪雪' || name === '叶闻' || name === '方跃璇') return '合作-漫漫-' + name;
    if (name === '墨提斯') return '合作-墨提斯-' + name;
    return '外部-' + name;
}

exports.uploadAndImport = async (req, res, next) => {
    // ── 日志收集器 ───────────────────────────────────────────────
    const logs = [];
    const log = (level, msg) => {
        logs.push({ level, msg });
        if (level === 'warn')  console.warn(`[WARN]  ${msg}`);
        else if (level === 'error') console.error(`[ERROR] ${msg}`);
        else if (level === 'success') console.log(`[OK]    ${msg}`);
        else if (level === 'skip')  console.log(`[SKIP]  ${msg}`);
        else                        console.log(`[INFO]  ${msg}`);
    };

    // 顶层 try-catch：确保任何意外错误都返回 JSON 而不是 HTML
    try {

    if (!req.file) {
        return res.status(400).json({ success: false, message: '未收到文件，请上传 xlsx 文件', logs });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname || req.file.filename;
    const fileSizeKB = (req.file.size / 1024).toFixed(1);
    log('info', `收到文件: ${originalName}（${fileSizeKB} KB），路径: ${filePath}`);

    const sheetName = getLastMonthSheetName();
    log('info', `目标工作表名称: 「${sheetName}」`);

    let workbook;
    try {
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        log('info', `Excel 文件读取成功，共 ${workbook.worksheets.length} 个工作表: [${workbook.worksheets.map(w => w.name).join(', ')}]`);
    } catch (e) {
        log('error', `读取 Excel 文件失败: ${e.message}`);
        return res.status(500).json({ success: false, message: `读取文件失败: ${e.message}`, logs });
    }

    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
        const available = workbook.worksheets.map(w => `「${w.name}」`).join(', ');
        log('error', `未找到工作表「${sheetName}」，文件中存在的工作表: ${available}`);
        return res.status(400).json({
            success: false,
            message: `未找到工作表「${sheetName}」，文件中存在: ${available}`,
            logs,
        });
    }
    log('info', `找到工作表「${sheetName}」，共 ${worksheet.rowCount} 行 × ${worksheet.columnCount} 列`);

    // ── 预加载数据库中的房间和咨询师 ──────────────────────────────
    const rooms = await Room.findAll({ raw: true });
    const rooms_map = {};
    rooms.forEach(room => { rooms_map[room.name] = room.id; });
    log('info', `已加载 ${rooms.length} 个房间: ${rooms.map(r => `${r.name}(id=${r.id})`).join(', ')}`);

    const counselors = await Counselor.findAll({ raw: true });
    const counselors_map = {};
    counselors.forEach(c => { counselors_map[`${c.type}-${c.name}`] = c; });
    log('info', `已加载 ${counselors.length} 位咨询师`);

    const START_ROW = 3;
    const END_ROW = 155;
    const DATE_ROW = 2;
    const ROOM_COL = 1;  // A 列: 房间名称
    const TIME_COL = 2;  // B 列: 时间段
    const START_COL = 3; // C 列: 当月第 1 天
    const END_COL = 33;  // AG 列: 当月第 31 天

    log('info', `扫描范围: 行 ${START_ROW}–${END_ROW}，列 ${START_COL}–${END_COL}（C–AG）`);

    let recordList = [];
    let parseErrors = 0;
    let last_record = { full_name: '' };

    // ── 双重循环：按列（日期）→ 行（时间段） ────────────────────
    for (let col = START_COL; col <= END_COL; col++) {
        const booking_date = formatDate(getCellValue(worksheet, DATE_ROW, col));

        // 该列没有有效日期，跳过
        if (!booking_date || booking_date === '1970-01-01') {
            continue;
        }

        log('info', `── 处理列 ${col}，日期: ${booking_date} ──`);
        let colHasData = false;

        for (let row = START_ROW; row <= END_ROW; row++) {
            const full_name = getCellText(worksheet, row, col).trim();

            if (!full_name) {
                // 空单元格 → 如果上一条记录存在，则结束该记录
                if (last_record.full_name !== '') {
                    const duration = (last_record.end_time_slot - last_record.start_time_slot) * 0.5;
                    last_record.booking_fee = duration * last_record.booking_price;
                    log('info', `  记录结束: ${last_record.booker_name} | ${last_record.booking_date} ${last_record.start_time}–${last_record.end_time} | 房间 ID=${last_record.room_id} | 时长 ${duration}h | 费用 ¥${last_record.booking_fee}`);
                    recordList.push(last_record);
                    last_record = { full_name: '' };
                }
                continue;
            }

            colHasData = true;

            // ── 解析单元格内容 ──────────────────────────────────
            const counselor_info = parseName(full_name);
            if (!counselor_info || counselor_info.length < 2) {
                log('warn', `  行 ${row} 列 ${col}: 无法解析姓名格式 「${full_name}」，已跳过`);
                parseErrors++;
                continue;
            }
            const type   = counselor_info[0] || '';
            const name   = counselor_info[1] || '';
            const remark = counselor_info[2] || '';

            const room_name = getCellText(worksheet, row, ROOM_COL).trim();
            const room_id   = lookupRoomId(room_name, rooms_map, log);
            if (room_id === null) {
                log('warn', `  行 ${row} 列 ${col}: 「${full_name}」 → 房间「${room_name}」无法匹配，已跳过`);
                parseErrors++;
                continue;
            }

            const time_str = getCellText(worksheet, row, TIME_COL).trim();
            const start_time = extractStartTime(time_str);
            const end_time   = extractEndTime(time_str);
            if (!start_time || !end_time) {
                log('warn', `  行 ${row} 列 ${col}: 「${full_name}」 → 时间格式异常 「${time_str}」，已跳过`);
                parseErrors++;
                continue;
            }

            const start_time_slot = parseTimeSlot(start_time);
            const end_time_slot   = parseTimeSlot(end_time);
            if (start_time_slot === null || end_time_slot === null) {
                log('warn', `  行 ${row} 列 ${col}: 「${full_name}」 → 时间槽解析失败 start=${start_time} end=${end_time}，已跳过`);
                parseErrors++;
                continue;
            }

            const counselor_key = generateCounselorKey(type, name);
            const counselor     = counselors_map[counselor_key];
            if (!counselor) {
                log('warn', `  行 ${row} 列 ${col}: 未找到咨询师 — 原始值: 「${full_name}」，类型: 「${type}」，姓名: 「${name}」，备注: 「${remark}」，查找键: 「${counselor_key}」`);
                parseErrors++;
                continue;
            }

            // 判断是多功能室还是咨询室
            const roomObj = rooms.find(r => r.id === room_id);
            const isMulti = roomObj && roomObj.type === '多功能室';
            const booking_price = isMulti ? counselor.booking_multi_price : counselor.booking_price;

            const record = {
                booking_date,
                start_time_slot,
                start_time,
                end_time_slot,
                end_time,
                counselor_id:  counselor.id,
                booker_name:   counselor.name,
                booker_type:   counselor.type,
                status:        'booked',
                user_id:       1,
                room_id,
                full_name,
                remark,
                booking_price,
            };

            if (last_record.full_name === '') {
                // 新记录开始
                log('info', `  行 ${row}: 新记录 [${counselor.name}] ${booking_date} ${start_time}–${end_time} 房间=${room_name}(id=${room_id}) 价格=¥${booking_price}/时`);
                last_record = record;
            } else if (
                last_record.full_name    === record.full_name &&
                last_record.booking_date === record.booking_date &&
                last_record.room_id      === record.room_id
            ) {
                // 合并连续时间段
                log('info', `  行 ${row}: 合并时间段 [${counselor.name}] ${last_record.end_time} → ${end_time}`);
                last_record.end_time      = record.end_time;
                last_record.end_time_slot = record.end_time_slot;
            } else {
                // 不同记录，先保存上一条
                const duration = (last_record.end_time_slot - last_record.start_time_slot) * 0.5;
                last_record.booking_fee = duration * last_record.booking_price;
                log('info', `  行 ${row}: 结束前一记录 [${last_record.booker_name}] ${last_record.start_time}–${last_record.end_time} 时长 ${duration}h 费用 ¥${last_record.booking_fee}`);
                recordList.push(last_record);
                log('info', `  行 ${row}: 开始新记录 [${counselor.name}] ${booking_date} ${start_time}–${end_time}`);
                last_record = record;
            }
        }

        // 列末尾如仍有未结束的记录，也要保存
        if (last_record.full_name !== '') {
            const duration = (last_record.end_time_slot - last_record.start_time_slot) * 0.5;
            last_record.booking_fee = duration * last_record.booking_price;
            log('info', `  列末尾结束记录: [${last_record.booker_name}] ${last_record.start_time}–${last_record.end_time} 时长 ${duration}h 费用 ¥${last_record.booking_fee}`);
            recordList.push(last_record);
            last_record = { full_name: '' };
        }

        if (!colHasData) {
            log('info', `  列 ${col} (${booking_date}) 无数据`);
        }
    }

    // ── 汇总解析结果 ─────────────────────────────────────────────
    log('info', `解析完成，共提取 ${recordList.length} 条记录，解析跳过 ${parseErrors} 处异常`);
    if (recordList.length === 0) {
        log('warn', '未解析到任何记录，请检查工作表格式是否正确');
        return res.json({ success: true, message: '未解析到任何记录', total: 0, saved: 0, skipped: 0, logs });
    }

    // ── 写入数据库 ────────────────────────────────────────────────
    log('info', `开始写入数据库，共 ${recordList.length} 条...`);
    let savedCount   = 0;
    let skippedCount = 0;

    for (const record of recordList) {
        const label = `[${record.booker_name}] ${record.booking_date} ${record.start_time}–${record.end_time} 房间ID=${record.room_id}`;

        // 冲突检测
        let conflictBooking;
        try {
            conflictBooking = await Booking.findOne({
                where: {
                    room_id:      record.room_id,
                    booking_date: record.booking_date,
                    status:       { [Op.ne]: 'cancelled' },
                    [Op.and]: [
                        { start_time_slot: { [Op.lt]: record.end_time_slot } },
                        { end_time_slot:   { [Op.gt]: record.start_time_slot } },
                    ],
                },
            });
        } catch (e) {
            log('error', `冲突查询失败 ${label}: ${e.message}`);
            skippedCount++;
            continue;
        }

        if (conflictBooking) {
            log('skip', `冲突跳过 ${label} — 与已有预约 id=${conflictBooking.id} (${conflictBooking.start_time}–${conflictBooking.end_time}) 重叠`);
            skippedCount++;
            continue;
        }

        try {
            await Booking.create({
                booking_date:    record.booking_date,
                start_time_slot: record.start_time_slot,
                start_time:      record.start_time,
                end_time_slot:   record.end_time_slot,
                end_time:        record.end_time,
                counselor_id:    record.counselor_id,
                booker_name:     record.booker_name,
                booker_type:     record.booker_type,
                booking_fee:     record.booking_fee,
                status:          record.status,
                user_id:         record.user_id,
                room_id:         record.room_id,
            });
            log('success', `已保存 ${label} 费用=¥${record.booking_fee}`);
            savedCount++;
        } catch (e) {
            log('error', `保存失败 ${label}: ${e.message}`);
            skippedCount++;
        }
    }

    log('info', `全部完成：保存 ${savedCount} 条，跳过 ${skippedCount} 条（含冲突与错误），解析异常 ${parseErrors} 处`);

    return res.json({
        success: true,
        message: `导入完成：共解析 ${recordList.length} 条，成功导入 ${savedCount} 条，跳过 ${skippedCount} 条`,
        sheetName,
        total:       recordList.length,
        saved:       savedCount,
        skipped:     skippedCount,
        parseErrors,
        logs,
    });

    } catch (fatalErr) {
        // 意外的未捕获错误 — 记录日志并返回 JSON（而不是让 Express 返回 HTML）
        console.error('[importController fatal]', fatalErr.stack || fatalErr.message);
        log('error', `意外错误: ${fatalErr.message}`);
        return res.status(500).json({
            success: false,
            message: `服务器内部错误: ${fatalErr.message}`,
            logs,
        });
    }
};
