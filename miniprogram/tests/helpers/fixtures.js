/**
 * 接口 mock 数据，用例不需要真实后端时使用。
 * 字段需与 controllers/*Controller.js 返回格式保持一致。
 */

const counselors = [
  { id: 1, name: '张老师', type: '内部', price: 200 },
  { id: 2, name: '李老师', type: '外部', price: 400 },
  { id: 3, name: '王老师', type: '合作', price: 300 },
];

const rooms = [
  {
    id: 1,
    name: '咨询室A',
    type: '咨询室',
    is_full: false,
    available_slots_text: ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30'],
  },
  {
    id: 2,
    name: '多功能室1',
    type: '多功能室',
    is_full: false,
    available_slots_text: ['14:00', '14:30', '15:00', '15:30'],
  },
  {
    id: 3,
    name: '咨询室B',
    type: '咨询室',
    is_full: true,
    available_slots_text: [],
  },
];

const myBookings = [
  {
    id: 101,
    booking_date: '2026-05-13',
    start_time: '10:00',
    end_time: '11:00',
    status: 'booked',
    Room: { name: '咨询室A' },
    Counselor: { name: '张老师' },
  },
  {
    id: 102,
    booking_date: '2026-05-14',
    start_time: '14:00',
    end_time: '15:00',
    status: 'completed',
    Room: { name: '多功能室1' },
    Counselor: { name: '李老师' },
  },
];

const recurringRules = [
  {
    id: 1,
    day_of_week: 1,
    dayStr: '周一',
    start_time: '09:00',
    end_time: '10:00',
    Counselor: { name: '张老师' },
    Room: { name: '咨询室A' },
  },
];

const adminToken = 'test-token-admin';
const userToken = 'test-token-user';
const adminUser = { id: 1, name: '管理员', phone: '13800000000', role: 'admin' };
const normalUser = { id: 2, name: '自动化测试员', phone: '13800000001', role: 'user' };

module.exports = {
  counselors,
  rooms,
  myBookings,
  recurringRules,
  adminToken,
  userToken,
  adminUser,
  normalUser,
};
