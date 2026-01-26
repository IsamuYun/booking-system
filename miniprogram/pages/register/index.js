const request = require("../../utils/request");

Page({
  data: {
    name: '',
    phone: '',
    invitecode: '',
    loading: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  handleRegister() {
    const { name, phone, invite_code } = this.data;

    // 简单校验
    if (!name) {
      return wx.showToast({ title: '请填写姓名', icon: 'error' });
    }
    if (!invite_code) {
      return wx.showToast({ title: '请填写邀请码', icon: 'loading' });
    }
    if (phone.length !== 11) {
      return wx.showToast({ title: '手机号格式错误', icon: 'loading' });
    } 

    this.setData({ loading: true });

    // 1. 调用 wx.login 获取 code (为了注册时直接绑定微信)
    wx.login({
      success: async (res) => {
        if (res.code) {
          this.submitRegister(res.code);
        } else {
          // 哪怕微信登录失败，也可以尝试仅注册账号
          this.submitRegister(null);
        }
      },
      fail: () => {
        this.submitRegister(null);
      }
    });
  },

  async submitRegister(code) {
    const { name, phone, invite_code } = this.data;
    try {
      const res = await request.post('/register', {
        name,
        phone,
        invite_code,
        code // 传给后端绑定 OpenID
      });

      this.setData({ loading: false });

      if (res.success) {
        // --- 注册成功且登录 ---
        wx.setStorageSync('token', res.token);
        wx.setStorageSync('userInfo', res.user);
        wx.setStorageSync('userId', res.user.id);

        wx.showToast({ title: '欢迎加入!', icon: 'success' });

        // 跳转到首页
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/home/index' });
        }, 1500);
      }
    } catch (err) {
      this.setData({ loading: false });
      wx.showModal({
        title: '注册失败',
        content: err.data?.message || '请求错误',
        showCancel: false
      });
    }
  },

  goLogin() {
    wx.navigateBack(); // 返回登录页
  }
})