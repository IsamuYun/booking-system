const { getRoomById } = require("../../utils/clinicData");
const request = require("../../utils/request");

const HOUR_START_SLOTS = Array.from({ length: 12 }, (_, index) => 18 + index * 2);

function getStateText(state) {
  if (state === "busy") return "已预约";
  if (state === "rest") return "休息";
  return "空闲";
}

function getTimeStringFromSlot(slot) {
  const hour = Math.floor(slot / 2);
  const minute = slot % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function getHourState(daySlots, startSlot) {
  const halfHourSlots = daySlots.filter((slot) => slot.slot === startSlot || slot.slot === startSlot + 1);

  if (halfHourSlots.some((slot) => slot.state === "busy")) {
    return "busy";
  }
  if (halfHourSlots.some((slot) => slot.state === "rest")) {
    return "rest";
  }
  return "free";
}

function normalizeUsageDay(day, index) {
  const sourceSlots = Array.isArray(day.slots) ? day.slots : [];
  const slots = HOUR_START_SLOTS.map((startSlot) => {
    const state = getHourState(sourceSlots, startSlot);
    const hour = Math.floor(startSlot / 2);

    return {
      hour,
      hourLabel: getTimeStringFromSlot(startSlot),
      state,
      stateText: getStateText(state),
    };
  });
  const isRest = day.is_rest || slots.every((slot) => slot.state === "rest");
  const busyCount = slots.filter((slot) => slot.state === "busy").length;
  const occupancyPercent = isRest ? 0 : Math.round((busyCount / slots.length) * 100);

  return {
    index,
    offset: day.offset,
    dateNum: day.date_num,
    monthLabel: day.month_label,
    weekLabel: day.week_label,
    dateLabel: day.date_label,
    isRest,
    isPast: day.is_past,
    isToday: day.is_today,
    selected: day.is_today || day.offset === 0,
    slots,
    occupancyPercent,
    occupancyWidth: `${occupancyPercent}%`,
    summary: isRest
      ? "全天休息"
      : `${day.offset < 0 ? "使用率" : "已约"} ${occupancyPercent}%`,
  };
}

function getRoomStatus(todayUsage) {
  if (!todayUsage) {
    return {};
  }

  if (todayUsage.is_rest) {
    return { status: "rest", statusText: "休息" };
  }
  if (todayUsage.is_full) {
    return { status: "busy", statusText: "已约满" };
  }
  if (todayUsage.occupancy_percent > 0) {
    return { status: "free", statusText: "部分空闲" };
  }
  return { status: "free", statusText: "空闲" };
}

Page({
  data: {
    room: null,
    usageDays: [],
    loadingUsage: false,
    usageError: "",
  },

  onLoad(options) {
    const room = getRoomById(options.id);

    this.setData({
      room,
    });

    this.fetchRoomUsage(room.id);
  },

  fetchRoomUsage(roomId) {
    this.setData({
      loadingUsage: true,
      usageError: "",
    });

    request.get(`/rooms/${roomId}/usage`)
      .then((res) => {
        const data = res.data || {};
        const usage = Array.isArray(data.usage) ? data.usage : [];
        const usageDays = usage.map(normalizeUsageDay);
        const todayUsage = usage.find((day) => day.is_today || day.offset === 0);

        this.setData({
          room: {
            ...this.data.room,
            dbRoom: data.room,
            ...getRoomStatus(todayUsage),
          },
          usageDays,
          loadingUsage: false,
        });
      })
      .catch((error) => {
        console.error("加载房间使用状况失败:", error);
        this.setData({
          loadingUsage: false,
          usageError: "使用状况暂时无法加载",
        });
      });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({
          url: "/pages/rooms/index",
        });
      },
    });
  },
});
