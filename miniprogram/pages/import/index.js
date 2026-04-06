// pages/import/index.js

const BASE_URL = require('../../utils/request').BASE_URL;

Page({

  data: {
    filePath: '',
    fileName: '',
    uploading: false,
    resultMsg: '',
    resultSuccess: false,
  },

  onLoad(options) {
    //
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx'],
      success: (res) => {
        const file = res.tempFiles[0];
        if (!file.name.endsWith('.xlsx')) {
          wx.showToast({ title: '仅支持 .xlsx 格式', icon: 'none' });
          return;
        }
        this.setData({
          filePath: file.path,
          fileName: file.name,
          resultMsg: '',
          resultSuccess: false,
        });
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({ title: '选择文件失败', icon: 'none' });
        }
      },
    });
  },

  uploadFile() {
    if (!this.data.filePath) {
      wx.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }

    this.setData({ uploading: true, resultMsg: '', resultSuccess: false });

    const token = wx.getStorageSync('token');

    wx.uploadFile({
      url: BASE_URL + '/admin/import',
      filePath: this.data.filePath,
      name: 'file',
      header: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      success: (res) => {
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          this.setData({
            resultMsg: '服务器返回格式错误',
            resultSuccess: false,
          });
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300 && data.success) {
          this.setData({
            resultMsg: data.message,
            resultSuccess: true,
          });
        } else {
          this.setData({
            resultMsg: data.message || '导入失败',
            resultSuccess: false,
          });
        }
      },
      fail: () => {
        this.setData({
          resultMsg: '网络连接失败，请检查服务器',
          resultSuccess: false,
        });
      },
      complete: () => {
        this.setData({ uploading: false });
      },
    });
  },
});
