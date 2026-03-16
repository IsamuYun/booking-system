// 真机调试需勾选"不校验合法域名"
const BASE_URL = "http://192.168.71.82:3000";
//const BASE_URL = "http://124.220.171.165:3000";
//const BASE_URL = "https://booking-system-211526-7-1393385077.sh.run.tcloudbase.com";

function request(url, method = "GET", data = {}) {
    const token = wx.getStorageSync('token');

    return new Promise((resolve, reject) => {
        wx.request({
            url: BASE_URL + url,
            method: method,
            data: data,
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
                    // 如果 Token 过期(401) 可以自动跳转登录页
                    wx.showToast({
                      title: "请求失败: " + (res.data.message || res.statusCode),
                      icon: "none"
                    })
                    reject(res.data);
                }
            },
            fail: (err) => {
              wx.showToast({ title: "网络连接失败", icon: "none" });  
              reject(err);
            }
        });
    });    
}

module.exports = {
  get: (url, data) => request(url, 'GET', data),
  post: (url, data) => request(url, 'POST', data),
  put: (url, data) => request(url, 'PUT', data),
  del: (url, data) => request(url, 'DELETE', data),
};
