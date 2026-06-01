const fs = require('fs');
const path = require('path');

function loadDotenv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf-8');
  raw.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  });
}

loadDotenv();

const defaults = {
  WX_CLI_PATH: process.platform === 'darwin'
    ? '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
    : 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
  WX_PROJECT_PATH: path.resolve(__dirname, '..', '..'),
  WX_AUTOMATOR_PORT: '9420',
  API_BASE_URL: 'http://192.168.0.22:5100',
  TEST_PHONE: '13800000001',
  TEST_NAME: '自动化测试员',
  TEST_INVITE_CODE: 'TEST-INVITE-2026',
  TEST_ADMIN_PHONE: '13800000000',
};

for (const k of Object.keys(defaults)) {
  if (!process.env[k]) process.env[k] = defaults[k];
}

module.exports = {
  cliPath: process.env.WX_CLI_PATH,
  projectPath: process.env.WX_PROJECT_PATH,
  port: Number(process.env.WX_AUTOMATOR_PORT),
  apiBaseUrl: process.env.API_BASE_URL,
  testPhone: process.env.TEST_PHONE,
  testName: process.env.TEST_NAME,
  testInviteCode: process.env.TEST_INVITE_CODE,
  testAdminPhone: process.env.TEST_ADMIN_PHONE,
};
