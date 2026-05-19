export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body || {};
    const text = String(body.text || body.utterance || "").trim();
    if (!text) {
      res.status(400).json({ error: "Missing text" });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL_FAST || process.env.OPENAI_MODEL || "gpt-5.4-mini";
    if (!apiKey) {
      // Safe fallback (no LLM): return a deterministic choice.
      res.status(200).json({
        themeKey: "lavender",
        backgroundKey: null,
        component: {
          role: "dot-schedule-2x2",
          variant: {
            date: "Today",
            items: [
              { text: "준비된 일정이 없습니다", tone: "muted" },
              { text: "새로운 하루를 시작해보세요", tone: "accent" }
            ],
          },
        },
      });
      return;
    }

    // IMPORTANT: pick ONLY from components that already exist in the project.
    // Goal: bias HARD toward Plan / Weather / Gallery (theme DOT set).
    // Do NOT invent new components. Do NOT return focus-block.
    const COMPONENTS = [
      // PLAN
      { role: "dot-schedule-2x2", note: "PLAN. Provide variant.date + variant.items(4)." },
      // WEATHER
      { role: "dot-weather-2x1-v1-1", note: "WEATHER. Provide variant.location + variant.weather (+ optional theme)." },
      // GALLERY
      { role: "dot-gallery-frame1", note: "GALLERY. Provide variant.labels (9 strings) and optional variant.img or imgs." },
      { role: "dot-gallery-img", note: "GALLERY (simple). Provide variant.img and optional activeIndex." },
    ];

    const system = [
      "You are a GenUI Context Engine for Persona 2.",
      "",
      "🔴 CRITICAL RULE: DO NOT simply match keywords to apps.",
      "🟢 MANDATORY FLOW: Inconvenience/Context Interpretation → UI Reconstruction.",
      "",
      "1. CONTEXT & PAIN POINT INTERPRETATION (FIRST STEP):",
      "   - Analyze the user's utterance to identify the specific 'Daily Inconvenience' or 'Life Scene'.",
      "   - Consider complex signals: What is the implied Time, Place, and Action?",
      "   - Example: 'I'm late!' -> Context: High stress, Time-critical. Pain point: Needs immediate next-step info, not a full calendar.",
      "",
      "2. DYNAMIC UI RECONSTRUCTION (SECOND STEP):",
      "   - Based on the interpretation, choose the most 'Proactive' component from the whitelist.",
      "   - Reconstruct the 'variant' content to directly address the identified pain point.",
      "   - The UI should feel like it was 'born' for this specific moment, not a template.",
      "",
      "3. EMOTIONAL RELATIONSHIP & FLOW:",
      "   - themeKey & backgroundKey must reflect the 'Mood' of the interpreted scene.",
      "   - Elegant appearance: High-contrast/Bold for urgency, Soft/Subtle for leisure.",
      "",
      "WHITELIST RULES:",
      "- PLAN (dot-schedule-2x2): Proactive next-step guidance.",
      "- WEATHER (dot-weather-2x1-v1-1): Environmental preparation and mood setting.",
      "- GALLERY (dot-gallery-frame1/img): Emotional connection and memory recall.",
      "",
      "component.role must be one of: " + COMPONENTS.map((c) => c.role).join(", "),
      "themeKey: lavender, purple, blue, mint, amber.",
      "backgroundKey: clear, cloudy, rain, snow, night.",
      "",
      "Return ONLY valid JSON (no markdown).",
    ].join("\n");

    const user = [
      "USER_REQUEST:",
      text,
      "",
      "WHITELIST:",
      JSON.stringify(COMPONENTS, null, 2),
    ].join("\n");

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!completion.ok) {
      const errTxt = await completion.text().catch(() => "");
      res.status(500).json({ error: "OpenAI request failed", details: errTxt.slice(0, 400) });
      return;
    }

    const data = await completion.json();
    const raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Try to salvage JSON substring.
      const m = String(raw || "").match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch (e2) {}
      }
    }

    if (!parsed || !parsed.component || !parsed.component.role) {
      res.status(200).json({
        themeKey: "lavender",
        backgroundKey: null,
        component: {
          role: "dot-schedule-2x2",
          variant: {
            date: "Today",
            items: [
              { text: "준비된 일정이 없습니다", tone: "muted" },
              { text: "새로운 하루를 시작해보세요", tone: "accent" }
            ],
          },
        },
      });
      return;
    }

    // Hard guard the whitelist
    const allow = new Set(COMPONENTS.map((c) => c.role));
    if (!allow.has(parsed.component.role)) {
      parsed.component.role = "dot-schedule-2x2";
      parsed.component.variant = {
        date: "Today",
        items: [
          { text: "일정 확인이 필요합니다", tone: "muted" },
          { text: "GenUI 분석 중...", tone: "accent" }
        ],
      };
    }

    const themeKey = ["lavender", "purple", "blue", "mint", "amber"].includes(parsed.themeKey)
      ? parsed.themeKey
      : "lavender";

    const backgroundKey = ["clear", "cloudy", "rain", "snow", "night"].includes(parsed.backgroundKey)
      ? parsed.backgroundKey
      : null;

    res.status(200).json({
      themeKey,
      backgroundKey,
      component: {
        role: parsed.component.role,
        variant: parsed.component.variant || {},
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Unknown error" });
  }
}

