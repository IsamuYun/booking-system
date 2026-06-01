const { getRoomById } = require("../../utils/clinicData");

Page({
  data: {
    room: null,
  },

  onLoad(options) {
    this.setData({
      room: getRoomById(options.id),
    });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({
          url: "/pages/rooms/index",
        });
      },
    });
  },
});
