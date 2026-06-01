const fs = require('fs');
const path = require('path');
const automator = require('miniprogram-automator');
const env = require('./env');

const STATE_FILE = path.join(__dirname, '.automator-state.json');

let connected = null;

async function getMiniProgram() {
  if (globalThis.__MINIPROGRAM__) return globalThis.__MINIPROGRAM__;
  if (connected) return connected;

  if (!fs.existsSync(STATE_FILE)) {
    throw new Error('automator 状态文件不存在，请确认 global-setup 已运行');
  }
  const { wsEndpoint } = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  connected = await automator.connect({ wsEndpoint });
  return connected;
}

async function reLaunch(url) {
  const mp = await getMiniProgram();
  return mp.reLaunch(url);
}

async function navigateTo(url) {
  const mp = await getMiniProgram();
  return mp.navigateTo(url);
}

async function currentPage() {
  const mp = await getMiniProgram();
  return mp.currentPage();
}

async function clearAuth() {
  const mp = await getMiniProgram();
  await mp.evaluate(() => {
    try {
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('userId');
    } catch (e) {}
    return true;
  });
}

async function seedAuth({ token, user }) {
  const mp = await getMiniProgram();
  await mp.evaluate((tk, u) => {
    wx.setStorageSync('token', tk);
    wx.setStorageSync('userInfo', u);
    wx.setStorageSync('userId', u.id);
    return true;
  }, token, user);
}

async function getStorage(key) {
  const mp = await getMiniProgram();
  return mp.evaluate((k) => wx.getStorageSync(k), key);
}

async function mockRequest(rules) {
  const mp = await getMiniProgram();
  await mp.mockWxMethod('request', function (options) {
    const url = options.url || '';
    for (const r of rules) {
      if (url.includes(r.match)) {
        const data = typeof r.data === 'function' ? r.data(options) : r.data;
        options.success && options.success({ statusCode: r.statusCode || 200, data });
        return;
      }
    }
    options.fail && options.fail({ errMsg: `mocked: no rule matched ${url}` });
  });
}

async function restoreRequest() {
  const mp = await getMiniProgram();
  await mp.restoreWxMethod('request');
}

module.exports = {
  env,
  getMiniProgram,
  reLaunch,
  navigateTo,
  currentPage,
  clearAuth,
  seedAuth,
  getStorage,
  mockRequest,
  restoreRequest,
};
