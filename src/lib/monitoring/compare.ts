import type { WatchMode } from "../watch-mode";

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function extractPriceNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.replace(/\s/g, "").match(/[\d,.]+/);
  if (!match) return null;
  const token = match[0];
  const lastComma = token.lastIndexOf(",");
  const lastDot = token.lastIndexOf(".");
  let normalized = token;

  if (lastComma > lastDot) {
    // EU/NO: 1.234,56 or 19,99
    normalized = token.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // US/UK: 1,234.56 or 19.99
    normalized = token.replace(/,/g, "");
  } else if (lastComma !== -1) {
    // Only commas: treat last as decimal if 1–2 digits after
    const frac = token.length - lastComma - 1;
    normalized =
      frac > 0 && frac <= 2
        ? token.replace(/,/g, (m, i) => (i === lastComma ? "." : ""))
        : token.replace(/,/g, "");
  }

  const num = parseFloat(normalized);
  return Number.isNaN(num) ? null : num.toFixed(2);
}

function stockBucket(value: string | null | undefined): string {
  const text = normalizeText(value);
  if (!text) return "unknown";
  if (/(out of stock|sold out|utsolgt|unavailable|not available)/i.test(text)) {
    return "out";
  }
  if (/(in stock|available|på lager|add to cart|buy now)/i.test(text)) {
    return "in";
  }
  return text;
}

export function valuesEqual(
  previous: string | null | undefined,
  next: string | null | undefined,
  mode: WatchMode | string | null | undefined,
): boolean {
  const prev = previous ?? "";
  const curr = next ?? "";

  if (!curr && !prev) return true;

  switch (mode) {
    case "price": {
      const a = extractPriceNumber(prev);
      const b = extractPriceNumber(curr);
      if (a && b) return a === b;
      return normalizeText(prev) === normalizeText(curr);
    }
    case "stock":
      return stockBucket(prev) === stockBucket(curr);
    case "image":
      return normalizeText(prev) === normalizeText(curr);
    case "text":
      return normalizeText(prev) === normalizeText(curr);
    case "page":
      return prev === curr;
    case "any":
    case "custom":
    default:
      return normalizeText(prev) === normalizeText(curr);
  }
}

export function changeSummary(
  mode: WatchMode | string | null | undefined,
  oldValue: string | null,
  newValue: string,
): { title: string; body: string } {
  if (mode === "page") {
    return {
      title: "Page changed",
      body: "Something on the page looks different than before.",
    };
  }

  if (newValue === "Not found on page") {
    return {
      title: "Value missing",
      body: `Couldn't find "${oldValue ?? "—"}" on the page anymore.`,
    };
  }

  const label = mode === "price" ? "Price changed" : "Something changed";
  const body =
    mode === "price"
      ? `${oldValue ?? "—"} → ${newValue}`
      : `Was "${oldValue ?? "—"}", now "${newValue}"`;

  return { title: label, body };
}
