// 真机调试需勾选"不校验合法域名"
const { BASE_URL } = require("./env");

function request(url, method = "GET", data = {}, options = {}) {
    const token = wx.getStorageSync('token');

    return new Promise((resolve, reject) => {
        wx.request({
            url: BASE_URL + url,
            method: method,
            data: data,
            timeout: options.timeout,
            header: {
                'Content-Type': 'application/json',
                // 如果有Token, 格式通常是“Bearer <token>”
                'Authorization': token ? `Bearer ${token}` : '',
            },
            success: (res) => {
                // 统一判断状态码
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                }
                else {
                    // 如果 Token 过期(401)，由调用页提示用户联系前台处理权限
                    if (!options.silent) {
                      wx.showToast({
                        title: "请求失败: " + (res.data.message || res.statusCode),
                        icon: "none"
                      })
                    }
                    reject(res.data);
                }
            },
            fail: (err) => {
              if (!options.silent) {
                wx.showToast({ title: "网络连接失败", icon: "none" });
              }
              reject(err);
            }
        });
    });    
}

module.exports = {
  BASE_URL,
  get: (url, data, options) => request(url, 'GET', data, options),
  post: (url, data, options) => request(url, 'POST', data, options),
  put: (url, data, options) => request(url, 'PUT', data, options),
  del: (url, data, options) => request(url, 'DELETE', data, options),
};
