// pages/home/index.js
Page({

  /**
   * Page initial data
   */
  data: {

  },

  goToRooms() {
    wx.navigateTo({
      url: "/pages/rooms/index",
    });
  },

  goToAbout() {
    wx.navigateTo({
      url: "/pages/about/index",
    });
  },

  goToRoomDetail(event) {
    const id = event.currentTarget.dataset.id;

    wx.navigateTo({
      url: `/pages/room-detail/index?id=${id}`,
    });
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
    //this.dealCards();
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
