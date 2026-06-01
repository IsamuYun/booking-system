const fs = require('fs');
const path = require('path');
const automator = require('miniprogram-automator');
const env = require('./env');

const STATE_FILE = path.join(__dirname, '.automator-state.json');

module.exports = async function globalSetup() {
  console.log('[global-setup] 启动微信开发者工具 automator...');
  console.log('  cliPath    :', env.cliPath);
  console.log('  projectPath:', env.projectPath);
  console.log('  port       :', env.port);

  const miniProgram = await automator.launch({
    cliPath: env.cliPath,
    projectPath: env.projectPath,
    port: env.port,
  });

  const wsEndpoint = miniProgram.wsEndpoint || `ws://127.0.0.1:${env.port}`;
  fs.writeFileSync(STATE_FILE, JSON.stringify({ wsEndpoint }));

  globalThis.__MINIPROGRAM__ = miniProgram;
  console.log('[global-setup] automator 已连接:', wsEndpoint);
};

module.exports.STATE_FILE = STATE_FILE;
