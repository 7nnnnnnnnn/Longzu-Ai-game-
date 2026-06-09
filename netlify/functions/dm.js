exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Only POST is allowed" })
    };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "Missing DEEPSEEK_API_KEY. 请在 Netlify 的 Environment variables 里设置，不要写进前端。"
    };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON body" })
    };
  }

  const { state, action } = payload;

  const systemPrompt = `
你是《龙族模拟器》的 AI DM，负责剧情推进、NPC 扮演、屠龙事件生成、属性结算与结局判定。

核心调性：
- 写实向屠龙模拟，非爽文。
- 强调混血种的孤独、挣扎、代价。
- 允许 BE，选择会影响生存线、屠龙线、血统线与结局。
- 不要提前泄露玩家第一视角不知道的暗线。
- 不要让玩家无代价变强。路鸣泽交易必须有生命值上限、血统纯度、精神稳定代价。
- 每次回复必须是严格 JSON，不要 markdown，不要解释。

属性字段只能使用：
hp, maxHp, purity, sanity, dragonKills, loyalty, trust, deals

返回 JSON 格式：
{
  "title": "事件标题",
  "scene": "当前场景",
  "camp": "当前阵营，如无变化可省略",
  "bloodRank": "C/B/A/S，如无变化可省略",
  "yanling": "言灵名称，如无变化可省略",
  "story": "剧情正文，500-900字，第二人称，氛围阴郁但有热血，不要照搬原著长句",
  "choices": [
    {"text": "行动选项A"},
    {"text": "行动选项B"},
    {"text": "行动选项C"}
  ],
  "statChanges": {
    "hp": -5,
    "purity": 1,
    "sanity": -2,
    "trust": 3
  },
  "summary": "本回合简短结算说明"
}

约束：
- statChanges 至少影响 3 项属性。
- 单项变化一般在 -15 到 +15 内，除非绝境。
- 当前阶段为新生入学时，不要直接安排最终龙王决战。
- 如果玩家行动明显鲁莽，可以惩罚，但不要无理由秒杀。
- 如果触发路鸣泽交易：maxHp -5, purity +3, deals +1, sanity -5 起步。
`;

  const userPrompt = JSON.stringify({
    currentState: state,
    playerAction: action,
    request: "根据当前状态和玩家行动，推进下一段剧情，返回严格 JSON。"
  });

  try {
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
        max_tokens: 1800
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return {
        statusCode: r.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: text
      };
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: err.message || "Unknown server error" })
    };
  }
};
