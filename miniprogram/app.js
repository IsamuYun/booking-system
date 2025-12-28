// app.js
const request = require("./utils/request");

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },

  login: function () {
    const _this = this;
    // 1. 微信的原生登录，
    wx.login({
      success: async res => {
        if (res.code) {
          try {
            console.log("获取到微信Code: " + res.code);
            // 2. 发送Code给后端
            const result = await request.post("/login", { code: res.code });
            console.log("后端登录成功: " + result);
            // 3. 保存Token到本地缓存
            // result.token
            if (result.token) {
              wx.getStorageSync("token", result.token);
              _this.globalData.isLoggedIn = true;
              if (result.user) {
                _this.globalData.userInfo = result.user;
              }
            }
          }
          catch (error) {
            console.log("登录错误信息: " + error);
          }
        }
        else {
          console.log("登录失败: " + res.errMsg);
        }
      }
    });
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
  }
})
