/**
 * Smoke 用例：验证 automator 能正常启动、reLaunch、读取页面数据。
 * 只要本用例通过，环境配置就是 OK 的。
 */
const { getMiniProgram, reLaunch, clearAuth } = require('../helpers/automator');

describe('Smoke - 环境与基础导航', () => {
  beforeAll(async () => {
    await clearAuth();
  });

  test('automator 已连接小程序', async () => {
    const mp = await getMiniProgram();
    expect(mp).toBeTruthy();
    expect(typeof mp.reLaunch).toBe('function');
  });

  test('能 reLaunch 到首页并读取页面 path', async () => {
    const page = await reLaunch('/pages/home/index');
    await page.waitFor(300);
    expect(page.path).toBe('pages/home/index');
  });

  test('首页含咨询室卡片与基本信息', async () => {
    const page = await reLaunch('/pages/home/index');
    await page.waitFor(300);
    const roomCards = await page.$$('.room-mini-card');
    expect(roomCards.length).toBe(5);

    const text = await page.$('.home-content').then(el => el.text());
    expect(text).toContain('基本信息');
  });

  test('咨询室列表页和详情页可渲染', async () => {
    const roomsPage = await reLaunch('/pages/rooms/index');
    await roomsPage.waitFor(300);
    expect(roomsPage.path).toBe('pages/rooms/index');

    const roomCards = await roomsPage.$$('.room-list-card');
    expect(roomCards.length).toBe(5);

    const detailPage = await reLaunch('/pages/room-detail/index?id=jingshui');
    await detailPage.waitFor(300);
    expect(detailPage.path).toBe('pages/room-detail/index');

    const detailText = await detailPage.$('.detail-page').then(el => el.text());
    expect(detailText).toContain('静水室');
    expect(detailText).toContain('咨询室使用状况');
  });

  test('关于页可渲染诊所信息', async () => {
    const aboutPage = await reLaunch('/pages/about/index');
    await aboutPage.waitFor(300);
    expect(aboutPage.path).toBe('pages/about/index');

    const text = await aboutPage.$('.about-content').then(el => el.text());
    expect(text).toContain('我们是谁');
    expect(text).toContain('资质与伦理');
    expect(text).toContain('到访与联系');
  });
});
