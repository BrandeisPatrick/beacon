import { COFFEE_SCHEMA } from './schemas.js';

export function buildBatchJsonl(shops) {
  const lines = [];

  for (const shop of shops) {
    const system = [
      "Use the web_search tool to find credible pages (official site, local press, blogs, Reddit).",
      "If parking, study-friendliness, or other aspects are unclear, answer 'unknown'.",
      "Do NOT scrape or summarize Google Maps/Yelp review pages; skip those sources.",
      "Return ONLY JSON matching the provided schema."
    ].join(" ");

    const user = `Analyze this coffee shop:\nName: ${shop.name}\nAddress: ${shop.address}${shop.city ? `, ${shop.city}` : ""}\n` +
                 `Perspectives: decoration, coffee, studySuitable, parking. Provide 2–3 short quotes in evidence and list source URLs.`;

    const body = {
      model: "gpt-4o-mini",
      // Enable web search (no crawler needed)
      tools: [{ type: "web_search" }],
      // Force strict JSON back
      response_format: { type: "json_schema", json_schema: COFFEE_SCHEMA },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      // Optional caps to control cost
      max_output_tokens: 400
    };

    lines.push(JSON.stringify({
      custom_id: `shop_${shop.place_id}`,
      method: "POST",
      url: "/v1/responses",
      body
    }));
  }

  return lines.join("\n") + "\n";
}