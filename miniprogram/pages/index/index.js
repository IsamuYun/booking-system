// index.js
const request = require('../../utils/request');

// 日期格式化工具 （YYYY-MM-DD)
const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
};

Page({
  data: {
    selectedDate: getToday(),   // 获取今天的日期
    roomList: [],               // 房间列表数据
    counselorList: [],          // 咨询师列表
    loading: false,

    // 消息提示条
    msgContent: "",             // 消息内容
    msgType: "",                // "Success" 或 "Error"

    // 弹窗与表单数据
    showModal: false,
    currentRoom: null,          // 当前选中的房间对象

    // 表单选中项的索引 (picker value)
    selectedCounselorIndex: 0,
    selectedStartIndex: 0,
    selectedEndIndex: 2,
  },
  
  onLoad() {
    this.fetchRooms();
    this.fetchCounselors();
  },

  onShow() {
    // 每次显示页面时，可以刷新一下房间状态
  },

  // 1. 获取房间列表
  async fetchRooms() {
    try {
      this.setData({ loading: true });
      const date = this.data.selectedDate;
      const res = await request.get(`/rooms?booking_date=${date}`);
      this.setData({ roomList: res.data || [] });
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
      this.setData({ counselorList: res.data || [] });
    }
    catch (err) {
      console.error(err);
    }
  },

  showMessage(content, type = "Success") {
    this.setData({ msgContent: content, msgType: type });
    setTimeout(() => {
      this.setData({ msgContent: '' });
    }, 3000);
  },

  // 日期改变
  onDateChange(e) {
    const new_date = e.detail.value;
    console.log("用户选择了新的日期: ", new_date);
    this.setData({
      selectedDate: new_date
    }, () => {
      console.log("向后端发起请求");
      this.fetchRooms();
    });
  },

  // 点击房间 -> 打开弹窗
  openBookingModal(e) {
    const room = e.currentTarget.dataset.room;
    this.setData({
      showModal: true,
      currentRoom: room,
      // 重置表单默认值
      //selectedStartIndex: 0,
      //selectedEndIndex: 1
    });
  },

  // 关闭弹窗
  closeModal() {
    this.setData({ showModal: false });
  },

  // 阻止冒泡 (防止点击弹窗内容时关闭弹窗)
  preventProp() {},

  // Picker 变更事件
  onCounselorChange(e) {
    this.setData({ selectedCounselorIndex: e.detail.value });
  },
  onStartChange(e) {
    const selectedStartIndex = parseInt(e.detail.value);
    const selectedEndIndex = selectedStartIndex + 2;
    
    this.setData({ 
      selectedStartIndex: selectedStartIndex,
      selectedEndIndex: selectedEndIndex,
    });
  },
  onEndChange(e) {
    const selectedEndIndex = parseInt(e.detail.value);
    this.setData({ selectedEndIndex: selectedEndIndex });
  },

  onTimeSelect(e) {
    // 获取用户点击的房间信息
    const room = e.currentTarget.dataset.room;
    let selectedStartIndex = 0;
    let selectedEndIndex = 2;
    if (room.available_slots.length === 0) {
      return;
    }
    if (room.available_slots.length < 2) {
      selectedEndIndex = 1;
    }
    
    this.setData({
      showModal: true,
      currentRoom: room,
      selectedStartIndex: selectedStartIndex,
      selectedEndIndex: selectedEndIndex,
    });
  },

  // 提交预订
  async submitBooking() {
    const { 
      selectedDate, currentRoom, counselorList,
      selectedCounselorIndex, selectedStartIndex, selectedEndIndex
    } = this.data;
    
    // 简单校验
    if (selectedStartIndex >= selectedEndIndex) {
      this.showMessage("结束时间必须晚于开始时间", "Error");
      return;
    }
    // 准备数据
    const startTime = currentRoom.available_slots[selectedStartIndex];
    const endTime = currentRoom.available_slots[selectedEndIndex];

    const payload = {
      room_id: currentRoom.id,
      counselor_id: counselorList[selectedCounselorIndex].id,
      booking_date: selectedDate,
      start_time_slot: startTime,
      end_time_slot: endTime
    };

    try {
      // 发送请求
      const res = await request.post("/booking", payload);

      // 成功处理
      this.closeModal();
      this.showMessage("预订成功!");
    }
    catch (err) {
      const errMsg = err.data ? err.data.message : "预订失败";
      this.showMessage(errMsg, "Error");
    }
  }
});

