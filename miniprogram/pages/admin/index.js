// pages/admin/index.js
const request = require("../../utils/request");

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

Page({

  /**
   * Page initial data
   */
  data: {
    selectedDate: getToday(),
    bookingList: [], // 后端返回的列表
    loading: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    this.fetchSchedule();
  },

  goBack() {
    wx.navigateBack();
  },

  onDateChange(e) {
    this.setData({ selectedDate: e.detail.value }, () => {
      this.fetchSchedule();
    });
  },

  // 获取预约记录表
  async fetchSchedule() {
    this.setData({ loading: true });
    try {
      const res = await request.get(`/admin/schedule?date=${this.data.selectedDate}`);
      this.setData({ bookingList: res.data });
    }
    catch (err) {
      console.error(err);
    }
    finally {
      this.setData({ loading: false });
    }
  },

  // 操作：取消预订
  handleCancel(e) {
    const {id} = e.currentTarget.dataset;
    wx.showModal({
      title: "确认取消",
      content: "确定要删除这条预订记录吗？",
      success: async (res) => {
        if (res.confirm) {
          try {
            await request.post(`/admin/bookings/${id}`);
            wx.showToast({ title: "已取消" });
            this.fetchSchedule(); // 刷新
          }
          catch (err) {
            wx.showToast({title: "操作失败", icon: "none"});
          }
        }
      }
    })
  },

  closeModal() {
    this.setData({ showModal: false });
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