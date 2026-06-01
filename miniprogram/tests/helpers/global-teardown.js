const fs = require('fs');
const { STATE_FILE } = require('./global-setup');

module.exports = async function globalTeardown() {
  const mp = globalThis.__MINIPROGRAM__;
  if (mp) {
    try {
      await mp.close();
      console.log('[global-teardown] automator 已关闭');
    } catch (e) {
      console.warn('[global-teardown] 关闭失败:', e.message);
    }
  }
  if (fs.existsSync(STATE_FILE)) {
    try { fs.unlinkSync(STATE_FILE); } catch (_) {}
  }
};
