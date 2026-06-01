/**
 * 首页用例（pages/home/index）
 *
 * 覆盖首页内容结构：
 *   咨询室卡片 5 个
 *   基本信息 Section
 *   底部导航：首页 / 咨询室 / 关于
 */
const {
  reLaunch, seedAuth, restoreRequest,
} = require('../helpers/automator');
const { userToken, normalUser } = require('../helpers/fixtures');

describe('首页 - pages/home/index 内容结构', () => {
  beforeAll(async () => {
    await seedAuth({ token: userToken, user: normalUser });
  });

  afterAll(async () => {
    await restoreRequest().catch(() => {});
  });

  test('渲染咨询室卡片、基本信息与底部导航', async () => {
    const home = await reLaunch('/pages/home/index');
    await home.waitFor(300);

    const roomCards = await home.$$('.room-mini-card');
    expect(roomCards.length).toBe(5);

    const content = await (await home.$('.home-content')).text();
    expect(content).toContain('基本信息');
    expect(content).toContain('地址');
    expect(content).toContain('营业时间');
    expect(content).toContain('预约电话');

    const navText = await (await home.$('.bottom-nav')).text();
    expect(navText).toContain('首页');
    expect(navText).toContain('咨询室');
    expect(navText).toContain('关于');
  });
});
