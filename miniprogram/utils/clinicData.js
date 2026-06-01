const CLINIC = {
  name: "聆心心理 STUDIO",
  enName: "Lisen Group Studio",
  tagline: "存在 · 即被感知",
  intro: "倾听心理是一间专注于个体、家庭与青少年心理健康的咨询诊所。我们相信，真正的疗愈始于被认真倾听，在安全、温暖且不被评判的空间里，每个人都能慢慢理顺内心的声音。",
  philosophy: "我们不急于给出答案，而是陪伴你一起，听见那些尚未被说出口的情绪。",
  established: "2019",
  city: "上海 · 静安",
  address: "上海市静安区武定路 327 号 申银发展大厦 1 号楼 31 层 3101 室",
  shortAddress: "静安 · 申银发展大厦1号楼31层",
  hours: "每日 09:00–21:00",
  phone: "(86)150-0184-0884",
  stats: {
    rooms: 5,
    freeToday: 3,
    counselors: 12,
  },
  credentials: [
    "中国心理学会临床心理学注册系统",
    "二级/三级心理咨询师团队",
    "严格的督导与伦理体系",
  ],
};

const ROOMS = [
  {
    id: "1",
    name: "咨询室一",
    en: "Still Water",
    image: "/images/counselling-room-1.png",
    desc: "私密简洁，适合成人个体心理咨询",
    cap: "1–2 人",
    area: "18㎡",
    tags: [
      { label: "用途", value: "个体咨询", icon: "heart" },
      { label: "氛围", value: "私密简洁", icon: "sun" },
      { label: "价格", value: "90元/小时", icon: "ear" },
    ],
    status: "free",
    statusText: "空闲",
  },
  {
    id: "2",
    name: "咨询室二",
    en: "Warm Sun",
    image: "/images/counselling-room-2.png",
    desc: "大气简约，适合成人个体心理咨询、伴侣/家庭咨询",
    cap: "1–4 人",
    area: "20㎡",
    tags: [
      { label: "用途", value: "个体/伴侣/家庭咨询", icon: "heart" },
      { label: "氛围", value: "大气简约", icon: "sun" },
      { label: "价格", value: "90元/小时", icon: "wind" },
    ],
    status: "busy",
    statusText: "已预约",
  },
  {
    id: "3",
    name: "咨询室三·沙盘室",
    en: "Whispering Wood",
    image: "/images/counselling-room-3.png",
    desc: "舒适温馨，适合儿童青少年咨询、成人个体心理咨询、伴侣/家庭咨询",
    cap: "1–4 人",
    area: "26㎡",
    tags: [
      { label: "用途", value: "儿童/青少年/伴侣/家庭", icon: "heart" },
      { label: "氛围", value: "舒适温馨", icon: "area" },
      { label: "价格", value: "90元/小时", icon: "sun" },
    ],
    status: "free",
    statusText: "空闲",
  },
  {
    id: "4",
    name: "团体多功能厅一·大沙盘",
    en: "Sandplay",
    image: "/images/multi-room-1.jpg",
    desc: "简约宽敞、采光好、私密安静，适合举办12人以内封闭式团体活动、读书会等",
    cap: "1–12 人",
    area: "30㎡",
    tags: [
      { label: "用途", value: "团体多功能", icon: "heart" },
      { label: "氛围", value: "简约宽敞、采光好、私密安静", icon: "sun" },
      { label: "设施", value: "沙具齐全", icon: "sand" },
      { label: "价格", value: "160元/小时", icon: "sand" },
    ],
    status: "free",
    statusText: "空闲",
  },
  {
    id: "5",
    name: "团体多功能厅二·大沙盘",
    en: "Circle",
    image: "/images/multi-room-2.jpg",
    desc: "简约宽敞、采光好、私密安静，适合举办8人以内封闭式团体活动、读书会等",
    cap: "1–8 人",
    area: "42㎡",
    tags: [
      { label: "用途", value: "团体多功能", icon: "users" },
      { label: "氛围", value: "简约宽敞、采光好、私密安静", icon: "sun" },
      { label: "设施", value: "沙具齐全", icon: "sand" },
      { label: "价格", value: "160元/小时", icon: "sand" },
    ],
    status: "free",
    statusText: "空闲",
  },
];

function getRoomById(id) {
  return ROOMS.find((room) => room.id === id) || ROOMS[0];
}

module.exports = {
  CLINIC,
  ROOMS,
  getRoomById,
};
