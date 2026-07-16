import type { SearchIntent } from "./types";

export function isUrl(input: string): boolean {
  const s = input.trim();
  if (/^https?:\/\//i.test(s)) return true;
  // bare domains like "finn.no/foo"
  return /^[a-z0-9-]+(\.[a-z]{2,})+(\/|$)/i.test(s);
}

const RULES: Array<{ intent: SearchIntent; patterns: RegExp[] }> = [
  {
    intent: "house",
    patterns: [
      /\b(house|apartment|apartments|leilighet|hus|rental|rent|for sale|bolig|condo|studio)\b/i,
    ],
  },
  {
    intent: "job",
    patterns: [/\b(job|jobs|hiring|remote|salary|role|position|career)\b/i],
  },
  {
    intent: "ticket",
    patterns: [
      /\b(tickets?|concert|tour|festival|match|game|show)\b/i,
      /\b(coldplay|taylor swift|premier league|nba|champions league)\b/i,
    ],
  },
  {
    intent: "travel",
    patterns: [
      /\b(flight|flights|hotel|hotels|trip|from .+ to .+|airbnb|stay in)\b/i,
    ],
  },
  {
    intent: "availability",
    patterns: [/\b(in stock|available|restock|drop)\b/i],
  },
  {
    intent: "price",
    patterns: [/\b(under|below|less than|cheapest|price drop)\b.*\$?\d+/i],
  },
  {
    intent: "product",
    patterns: [
      /\b(rtx|gpu|iphone|macbook|nike|adidas|ps5|xbox|watch|camera|lens|monitor|keyboard|size \d+)\b/i,
      /\$?\d{2,5}\b/, // has a price-like number
    ],
  },
];

export function detectIntent(input: string): SearchIntent {
  if (isUrl(input)) return "webpage";
  for (const { intent, patterns } of RULES) {
    if (patterns.some((p) => p.test(input))) return intent;
  }
  return "general";
}
