import type { SearchIntent, SearchProvider, SearchResult, Availability } from "../types";

// Deterministic pseudo-random from a string so repeated queries look stable.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type Source = { name: string; host: string };

const SOURCES: Record<SearchIntent, Source[]> = {
  product: [
    { name: "Amazon", host: "amazon.com" },
    { name: "Best Buy", host: "bestbuy.com" },
    { name: "Newegg", host: "newegg.com" },
    { name: "Komplett", host: "komplett.no" },
  ],
  house: [
    { name: "Finn.no", host: "finn.no" },
    { name: "Hybel", host: "hybel.no" },
    { name: "Zillow", host: "zillow.com" },
  ],
  job: [
    { name: "LinkedIn", host: "linkedin.com" },
    { name: "Finn Jobb", host: "finn.no" },
    { name: "Indeed", host: "indeed.com" },
  ],
  ticket: [
    { name: "Ticketmaster", host: "ticketmaster.com" },
    { name: "Billettservice", host: "ticketmaster.no" },
    { name: "StubHub", host: "stubhub.com" },
  ],
  travel: [
    { name: "Booking.com", host: "booking.com" },
    { name: "Airbnb", host: "airbnb.com" },
    { name: "Skyscanner", host: "skyscanner.net" },
  ],
  price: [
    { name: "Amazon", host: "amazon.com" },
    { name: "Newegg", host: "newegg.com" },
    { name: "Komplett", host: "komplett.no" },
  ],
  availability: [
    { name: "Amazon", host: "amazon.com" },
    { name: "Best Buy", host: "bestbuy.com" },
    { name: "Nike", host: "nike.com" },
  ],
  general: [
    { name: "Google", host: "google.com" },
    { name: "Wikipedia", host: "wikipedia.org" },
  ],
  webpage: [],
};

function pickPrice(query: string, idx: number): string {
  const m = query.match(/\$?(\d{2,5})/);
  const base = m ? Number(m[1]) : 150 + (hash(query) % 1200);
  const delta = [0, -30, 50, -12, 25][idx % 5];
  return `$${(base + delta).toLocaleString()}`;
}

function pickAvailability(query: string, idx: number): Availability {
  const bag: Availability[] = ["in_stock", "in_stock", "limited", "out_of_stock", "in_stock"];
  return bag[(hash(query) + idx) % bag.length];
}

export const mockProvider: SearchProvider = {
  name: "mock",
  supports: () => true,
  async search(query, intent) {
    // Simulate network latency for a real "Searching…" moment.
    await new Promise((r) => setTimeout(r, 650));

    const sources = SOURCES[intent] ?? SOURCES.general;
    return sources.map<SearchResult>((s, i) => {
      const id = `${s.host}-${i}`;
      const base: SearchResult = {
        id,
        intent,
        title: query,
        source: s.name,
        host: s.host,
        url: `https://${s.host}/search?q=${encodeURIComponent(query)}`,
      };

      if (intent === "product" || intent === "price" || intent === "availability") {
        const avail = pickAvailability(query, i);
        return {
          ...base,
          price: avail === "out_of_stock" ? undefined : pickPrice(query, i),
          availability: avail,
          meta: avail === "limited" ? `${1 + (i % 3)} left` : undefined,
        };
      }

      if (intent === "house") {
        const cities = ["Bergen", "Oslo", "Trondheim", "Stavanger"];
        const beds = 1 + ((hash(query) + i) % 4);
        return {
          ...base,
          price: `$${(1500 + ((hash(query) + i * 220) % 3200)).toLocaleString()}/mo`,
          meta: `${cities[(hash(query) + i) % cities.length]} · ${beds} bd`,
          availability: "in_stock",
        };
      }

      if (intent === "ticket") {
        return {
          ...base,
          price: `$${(60 + ((hash(query) + i * 40) % 400)).toLocaleString()}`,
          meta: i === 1 ? "Sold out" : `${20 + ((hash(query) + i) % 300)} left`,
          availability: i === 1 ? "out_of_stock" : "limited",
        };
      }

      if (intent === "job") {
        const cities = ["Remote", "Oslo", "Bergen", "Copenhagen"];
        return {
          ...base,
          meta: `${cities[i % cities.length]} · Full-time`,
          availability: "in_stock",
        };
      }

      if (intent === "travel") {
        return {
          ...base,
          price: `$${(80 + ((hash(query) + i * 55) % 700)).toLocaleString()}`,
          meta: i === 0 ? "Direct" : `${1 + (i % 2)} stop`,
          availability: "in_stock",
        };
      }

      return base;
    });
  },
};
