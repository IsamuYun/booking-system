// pages/admin/index.js
const request = require("../../utils/request");

const BASE_URL = "http://192.168.0.22:3000";

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  let month = now.getMonth() + 1;
  return `${year}-${month < 10 ? '0' + month : month}`;
}

Page({

  /**
   * Page initial data
   */
  data: {
    exportMonth: getCurrentMonth(),
    loading: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
  },

  goBack() {
    wx.navigateBack();
  },

  // 选择月份
  onExportMonthChange(e) {
    this.setData({ exportMonth: e.detail.value });
  },

  // 执行下载
  handleExport() {
    const month = this.data.exportMonth;
    const token = wx.getStorageSync('token'); // 获取Token用于鉴权
    wx.showLoading({title: '生成文件中...'});
    wx.downloadFile({
      url: BASE_URL + `/admin/report?month=${month}`,
      header: {
        "Authorization": `Bearer ${token}`  // 如果后端开启JWT验证，就必须带上
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          // 下载成功，打开文件
          const filePath = res.tempFilePath;
          wx.openDocument({
            filePath: filePath,
            showMenu: true, // 关键：显示右上角菜单
            fileType: 'xlsx',
            success: function () {
              console.log("打开文档成功");
            },
            fail: function(err) {
              wx.showToast({ title: "无法打开文件", icon: "none" });
            }
          });
        }
        else {
          wx.showToast({ title: "导出失败", icon: "none"});
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.log(err);
        wx.showToast({ title: "网络请求失败", icon: "none"});
      }
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