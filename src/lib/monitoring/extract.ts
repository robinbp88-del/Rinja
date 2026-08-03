import { parseHTML } from "linkedom";
import {
  fetchSafeOutbound,
  readResponseTextLimited,
} from "../outbound-url";

export function extractValue(
  html: string,
  selector: string | null,
  fallbackText: string | null,
): string | null {
  const { document } = parseHTML(html);

  if (selector?.trim()) {
    try {
      const el = document.querySelector(selector.trim());
      if (el) {
        const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        if (text) return text.slice(0, 500);
        if (el.tagName === "IMG") {
          return (el as HTMLImageElement).src || null;
        }
        const img = el.querySelector("img");
        if (img?.src) return img.src;
      }
    } catch {
      // Invalid selector — fall through to text search.
    }
  }

  if (fallbackText?.trim()) {
    const needle = fallbackText.trim().slice(0, 120);
    if (pageContainsText(html, needle)) return needle;
  }

  return null;
}

/** Stable-ish fingerprint of visible page text for whole-page watches. */
export function pageFingerprint(html: string): string {
  const { document } = parseHTML(html);
  const text = (document.body?.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);

  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }

  return `h${(hash >>> 0).toString(16)}:${text.length}`;
}

export function pageContainsText(html: string, needle: string): boolean {
  const n = needle.replace(/\s+/g, " ").trim();
  if (!n) return false;
  const haystack = html.replace(/\s+/g, " ");
  return haystack.includes(n);
}

export async function fetchPageHtml(url: string): Promise<string> {
  const { response } = await fetchSafeOutbound(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error(`Unsupported content type for ${url}: ${contentType}`);
  }

  return readResponseTextLimited(response);
}
