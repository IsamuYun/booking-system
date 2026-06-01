# 聆心预约 小程序自动化测试说明

本目录提供 **聆心预约** 微信小程序的端到端自动化测试方案。

> 关于工具选型：用户最初要求使用 Playwright，但 Playwright 仅支持标准浏览器内核（Chromium/Firefox/WebKit），
> **无法接入微信小程序运行时**。微信小程序的官方等价方案是 [`miniprogram-automator`](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quickstart.html)
> （由微信团队维护，直接驱动「微信开发者工具」内的模拟器）。本项目采用该方案。

---

## 1. 测试范围

测试针对 `miniprogram/` 下的页面与全局逻辑：

| 用例文件 | 对应页面 / 模块 | 覆盖点 |
|---|---|---|
| `cases/smoke.test.js` | 全局 + 首页 | automator 连通性、reLaunch、DOM 选择器 |
| `cases/home.test.js` | `pages/home/index` | 首页咨询室卡片、基本信息、底部导航 |

### 暂未覆盖（可后续补充）

- `pages/room-detail/index` —— 日历交互与详情布局

---

## 2. 环境要求

| 工具 | 版本 | 说明 |
|---|---|---|
| Node.js | ≥ 16 | 跑 Jest |
| 微信开发者工具 | Stable，**已开启服务端口** | 见下方"开启 CLI/自动化" |
| 项目本身 | 已可在开发者工具中编译运行 | `project.config.json` 中的 `appid` 须有效 |

### 开启微信开发者工具的「服务端口」

1. 打开微信开发者工具
2. **设置 → 安全设置 → 服务端口**：打开
3. 确认 CLI 路径（automator 会用它）：
   - macOS: `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
   - Windows: `C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`

> 第一次使用 CLI 时需要在开发者工具里登录微信。

---

## 3. 快速开始

```bash
cd miniprogram/tests

# 1. 安装依赖
npm install

# 2. 配置环境（按本机修改 CLI 路径等）
cp .env.example .env
$EDITOR .env

# 3. 跑所有用例
npm test

# 单独跑 smoke
npm run test:smoke
```

运行流程：

1. `globalSetup` 通过 automator 启动微信开发者工具 → 编译当前 `miniprogram/` 项目
2. Jest 顺序执行各 `*.test.js`（`--runInBand` 必须串行，automator 不支持并发）
3. `globalTeardown` 关闭开发者工具

---

## 4. 测试架构

```
tests/
├── package.json             ← 独立的 npm 包，不污染小程序源码
├── jest.config.js           ← Jest 配置：串行、120 s timeout、可选 junit reporter
├── .env.example             ← 环境变量模板
├── TESTING.md               ← 本文件
├── helpers/
│   ├── env.js               ← 读取 .env / 默认值
│   ├── global-setup.js      ← 启动 automator
│   ├── global-teardown.js   ← 关闭 automator
│   ├── automator.js         ← 工具函数：reLaunch / mockRequest / seedAuth / clearAuth
│   └── fixtures.js          ← 测试数据（房间 / 诊所展示数据）
└── cases/
    ├── smoke.test.js
    └── home.test.js
```

### 关键 helper API

- `reLaunch(url)` — 等价 `wx.reLaunch`，返回当前 Page 对象
- `seedAuth({ token, user })` — 直接写入 storage，跳过登录流程
- `clearAuth()` — 清空缓存鉴权态
- `mockRequest([{ match, statusCode?, data }])` — 用 `mockWxMethod('request')` 拦截网络请求，按 URL 子串匹配返回 mock 数据。`data` 也可以是 `function(options) => responseBody`，便于断言请求 payload
- `restoreRequest()` — 还原原生 `wx.request`
- `getStorage(key)` — 读取小程序 storage

### 为什么用 mock 而不是连真后端？

| 维度 | mock | 真实后端 |
|---|---|---|
| 速度 | 整套 < 1 min | 受 SQLite/网络影响，3–5 min |
| 可重复性 | 高 | 受数据库脏数据影响 |
| 错误注入 | 可造 401/4xx/5xx | 需手动构造冲突数据 |
| 覆盖广度 | 仅前端逻辑 | 端到端 |

当前用例全部走 mock。如需端到端集成测试，建议另起一套 `cases-integration/`，并通过 `npm run seed`（见 `server/`）准备数据。

---

## 5. 编写新用例

### 模板

```js
const {
  reLaunch, seedAuth, mockRequest, restoreRequest,
} = require('../helpers/automator');
const { userToken, normalUser } = require('../helpers/fixtures');

