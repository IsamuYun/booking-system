// pages/my/index.js
const app = getApp();
const request = require("../../utils/request");

Page({

  /**
   * Page initial data
   */
  data: {
    userInfo: {}
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {

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
    this.setData({
      userInfo: app.globalData.userInfo || {},
    });
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

  },

  updateUserProfile() {
    // 微信新规: 必须用这种方式获取头像
    wx.getUserProfile({
      desc: "用于完善会员资料",
      success: async (res) => {
        const { nickName, avatarUrl } = res.userInfo;
        try {
          // 调用后端接口更新用户信息
          const updatedUser = await request.put('/users/profile', {
            nickname: nickName,
            avatar: avatarUrl
          });

          // 更新本地和全局数据
          this.setData({ userInfo: updatedUser });
          app.globalData.userInfo = updatedUser;

          wx.showToast({ title: "同步成功", icon: "success" });
        }
        catch (err) {
          console.error(err);
        }
      }
    });
  }
});
