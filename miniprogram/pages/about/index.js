const { CLINIC } = require("../../utils/clinicData");

Page({
  data: {
    clinic: Object.assign({}, CLINIC, {
      credentials: CLINIC.credentials.map((name, index) => ({
        name,
        last: index === CLINIC.credentials.length - 1,
      })),
    }),
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/home/index",
    });
  },

  goRooms() {
    wx.redirectTo({
      url: "/pages/rooms/index",
    });
  },

  goChat() {
    wx.redirectTo({
      url: "/pages/chat/index",
    });
  },

  navigateClinic() {
    wx.showToast({
      title: "导航信息待接入",
      icon: "none",
    });
  },

  callClinic() {
    wx.makePhoneCall({
      phoneNumber: CLINIC.phone.replace(/\D/g, ""),
      fail: () => {},
    });
  },
});
