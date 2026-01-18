// pages/recurring/index.js
const request = require("../../utils/request");

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const TIMES = ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', 
  '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '24:00'];

Page({

  /**
   * Page initial data
   */
  data: {
    ruleList: [],
    counselorList: [],
    roomList: [],

    // 表单选择索引
    selDayIndex: 1,
    selStartIdx: 0,
    selEndIdx: 2,
    selCounselorIdx: 0,
    selRoomIdx: 0,

    days: DAYS,
    times: TIMES,
  },

  onLoad() {
    this.fetchInitData();
    this.fetchRules();
  },

  goBack() {
    wx.navigateTo({
      url: "/pages/home/index",
    });
  },

  async fetchInitData() {
    const cRes = await request.get('/counselors');
    const rRes = await request.get('/rooms');
    this.setData({
      counselorList: cRes.data || [],
      roomList: rRes.data || []
    });
  },

  async fetchRules() {
    const res = await request.get('/recurring/rules');
    // 把 0,1,2 转换成 '周日' 文字方便显示
    const list = (res.data || []).map(r => ({
      ...r,
      dayStr: DAYS[r.dayOfWeek]
    }));
    this.setData({ ruleList: list });
  },

  // --- 表单变更 ---
  bindDayChange(e) { this.setData({ selDayIndex: parseInt(e.detail.value) }); },
  bindStartChange(e) { 
    this.setData({ selStartIdx: parseInt(e.detail.value) });
    let end_idx = parseInt(e.detail.value) + 2;
    this.setData({ selEndIdx: end_idx });
  },

  bindEndChange(e) { this.setData({ selEndIdx: parseInt(e.detail.value) }); },
  bindCounselorChange(e) { this.setData({ selCounselorIdx: parseInt(e.detail.value) }); },
  bindRoomChange(e) { this.setData({ selRoomIdx: parseInt(e.detail.value) }); },

  // --- 添加规则 ---
  async addRule() {
    const { 
      selDayIndex, selStartIdx, selEndIdx, 
      selCounselorIdx, selRoomIdx, 
      times, counselorList, roomList 
    } = this.data;

    const start_slot = selStartIdx;
    const end_slot = selEndIdx;

    if (start_slot >= end_slot || end_slot <= start_slot + 1) return wx.showToast({title: '时间无效', icon:'none'});

    await request.post('/recurring/rules/add', {
      day_of_week: selDayIndex,
      start_time_slot: start_slot,
      start_time: times[start_slot],
      end_time_slot: end_slot,
      end_time: times[end_slot],
      counselor_id: counselorList[selCounselorIdx].id,
      room_id: roomList[selRoomIdx].id
    });

    wx.showToast({ title: '添加成功' });
    this.fetchRules();
  },

  // --- 删除规则 ---
  async deleteRule(e) {
    const id = e.currentTarget.dataset.id;
    console.log(id);
    await request.get(`/recurring/rules/delete/${id}`);
    this.fetchRules();
  },

  // --- 一键生成 ---
  async generate() {
    wx.showLoading({ title: '生成中...' });
    try {
      const res = await request.post('/recurring/generate', { days: 30 });
      wx.hideLoading();
      wx.showModal({
        title: '结果',
        content: res.message, // "新增了 X 条预订"
        showCancel: false
      });
    } catch (err) {
      wx.hideLoading();
    }
  }
});
