const axios = require('axios');

const CRISIS_WORDS = ['自杀', '轻生', '不想活', '伤害自己', '伤害别人', '结束生命', '活不下去'];

const SYSTEM_PROMPT = [
  '你是倾听心理诊所的小程序咨询助手。',
  '你只回答咨询室、预约、到访、收费、咨询准备等诊所相关问题。',
  '不要做心理诊断，不替代专业咨询师，不承诺预约成功。',
  '遇到自伤、轻生、伤害他人等紧急风险时，建议用户立即联系当地急救、警方或身边可信任的人。',
].join('\n');

function getAiTimeoutMs() {
  const timeout = Number(process.env.AI_CHAT_TIMEOUT_MS);
  if (!Number.isInteger(timeout) || timeout <= 0) {
    return 60000;
  }
  return timeout;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function hasAny(text, words) {
  return words.some(word => text.includes(word));
}

function buildLocalReply(message) {
  const text = normalizeText(message);

  if (hasAny(text, CRISIS_WORDS)) {
    return '如果你正在经历自伤、轻生或可能伤害他人的紧急风险，请先离开危险环境，并立刻联系当地急救电话、警方或身边可信任的人。这个助手不能替代危机干预。';
  }

  if (hasAny(text, ['预约', '预定', '订房', '订咨询室', '怎么约'])) {
    return '你可以先查看“咨询室”页面的房间与使用状况，再联系前台确认具体时间。小程序里的使用状况仅供参考，最终安排以前台确认为准。';
  }

  if (hasAny(text, ['空房', '空闲', '今天', '时间段', '可用'])) {
    return '房间详情页会显示近 15 天到未来 15 天的使用状况。绿色为空闲，橙色为已预约，灰色为休息或不可用。';
  }

  if (hasAny(text, ['收费', '费用', '价格', '多少钱', '计费'])) {
    return '费用通常按房间类型、咨询师类型和使用时长计算。咨询室与多功能室价格不同，具体金额请以前台确认为准。';
  }

  if (hasAny(text, ['地址', '在哪里', '怎么去', '导航'])) {
    return '诊所地址是上海市静安区武定路 327 号申银发展大厦 1 号楼 31 层 3101 室。你也可以在“关于”页面查看到访信息。';
  }

  if (hasAny(text, ['准备', '第一次', '咨询前', '注意'])) {
    return '第一次来访可以提前确认预约时间、咨询师和房间安排。到访时尽量预留路上时间，咨询内容不需要提前组织得很完整。';
  }

  if (hasAny(text, ['取消', '改期', '改时间'])) {
    return '如果需要取消或改期，请尽早联系前台处理。不同预约可能有不同确认规则，建议以前台回复为准。';
  }

  return '我可以帮你了解预约流程、房间使用状况、地址到访、收费方式和咨询前准备。你可以直接问：“今天有空房吗？”或“第一次咨询需要准备什么？”';
}

function buildMessages(message, history) {
  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
  const normalizedHistory = safeHistory
    .map(item => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: normalizeText(item.content || item.text),
    }))
    .filter(item => item.content);

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...normalizedHistory,
    { role: 'user', content: message },
  ];
}

async function requestExternalAi(message, history) {
  const endpoint = process.env.AI_CHAT_API_URL;
  const apiKey = process.env.AI_CHAT_API_KEY;
  const model = process.env.AI_CHAT_MODEL || 'default';

  if (!endpoint || !apiKey) {
    return null;
  }

  const response = await axios.post(
    endpoint,
    {
      model,
      messages: buildMessages(message, history),
      temperature: 0.4,
    },
    {
      timeout: getAiTimeoutMs(),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return normalizeText(
    response.data?.reply ||
    response.data?.content ||
    response.data?.choices?.[0]?.message?.content
  );
}

exports.chat = async (req, res) => {
  try {
    const message = normalizeText(req.body.message);

    if (!message) {
      return res.status(400).json({ message: '请输入问题' });
    }

    let reply = null;
    let source = 'local';

    try {
      reply = await requestExternalAi(message, req.body.messages);
      if (reply) {
        source = 'external';
      }
    } catch (error) {
      console.error('外部 AI 服务请求失败，使用本地回复:', error.message);
    }

    if (!reply) {
      reply = buildLocalReply(message);
    }

    res.json({
      success: true,
      data: {
        reply,
        source,
      },
    });
  } catch (error) {
    console.error('AI 助手回复失败:', error);
    res.status(500).json({ error: 'AI 助手回复失败' });
  }
};
