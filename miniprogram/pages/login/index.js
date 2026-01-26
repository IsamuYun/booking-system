const request = require('../../utils/request');

Page({
  data: {
    phone: '',
    loading: false
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/register/index' });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  handleLogin() {
    const { phone } = this.data;
    if (!phone || phone.length !== 11) {
      return wx.showToast({ title: '请输入11位手机号', icon: 'none' });
    }

    this.setData({ loading: true });

    // 1. 获取微信临时登录凭证 Code
    wx.login({
      success: async (res) => {
        if (res.code) {
          this.submitToServer(phone, res.code);
        } else {
          this.setData({ loading: false });
          wx.showToast({ title: '微信登录失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '无法连接微信服务', icon: 'none' });
      }
    });
  },

  async submitToServer(phone, code) {
    try {
      // 2. 发送给后端
      const res = await request.post('/login', {
        phone: phone,
        code: code
      });

      this.setData({ loading: false });

      if (res.success && res.action === 'redirect_to_home') {
        // --- 登录成功 ---
        // 存储 Token 和用户信息
        wx.setStorageSync('token', res.token);
        wx.setStorageSync('userInfo', res.user); // 包含 role
        wx.setStorageSync('userId', res.user.id);

        wx.showToast({ title: '登录成功' });

        // 跳转到首页 (reLaunch 清除历史栈，防止回退到登录页)
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/home/index' });
        }, 100);

      } 
      else if (res.action === 'redirect_guest') {
        // --- 未找到记录 -> 访客页 ---
        wx.showModal({
          title: '未注册',
          content: '系统中未找到该手机号，将跳转至访客指引页面。',
          showCancel: false,
          success: () => {
            wx.navigateTo({ url: '/pages/guest/index' });
          }
        });
      }

    } catch (err) {
      this.setData({ loading: false });
      // request.js 通常会处理错误 toast，这里可以根据需要补充
      console.error(err);
    }
  }
});