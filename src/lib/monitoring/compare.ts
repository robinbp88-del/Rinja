function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function extractPriceNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.replace(/\s/g, "").match(/[\d,.]+/);
  if (!match) return null;
  const raw = match[0].replace(/,/g, "");
  const num = parseFloat(raw);
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
  mode: string | null | undefined,
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
    case "any":
    case "custom":
    default:
      return normalizeText(prev) === normalizeText(curr);
  }
}

export function changeSummary(
  mode: string | null | undefined,
  oldValue: string | null,
  newValue: string,
): { title: string; body: string } {
  const label = mode === "price" ? "Price changed" : "Something changed";
  const body =
    mode === "price"
      ? `${oldValue ?? "—"} → ${newValue}`
      : `Was "${oldValue ?? "—"}", now "${newValue}"`;

  return { title: label, body };
}
