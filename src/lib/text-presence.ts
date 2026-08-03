/**
 * Lightweight client-side check: is needle present in page HTML as visible-ish text?
 * Mirrors monitoring intent without pulling linkedom into the client bundle.
 */
export function htmlContainsVisibleText(html: string, needle: string): boolean {
  const n = needle.replace(/\s+/g, " ").trim().toLowerCase();
  if (!n) return false;

  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  return text.includes(n);
}
