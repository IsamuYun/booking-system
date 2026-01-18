// pages/home/index.js
Page({

  /**
   * Page initial data
   */
  data: {
    ani1: {},
    ani2: {},
    ani3: {},
  },

  // 跳转到预约页面 (原本的首页)
  goToBooking() {
    wx.navigateTo({
      url: "/pages/index/index",
    });
  },

  goToAdmin() {
    wx.navigateTo({
      url: "/pages/admin/index",
    });
  },

  // 跳转到我的预约
  goToMyBooking() {
    wx.navigateTo({
      url: "/pages/my/index",
    });
  },

  // 跳转到定期预约
  goToRecurring() {
    wx.navigateTo({
      url: "/pages/recurring/index",
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

  dealCards: function() {
    const gap = 100;
    const dest = [
      { x: -gap, y: -gap },
      { x: gap, y: -gap },
      { x: -gap, y: gap },
    ];

    let animation = () => wx.createAnimation({
      duration: 600,
      timingFunction: "ease-out",
    });

    let a1 = animation();
    a1.translate(-20, -100).opacity(1).step();
    this.setData({ ani1: a1.export() });

    setTimeout(() => { 
      let a2 = animation();
      a2.translate(-20, 100).opacity(1).step();
      this.setData({ ani2: a2.export() });

    }, 200);

    setTimeout(() => { 
      let a3 = animation();
      a3.translate(-20, 300).opacity(1).step();
      this.setData({ ani3: a3.export() });

    }, 200);

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