describe('页面 / 功能名', () => {
  beforeEach(async () => {
    await seedAuth({ token: userToken, user: normalUser });
  });
  afterEach(async () => { await restoreRequest().catch(() => {}); });

  test('描述具体行为', async () => {
    await mockRequest([
      { match: '/some/endpoint', data: { data: [] } },
    ]);
    const page = await reLaunch('/pages/xxx/index');
    await page.waitFor(400);

    const btn = await page.$('.your-selector');
    await btn.tap();
    await page.waitFor(300);

    expect(await page.data('someKey')).toBe('expected');
  });
});
```

### 选择器 / 操作要点

- `page.$(selector)` / `page.$$(selector)` — 类似 querySelector，**仅支持 class、tag、属性选择器**
- `el.tap()` — 触发 `bindtap`
- `el.trigger('input', { value })` — 触发 `bindinput`
- `page.data(key)` — 读 `Page.data` 字段
- `page.setData({...})` — 写 `Page.data`（绕过 UI 操作）
- `page.callMethod('methodName', ...args)` — 直接调 Page 方法，适合无法用 UI 操作触发的逻辑（如 `picker` 的 change 事件）
- 涉及 `wx.showModal` / `wx.showToast`：用 `mp.mockWxMethod('showModal', () => Promise.resolve({ confirm: true }))` 直接 mock

### 调试

- 单测调试：`npx jest cases/home.test.js -t "渲染咨询室卡片"`
- 看 `console.log`：用例里直接 `console.log`，Jest 会原样打印
- 看小程序内部 log：在 helper 里用 `mp.evaluate(() => console.log(...))`

---

## 6. CI 集成（参考）

automator 需要图形化开发者工具，因此 CI 通常跑在**有显示器的 macOS/Windows runner** 上。GitHub Actions 上跑 Linux runner 会失败（开发者工具没有 Linux 版）。

```yaml
# .github/workflows/miniprogram-e2e.yml
name: miniprogram-e2e
on: [pull_request]
jobs:
  e2e:
    runs-on: macos-latest   # 必须 macOS 或 Windows（自托管亦可）
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      # 安装并登录开发者工具的步骤需自托管 runner 完成
      - run: cd miniprogram/tests && npm ci && npm test
        env:
          WX_CLI_PATH: /Applications/wechatwebdevtools.app/Contents/MacOS/cli
          WX_PROJECT_PATH: ${{ github.workspace }}/miniprogram
```

可选：开启 `jest-junit` 后会在 `tests/reports/junit.xml` 生成 JUnit XML，便于 CI 平台展示用例结果。

---

## 7. 常见问题

**Q1. `Error: Fail to launch the IDE` / 端口被占用**

- 确认开发者工具「设置 → 安全设置 → 服务端口」已开启
- 关掉所有打开的开发者工具实例后重试
- 改用其他端口：`WX_AUTOMATOR_PORT=9421 npm test`

**Q2. `automator.launch` 卡在登录界面**

第一次跑前请手动打开一次开发者工具并扫码登录，automator 复用登录态。

**Q3. 提示「未关联 AppID」或「未配置 IDE」**

确认 `miniprogram/project.config.json` 中的 `appid` 是有效的小程序 AppID。测试 mock 了 `wx.login`，不要求真实公众号鉴权。

**Q4. `page.$('.some-class')` 返回 null**

- 该元素是否使用了 `wx:if` 条件渲染、当前条件是否成立
- 该元素是否在自定义组件内部 —— 需要 `page.getComponent(selector)` 而不是 `$`
- 选择器是否拼写错误（小程序 wxml 偶有 typo，如 `clas`/`calss`）

**Q5. 用例随机失败 / flaky**

- 增加 `page.waitFor(ms)` 等待异步渲染
- 优先使用 `page.callMethod` / `page.setData` 而不是依赖 UI 事件链
- 串行执行（`--runInBand`）已默认开启，请勿改为并发

**Q6. 想跑真实后端**

1. 启动 `server/`（`cd server && npm run dev`）
2. 修改 `miniprogram/utils/request.js` 的 `BASE_URL` 指向开发机
3. 用例中删除 `mockRequest(...)` 调用
4. 数据准备：`cd server && npm run seed`

---

## 8. 维护守则

- **新页面上线 → 至少补一条 smoke 用例**（reLaunch + 关键元素存在）
- **新接口 → 在 `fixtures.js` 增加 mock 数据，避免每个用例各写一份**
- **修复 bug → 先加用例复现，再修代码**
- WXML 中如发现属性拼写错误（`clas` / `calss` 等），修复源码而非用例
- 用例文件保持 < 200 行；超过则按场景拆分
