export const COFFEE_SCHEMA = {
  name: "CoffeeShopPerspective",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      decoration: { type: "integer", minimum: 1, maximum: 5 },
      coffee: { type: "integer", minimum: 1, maximum: 5 },
      studySuitable: { type: "integer", minimum: 1, maximum: 5 },
      parking: { type: "string", enum: ["free", "paid", "street", "none", "unknown"] },
      evidence: { type: "array", items: { type: "string" }, maxItems: 3 },
      sources_used: { type: "array", items: { type: "string" }, maxItems: 8 }
    },
    required: ["decoration", "coffee", "studySuitable", "parking", "evidence", "sources_used"]
  }
};