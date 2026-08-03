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
    const normalizedHtml = html.replace(/\s+/g, " ");
    if (normalizedHtml.includes(needle)) return needle;
  }

  return null;
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
