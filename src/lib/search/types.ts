// Search architecture types.
// The UI never talks to a specific provider — it consumes SearchResult[].
// New providers (SerpAPI, Tavily, Finn.no, Amazon, ...) plug in behind runSearch().

export type SearchIntent =
  | "product"
  | "house"
  | "job"
  | "ticket"
  | "travel"
  | "webpage"
  | "price"
  | "availability"
  | "general";

export type Availability = "in_stock" | "out_of_stock" | "limited" | "unknown";

export type SearchResult = {
  id: string;
  intent: SearchIntent;
  title: string;
  source: string;        // human name e.g. "Amazon"
  host: string;          // e.g. "amazon.com"
  url: string;
  image?: string;        // optional cover image URL
  price?: string;        // formatted, e.g. "$1,229"
  availability?: Availability;
  country?: string;      // ISO country label, e.g. "US" or "Norway"
  meta?: string;         // secondary line, e.g. "2 left" or "Bergen · 3 bd"
};

export type SearchResponse = {
  intent: SearchIntent;
  query: string;
  results: SearchResult[];
  suggestions: string[]; // shown on empty state
  insight?: string;      // one-sentence Rinja commentary
};

export interface SearchProvider {
  name: string;
  supports(intent: SearchIntent): boolean;
  search(query: string, intent: SearchIntent): Promise<SearchResult[]>;
}
