const request = require("../../utils/request");
const getToday = require("../../utils/util");

const TIME_STRING = ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', 
  '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '24:00'];


Page({

  /**
   * Page initial data
   */
  data: {
    // -- 预约日期 --
    date: '',
    // -- 中间列表数据 --
    booking_list: [],
    loading: false,
    // -- 底部表单数据 --
    room_list: [],
    // 咨询师相关
    counselor_list: [], // 全部的咨询师
    filtered_counselors: [],  // 筛选过的咨询师列表
    type_options: ['全部', '内部', '外部', '合作-漫漫', '合作-墨斯提'],
    type_idx: 0,            // 默认选中“全部”
    
    // 表单数据项索引
    sel_room_idx = 0,
    sel_counselor_idx = 0,
    sel_start_idx = 0,  // 默认8:00
    sel_end_idx = 2,    // 默认9:00
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad() {
    const today = getToday();
    this.setData({ date: today });
    
    this.initData();
  },

  // 1. 获取房间列表
  async fetchRooms() {
    this.setData({ loading: true });
    try {
      const date = this.data.date;
      const res = await request.get(`/rooms?booking_date=${date}`);
      this.setData({ room_list: res.data || [] });
    }
    catch (err) {
      console.error(err);
      wx.showToast({ title: "无法获取房间", icon: "none" });
    }
    finally {
      this.setData({ loading: false });
    }
  },

  // 获取咨询师
  async fetchCounselors() {
    try {
      const res = await request.get("/counselors");
      this.setData({ counselor_list: res.data || [] });
      this.setData({ filtered_counselors: counselor_list });
    }
    catch (err) {
      console.error(err);
    }
  },

  async initData() {
    try {
      this.fetchRooms();
      this.fetchCounselors();
      this.fetchDailyBookings();
    }
    catch (error) {
      console.error(error);
    }
  },

  async fetchDailyBookings() {
    this.setData({ loading: true });
    try {
      const res = await request.get(`/bookings/daily-grouped?date=${this.data.date}`);
      this.setData({ booking_list: res.data || [] });
    }
    catch (error) {
      console.error(error);
    }
    finally {
      this.setData({ loading: false });
    }
  },

  // 当日期变动时 - 刷新列表 - 
  onDateChange(e) {
    this.setData({ date: e.detail.value }, () => {
      this.fetchDailyBookings();
    });
  },

  // 底部Picker变更
  bindRoomChange(e) {
    this.setData({ sel_room_idx: parseInt(e.detail.value) });
  },
  bindStartChange(e) {
    const selected_start = parseInt(e.detail.value);
    const selected_end = selected_start + 2;
    this.setData({ 
      sel_start_idx: selected_start,
      sel_end_idx: selected_end
    });
  },
  bindEndChange(e) {
    this.setData({ sel_end_idx: parseInt(e.detail.value) });
  },
  bindCounselorChange(e) {
    this.setData({ sel_counselor_idx: parseInt(e.detail.value) });
  },

  // 咨询师类型切换 -> 过滤咨询师列表
  bindTypeChange(e) {
    const idx = parseInt(e.detail.value);
    const type_name = this.data.type_options[idx];
    const all = this.data.counselor_list;

    let filtered = [];
    if (type_name === '全部') {
      filtered = all;
    }
    else {
      filtered = all.filter(c => c.type === type_name);
    }

    this.setData({
      type_idx: idx,
      filtered_counselors: filtered,
      sel_counselor_idx: 0  // 重置选中项，防止越界
    });
  },

  // 提交预订
  async submitBooking() {
    const {
      date, sel_room_idx, sel_start_idx, sel_end_idx, room_list,
      filtered_counselors
    } = this.data;
    // 校验
    // 时间校验
    if (sel_start_idx >= sel_end_idx) {
      this.showMessage("结束时间必须晚于开始时间", "Error");
      return;
    }
    if (filtered_counselors.length === 0) {
      this.showMessage(`请选择咨询师`, "Error");
      return;
    }

    // 准备数据
    const start_time_slot = sel_start_idx + 16;
    const end_time_slot = sel_end_idx + 16;

    const payload = {
      room_id: room_list[sel_room_idx].id,
      counselor_id: filtered_counselors[sel_counselor_idx].id,
      booking_date: date,
      start_time_slot: start_time_slot,
      end_time_slot: end_time_slot
    };

    try {
      // 发送请求
      const res = await request.post("/booking", payload);

      // 成功处理
      //this.closeModal();
      this.showMessage("预订成功!");
    }
    catch (err) {
      const errMsg = err.data ? err.data.message : "预订失败";
      this.showMessage(errMsg, "Error");
    }
  },
  
  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  }
})