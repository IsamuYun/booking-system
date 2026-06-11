const request = require("../../utils/request");

const QUICK_PROMPTS = [
  { text: "今天有空房吗？" },
  { text: "怎么预约咨询室？" },
  { text: "第一次咨询需要准备什么？" },
  { text: "费用怎么计算？" },
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    text: "你好，我是倾听心理的智能咨询助手。你可以问我预约流程、房间使用状况、地址到访、收费方式和咨询前准备。",
    note: "紧急心理危机请立即联系当地急救或身边可信任的人。",
  },
];

const CRISIS_WORDS = ["自杀", "轻生", "不想活", "伤害自己", "伤害别人", "结束生命", "活不下去"];

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function buildFallbackReply(text) {
  if (hasAny(text, CRISIS_WORDS)) {
    return "如果你正在经历自伤、轻生或可能伤害他人的紧急风险，请立刻联系当地急救电话、警方或身边可信任的人。这个助手不能替代危机干预。";
  }

  if (hasAny(text, ["预约", "预定", "订房", "怎么约"])) {
    return "你可以先查看“咨询室”页面的房间与使用状况，再联系前台确认具体时间。小程序里的使用状况仅供参考，最终安排以前台确认为准。";
  }

  if (hasAny(text, ["空房", "空闲", "今天", "时间段", "可用"])) {
    return "房间详情页会显示近 15 天到未来 15 天的使用状况。绿色为空闲，橙色为已预约，灰色为休息或不可用。";
  }

  if (hasAny(text, ["收费", "费用", "价格", "多少钱", "计费"])) {
    return "费用通常按房间类型、咨询师类型和使用时长计算。咨询室与多功能室价格不同，具体金额请以前台确认为准。";
  }

  if (hasAny(text, ["地址", "在哪里", "怎么去", "导航"])) {
    return "诊所地址是上海市静安区武定路 327 号申银发展大厦 1 号楼 31 层 3101 室。你也可以在“关于”页面查看到访信息。";
  }

  return "我可以帮你了解预约流程、房间使用状况、地址到访、收费方式和咨询前准备。你可以换个方式继续问我。";
}

Page({
  data: {
    messages: INITIAL_MESSAGES,
    quickPrompts: QUICK_PROMPTS,
    inputValue: "",
    canSend: false,
    sending: false,
    scrollTarget: "message-1",
  },

  messageSeq: 1,

  onInput(event) {
    const value = event.detail.value || "";
    this.setData({
      inputValue: value,
      canSend: value.trim().length > 0,
    });
  },

  sendQuickPrompt(event) {
    const text = event.currentTarget.dataset.text;
    this.sendMessage(text);
  },

  sendCurrentMessage() {
    this.sendMessage(this.data.inputValue);
  },

  sendMessage(rawText) {
    const text = String(rawText || "").trim();
    if (!text || this.data.sending) return;

    const userMessage = this.createMessage("user", text);
    const messages = this.data.messages.concat(userMessage);

    this.setData({
      messages,
      inputValue: "",
      canSend: false,
      sending: true,
      scrollTarget: `message-${userMessage.id}`,
    });

    request.post("/ai/chat", {
      message: text,
      messages: messages.map((item) => ({
        role: item.role,
        content: item.text,
      })),
    }, { silent: true, timeout: 60000 }).then((res) => {
      const reply = res.data && res.data.reply ? res.data.reply : buildFallbackReply(text);
      const note = res.data && res.data.source === "external" ? "外部 AI 回复" : "本地兜底回复";
      this.appendAssistantMessage(reply, note);
    }).catch(() => {
      this.appendAssistantMessage(buildFallbackReply(text), "网络暂时不稳定，已使用本地回复。");
    });
  },

  createMessage(role, text, note = "") {
    this.messageSeq += 1;
    return {
      id: this.messageSeq,
      role,
      text,
      note,
    };
  },

  appendAssistantMessage(text, note = "") {
    const assistantMessage = this.createMessage("assistant", text, note);

    this.setData({
      messages: this.data.messages.concat(assistantMessage),
      sending: false,
      scrollTarget: `message-${assistantMessage.id}`,
    });
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/home/index",
    });
  },

  goRooms() {
    wx.redirectTo({
      url: "/pages/rooms/index",
    });
  },

  goAbout() {
    wx.redirectTo({
      url: "/pages/about/index",
    });
  },
});
