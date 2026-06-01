/* Data.jsx — placeholder clinic content (Simplified Chinese).
   Replace with the clinic's real copy, rooms and photos.
   Exports: CLINIC, ROOMS */

const CLINIC = {
  name: '倾听心理',
  enName: 'Lisening',
  tagline: '被听见，是改变的开始',
  intro: '倾听心理是一间专注于个体、家庭与青少年心理健康的咨询诊所。我们相信，真正的疗愈始于被认真倾听——在安全、温暖且不被评判的空间里，每个人都能慢慢理顺内心的声音。',
  philosophy: '我们不急于给出答案，而是陪伴你一起，听见那些尚未被说出口的情绪。',
  established: '2019',
  city: '上海 · 静安',
  address: '上海市静安区南京西路 1788 号 7 层',
  hours: '每日 09:00 – 21:00',
  phone: '021-6288 0000',
  stats: { rooms: 5, freeToday: 3, counselors: 12 },
  credentials: ['中国心理学会临床心理学注册系统', '二级/三级心理咨询师团队', '严格的督导与伦理体系'],
};

const ROOMS = [
  { id: 'jingshui', name: '静水室', en: 'Still Water', tint: 'green',
    desc: '临窗采光，配有单人躺椅与绿植，适合个体深度咨询。', cap: '1–2 人', area: '18㎡',
    tags: [['用途','个体咨询'], ['采光','自然光'], ['隔音','良好']], status: 'free' },
  { id: 'nuanyang', name: '暖阳室', en: 'Warm Sun', tint: 'clay',
    desc: '暖色木质空间，柔和灯光与地暖，适合长程心理咨询。', cap: '1–2 人', area: '20㎡',
    tags: [['用途','个体咨询'], ['氛围','暖光'], ['设施','地暖']], status: 'busy' },
  { id: 'muyu', name: '木语室', en: 'Whispering Wood', tint: 'green',
    desc: '环形沙发布局的家庭与伴侣咨询室，鼓励平等对话。', cap: '2–4 人', area: '26㎡',
    tags: [['用途','家庭/伴侣'], ['布局','环形'], ['采光','自然光']], status: 'free' },
  { id: 'shayou', name: '沙游室', en: 'Sandplay', tint: 'clay',
    desc: '沙盘游戏治疗室，配齐沙具与沙箱，适合儿童与青少年。', cap: '1–3 人', area: '22㎡',
    tags: [['用途','沙盘游戏'], ['人群','儿童青少年'], ['设施','沙具齐全']], status: 'rest' },
  { id: 'tuanti', name: '团体室', en: 'Circle', tint: 'green',
    desc: '团体辅导与工作坊空间，座椅可灵活布置。', cap: '6–12 人', area: '42㎡',
    tags: [['用途','团体辅导'], ['布局','灵活'], ['设施','投影']], status: 'free' },
];

Object.assign(window, { CLINIC, ROOMS });
