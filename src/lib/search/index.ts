import { detectIntent, isUrl } from "./detect";
import { mockProvider } from "./providers/mock";
import type { SearchProvider, SearchResponse } from "./types";

export * from "./types";
export { detectIntent, isUrl };

// Registry — add real providers here later (SerpAPI, Tavily, Amazon, Finn.no…).
// runSearch picks the first provider that supports the detected intent.
const providers: SearchProvider[] = [mockProvider];

const SUGGESTION_BANK: Record<string, string[]> = {
  product: ["RTX 5090 under $1200", "MacBook Pro M4", "Sony WH-1000XM6"],
  house: ["Apartments in Oslo", "House in Bergen under $500k"],
  job: ["Remote React jobs", "Product designer Oslo"],
  ticket: ["Coldplay tickets", "Champions League final"],
  travel: ["Flights Oslo to Tokyo", "Hotels in Lisbon"],
  general: ["RTX 5090", "Nike Air Max 42", "House in Bergen"],
};

export async function runSearch(query: string): Promise<SearchResponse> {
  const q = query.trim();
  const intent = detectIntent(q);

  if (intent === "webpage") {
    return { intent, query: q, results: [], suggestions: [] };
  }

  const provider = providers.find((p) => p.supports(intent)) ?? providers[0];
  const results = await provider.search(q, intent);

  return {
    intent,
    query: q,
    results,
    suggestions: SUGGESTION_BANK[intent] ?? SUGGESTION_BANK.general,
  };
}
