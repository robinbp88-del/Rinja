import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { MonitorError } from "./monitoring/errors";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

export const DEFAULT_TIMEOUT_MS = 12_000;
export const DEFAULT_MAX_BYTES = 2_000_000; // ~2 MB HTML

function isPrivateOrReservedIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (v === 6) {
    const x = ip.toLowerCase();
    return (
      x === "::1" ||
      x === "::" ||
      x.startsWith("fc") ||
      x.startsWith("fd") ||
      x.startsWith("fe80:") ||
      x.startsWith("ff")
    );
  }
  return true;
}

/** Reject non-public http(s) targets (SSRF guard). */
export async function assertSafeOutboundUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new MonitorError("dns", "Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new MonitorError("ssrf", "Only http(s) URLs are allowed");
  }
  if (url.username || url.password) {
    throw new MonitorError("ssrf", "URLs with credentials are not allowed");
  }

  const port = url.port;
  if (port && port !== "80" && port !== "443") {
    throw new MonitorError("ssrf", "Only ports 80 and 443 are allowed");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new MonitorError("ssrf", "That host is not allowed");
  }

  if (isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      throw new MonitorError(
        "ssrf",
        "Private or reserved IP addresses are not allowed",
      );
    }
  } else {
    let addrs: Array<{ address: string; family: number }>;
    try {
      addrs = await lookup(host, { all: true });
    } catch {
      throw new MonitorError("dns", "Could not resolve host");
    }
    if (!addrs.length) throw new MonitorError("dns", "Could not resolve host");
    for (const { address } of addrs) {
      if (isPrivateOrReservedIp(address)) {
        throw new MonitorError(
          "ssrf",
          "Host resolves to a private or reserved address",
        );
      }
    }
  }

  return url;
}

export type SafeFetchInit = RequestInit & {
  timeoutMs?: number;
};

/** Read response body with a hard byte cap. */
export async function readResponseTextLimited(
  response: Response,
  maxBytes = DEFAULT_MAX_BYTES,
): Promise<string> {
  const declared = Number(response.headers.get("content-length") ?? NaN);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new MonitorError("too_large", "Response too large");
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new MonitorError("too_large", "Response too large");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8").decode(merged);
}

/** Fetch with manual redirects; re-validate every hop; abort on timeout. */
export async function fetchSafeOutbound(
  raw: string,
  init?: SafeFetchInit,
  maxRedirects = 5,
): Promise<{ response: Response; finalUrl: string }> {
  let current = await assertSafeOutboundUrl(raw);
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { timeoutMs: _ignored, ...fetchInit } = init ?? {};

  for (let i = 0; i <= maxRedirects; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(current.href, {
        ...fetchInit,
        signal: fetchInit.signal ?? controller.signal,
        redirect: "manual",
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          ...(fetchInit.headers ?? {}),
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect without Location header");
        current = await assertSafeOutboundUrl(new URL(location, current).href);
        continue;
      }

      return { response, finalUrl: current.href };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new MonitorError("timeout", "Request timed out");
      }
      if (error instanceof MonitorError) throw error;
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new MonitorError("unknown", "Too many redirects");
}
