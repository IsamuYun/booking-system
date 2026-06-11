const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const HOUR_SLOTS = Array.from({ length: 12 }, (_, index) => 9 + index);
const TODAY_INDEX = 15;

function mulberry32(seed) {
  let s = seed >>> 0;

  return function random() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getStateText(state) {
  if (state === "busy") return "已预约";
  if (state === "rest") return "休息";
  return "空闲";
}

function occupancy(day) {
  if (day.isRest) return 0;
  const busyCount = day.slots.filter((slot) => slot.state === "busy").length;
  return busyCount / day.slots.length;
}

function buildDay(offset, index) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);

  const dayIndex = Math.floor(date.getTime() / 86400000);
  const random = mulberry32(dayIndex + 7);
  const isRest = random() < 0.07;

  const slots = HOUR_SLOTS.map((hour) => {
    let state = "free";

    if (isRest) {
      state = "rest";
    } else {
      const busyRate = offset < 0 ? 0.52 : offset === 0 ? 0.45 : 0.34;
      state = random() < busyRate ? "busy" : "free";
    }

    return {
      hour,
      hourLabel: formatHour(hour),
      state,
      stateText: getStateText(state),
    };
  });

  const day = {
    index,
    offset,
    dateNum: date.getDate(),
    monthLabel: `${date.getMonth() + 1}月`,
    weekLabel: offset === 0 ? "今天" : `周${WEEKDAYS[date.getDay()]}`,
    dateLabel: `${date.getMonth() + 1}月${date.getDate()}日 · 周${WEEKDAYS[date.getDay()]}`,
    isRest,
    isPast: offset < 0,
    selected: index === TODAY_INDEX,
    slots,
  };

  const occ = occupancy(day);
  day.occupancyPercent = Math.round(occ * 100);
  day.occupancyWidth = `${Math.round(occ * 100)}%`;
  day.summary = day.isRest
    ? "全天休息"
    : `${day.offset < 0 ? "使用率" : "已约"} ${day.occupancyPercent}%`;

  return day;
}

function buildFallbackDays() {
  return Array.from({ length: 31 }, (_, index) => buildDay(index - TODAY_INDEX, index));
}

function normalizeDays(days) {
  const selectedIndex = days.findIndex((day) => day.is_today || day.offset === 0 || day.selected);
  const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return days.map((day, index) => ({
    ...day,
    index,
    selected: index === safeSelectedIndex,
  }));
}

Component({
  properties: {
    usageDays: {
      type: Array,
      value: [],
      observer(value) {
        this.applyDays(value);
      },
    },
  },

  data: {
    days: [],
    selectedDay: null,
    dayStripScrollLeft: 540,
    legendItems: [
      { state: "free", label: "空闲" },
      { state: "busy", label: "已预约" },
      { state: "rest", label: "休息" },
    ],
  },

  lifetimes: {
    attached() {
      this.applyDays(this.properties.usageDays);
    },
  },

  methods: {
    applyDays(usageDays) {
      const sourceDays = Array.isArray(usageDays) && usageDays.length > 0
        ? usageDays
        : buildFallbackDays();
      const days = normalizeDays(sourceDays);
      const selectedDay = days.find((day) => day.selected) || days[0];

      this.setData({
        days,
        selectedDay,
      });
    },

    selectDay(event) {
      const index = Number(event.currentTarget.dataset.index);
      const days = this.data.days.map((day) => ({
        ...day,
        selected: day.index === index,
      }));

      this.setData({
        days,
        selectedDay: days[index],
      });
    },
  },
});
