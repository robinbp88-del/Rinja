import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SearchIntent, SearchResponse, SearchResult, Availability } from "./search/types";

const InputSchema = z.object({ query: z.string().min(1).max(300) });

const ResultSchema = z.object({
  intent: z.string(),
  insight: z.string(),
  results: z.array(
    z.object({
      title: z.string(),
      source: z.string(),
      host: z.string(),
      url: z.string(),
      price: z.string().optional(),
      availability: z.string().optional(),
      country: z.string().optional(),
      meta: z.string().optional(),
    }),
  ),
});

const VALID_INTENTS = new Set([
  "product","house","job","ticket","travel","price","availability","general",
]);
const VALID_AVAIL = new Set(["in_stock", "out_of_stock", "limited", "unknown"]);
function normIntent(s: string): SearchIntent {
  const v = s.toLowerCase().replace(/s$/, "");
  return (VALID_INTENTS.has(v) ? v : "general") as SearchIntent;
}
function normAvail(s?: string): Availability | undefined {
  if (!s) return undefined;
  const v = s.toLowerCase().replace(/\s|-/g, "_");
  return (VALID_AVAIL.has(v) ? v : "unknown") as Availability;
}

const SYSTEM = `You are Rinja, an AI shopping and monitoring assistant.
Given a user query, respond ONLY with a JSON object with this exact shape:
{
  "intent": one of "product" | "house" | "job" | "ticket" | "travel" | "price" | "availability" | "general",
  "insight": one short helpful sentence (max ~140 chars),
  "results": array of 4-6 objects with keys:
    { "title": string, "source": string (store/platform name), "host": string (domain like "amazon.com"),
      "url": string (real https URL that points to that store's search or listing page for the query — a search URL is fine),
      "price": optional string (e.g. "$1,199" or "12 990 NOK"),
      "availability": optional string one of "in_stock" | "out_of_stock" | "limited" | "unknown",
      "country": optional string (e.g. "US", "Norway", "UK"),
      "meta": optional short string (e.g. "Free shipping") }
}

Choose stores appropriate for the intent:
- product: Amazon, Best Buy, Newegg, Komplett, B&H
- house: Finn.no, Zillow, Rightmove
- job: LinkedIn, Indeed, Finn Jobb
- ticket: Ticketmaster, StubHub
- travel: Booking.com, Skyscanner, Airbnb

Never invent domains. Never chat. Never ask questions. Return ONLY the JSON object, no prose, no markdown, no code fences.`;

export const intelligentSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<SearchResponse> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `User query: ${data.query}\n\nReturn JSON now.` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = (json.choices?.[0]?.message?.content ?? "").trim();

    const tryParse = (s: string): unknown | null => {
      try { return JSON.parse(s); } catch { return null; }
    };
    const cleaned = content
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    let parsed = tryParse(cleaned);
    if (!parsed) {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = tryParse(m[0]);
    }

    if (!parsed) {
      // Graceful fallback — never crash the UI.
      return {
        intent: "general",
        query: data.query,
        results: [],
        suggestions: [],
        insight: "I couldn't reach a clear answer just now. Try rephrasing.",
      };
    }

    const safe = ResultSchema.safeParse(parsed);
    if (!safe.success) {
      return {
        intent: "general",
        query: data.query,
        results: [],
        suggestions: [],
        insight: "I couldn't parse the results. Try a more specific query.",
      };
    }
    const output = safe.data;
    const intent = normIntent(output.intent);

    const results: SearchResult[] = output.results.map((r, i) => ({
      id: `${r.host}-${i}`,
      intent,
      title: r.title,
      source: r.source,
      host: r.host,
      url: r.url,
      price: r.price,
      availability: normAvail(r.availability),
      country: r.country,
      meta: r.meta,
    }));

    return {
      intent,
      query: data.query,
      results,
      suggestions: [],
      insight: output.insight,
    };
  });

