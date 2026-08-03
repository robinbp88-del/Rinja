import { parseHTML } from "linkedom";
import {
  fetchSafeOutbound,
  readResponseTextLimited,
} from "../outbound-url";
import { MonitorError } from "./errors";

/** Strip noisy nodes, then return collapsed body text used for monitoring. */
export function visiblePageText(html: string): string {
  const { document } = parseHTML(html);
  const root = document.documentElement ?? document.body;
  if (!root) return "";

  for (const el of root.querySelectorAll(
    "script, style, noscript, template, svg, iframe",
  )) {
    el.remove();
  }

  return (document.body?.textContent ?? root.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

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
      // Invalid selector — treat as missing (don't fake a match elsewhere).
    }
    // Selector was set but didn't resolve to a value. Falling back to "text
    // exists somewhere" caused silent false-unchanged; fail instead.
    return null;
  }

  if (fallbackText?.trim()) {
    const needle = fallbackText.trim().slice(0, 120);
    if (pageContainsText(html, needle)) return needle;
  }

  return null;
}

/** Stable-ish fingerprint of visible page text for whole-page watches. */
export function pageFingerprint(html: string): string {
  const text = visiblePageText(html).slice(0, 8000);

  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }

  return `h${(hash >>> 0).toString(16)}:${text.length}`;
}

/** Case-insensitive match against visible page text (not raw HTML/attrs). */
export function pageContainsText(html: string, needle: string): boolean {
  const n = needle.replace(/\s+/g, " ").trim().toLowerCase();
  if (!n) return false;
  const haystack = visiblePageText(html).toLowerCase();
  return haystack.includes(n);
}

/** Heuristic quality of fetched HTML for monitoring usefulness. */
export function scoreFetchedHtml(
  html: string,
): "ok" | "empty_html" | "js_shell" {
  const trimmed = html.replace(/\s+/g, " ").trim();
  if (trimmed.length < 40) return "empty_html";

  const text = visiblePageText(html);
  const scripts = (html.match(/<script\b/gi) ?? []).length;

  if (text.length < 80 && scripts >= 3) return "js_shell";
  if (text.length < 20) return "empty_html";

  return "ok";
}

export async function fetchPageHtml(url: string): Promise<string> {
  let response: Response;
  try {
    const fetched = await fetchSafeOutbound(url);
    response = fetched.response;
  } catch (error) {
    if (error instanceof MonitorError) throw error;
    const message = error instanceof Error ? error.message : "Fetch failed";
    if (message.toLowerCase().includes("timed out")) {
      throw new MonitorError("timeout", message);
    }
    if (
      message.toLowerCase().includes("could not resolve") ||
      message.toLowerCase().includes("enotfound")
    ) {
      throw new MonitorError("dns", message);
    }
    if (message.toLowerCase().includes("too large")) {
      throw new MonitorError("too_large", message);
    }
    if (
      message.toLowerCase().includes("not allowed") ||
      message.toLowerCase().includes("private")
    ) {
      throw new MonitorError("ssrf", message);
    }
    throw new MonitorError("unknown", message);
  }

  if (!response.ok) {
    const status = response.status;
    if (status === 403) {
      throw new MonitorError("http_403", `Failed to fetch ${url}: HTTP 403`);
    }
    if (status === 429) {
      throw new MonitorError("http_429", `Failed to fetch ${url}: HTTP 429`);
    }
    throw new MonitorError(
      "http_other",
      `Failed to fetch ${url}: HTTP ${status}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new MonitorError(
      "unsupported",
      `Unsupported content type for ${url}: ${contentType}`,
    );
  }

  try {
    return await readResponseTextLimited(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Read failed";
    if (message.toLowerCase().includes("too large")) {
      throw new MonitorError("too_large", message);
    }
    throw new MonitorError("unknown", message);
  }
}
