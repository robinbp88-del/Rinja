import { n as object, r as string, t as array } from "../_libs/zod.mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search.functions-DLyivlMH.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var InputSchema = object({ query: string().min(1).max(300) });
var ResultSchema = object({
	intent: string(),
	insight: string(),
	results: array(object({
		title: string(),
		source: string(),
		host: string(),
		url: string(),
		price: string().optional(),
		availability: string().optional(),
		country: string().optional(),
		meta: string().optional()
	}))
});
var VALID_INTENTS = /* @__PURE__ */ new Set([
	"product",
	"house",
	"job",
	"ticket",
	"travel",
	"price",
	"availability",
	"general"
]);
var VALID_AVAIL = /* @__PURE__ */ new Set([
	"in_stock",
	"out_of_stock",
	"limited",
	"unknown"
]);
function normIntent(s) {
	const v = s.toLowerCase().replace(/s$/, "");
	return VALID_INTENTS.has(v) ? v : "general";
}
function normAvail(s) {
	if (!s) return void 0;
	const v = s.toLowerCase().replace(/\s|-/g, "_");
	return VALID_AVAIL.has(v) ? v : "unknown";
}
var SYSTEM = `You are Rinja, an AI shopping and monitoring assistant.
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
var intelligentSearch_createServerFn_handler = createServerRpc({
	id: "a6345930b5e805ea3a6ea018619298134b5fe1b7d3830cb11ef5819f4bdcfc2a",
	name: "intelligentSearch",
	filename: "src/lib/search.functions.ts"
}, (opts) => intelligentSearch.__executeServer(opts));
var intelligentSearch = createServerFn({ method: "POST" }).inputValidator((input) => InputSchema.parse(input)).handler(intelligentSearch_createServerFn_handler, async ({ data }) => {
	const key = process.env.LOVABLE_API_KEY;
	if (!key) throw new Error("Missing LOVABLE_API_KEY");
	const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"Lovable-API-Key": key
		},
		body: JSON.stringify({
			model: "google/gemini-2.5-flash",
			messages: [{
				role: "system",
				content: SYSTEM
			}, {
				role: "user",
				content: `User query: ${data.query}\n\nReturn JSON now.`
			}],
			response_format: { type: "json_object" }
		})
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
	}
	const content = ((await res.json()).choices?.[0]?.message?.content ?? "").trim();
	const tryParse = (s) => {
		try {
			return JSON.parse(s);
		} catch {
			return null;
		}
	};
	const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
	let parsed = tryParse(cleaned);
	if (!parsed) {
		const m = cleaned.match(/\{[\s\S]*\}/);
		if (m) parsed = tryParse(m[0]);
	}
	if (!parsed) return {
		intent: "general",
		query: data.query,
		results: [],
		suggestions: [],
		insight: "I couldn't reach a clear answer just now. Try rephrasing."
	};
	const safe = ResultSchema.safeParse(parsed);
	if (!safe.success) return {
		intent: "general",
		query: data.query,
		results: [],
		suggestions: [],
		insight: "I couldn't parse the results. Try a more specific query."
	};
	const output = safe.data;
	const intent = normIntent(output.intent);
	const results = output.results.map((r, i) => ({
		id: `${r.host}-${i}`,
		intent,
		title: r.title,
		source: r.source,
		host: r.host,
		url: r.url,
		price: r.price,
		availability: normAvail(r.availability),
		country: r.country,
		meta: r.meta
	}));
	return {
		intent,
		query: data.query,
		results,
		suggestions: [],
		insight: output.insight
	};
});
//#endregion
export { intelligentSearch_createServerFn_handler };
