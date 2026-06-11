const { ROOMS } = require("../../utils/clinicData");

Page({
  data: {
    rooms: ROOMS,
  },

  openRoom(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/room-detail/index?id=${id}`,
    });
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/home/index",
    });
  },

  goAbout() {
    wx.redirectTo({
      url: "/pages/about/index",
    });
  },

  goChat() {
    wx.redirectTo({
      url: "/pages/chat/index",
    });
  },
});
