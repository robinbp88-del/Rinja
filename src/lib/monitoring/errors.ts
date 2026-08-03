export type MonitorErrorCode =
  | "dns"
  | "timeout"
  | "too_large"
  | "ssrf"
  | "http_403"
  | "http_429"
  | "http_other"
  | "blocked"
  | "empty_html"
  | "js_shell"
  | "unsupported"
  | "extract"
  | "selector_missing"
  | "db"
  | "unknown";

export class MonitorError extends Error {
  readonly code: MonitorErrorCode;

  constructor(code: MonitorErrorCode, message: string) {
    super(message);
    this.name = "MonitorError";
    this.code = code;
  }
}

export function toMonitorError(error: unknown): MonitorError {
  if (error instanceof MonitorError) return error;

  const message =
    error instanceof Error ? error.message : "Check failed";
  const lower = message.toLowerCase();

  if (lower.includes("timed out") || lower.includes("aborted")) {
    return new MonitorError("timeout", message);
  }
  if (lower.includes("too large")) {
    return new MonitorError("too_large", message);
  }
  if (
    lower.includes("could not resolve") ||
    lower.includes("enotfound") ||
    lower.includes("getaddrinfo")
  ) {
    return new MonitorError("dns", message);
  }
  if (
    lower.includes("not allowed") ||
    lower.includes("private") ||
    lower.includes("reserved")
  ) {
    return new MonitorError("ssrf", message);
  }

  const http = message.match(/HTTP\s+(\d{3})/i);
  if (http) {
    const status = Number(http[1]);
    if (status === 403) return new MonitorError("http_403", message);
    if (status === 429) return new MonitorError("http_429", message);
    if (status === 401 || status === 407) {
      return new MonitorError("blocked", message);
    }
    return new MonitorError("http_other", message);
  }

  return new MonitorError("unknown", message);
}

export function userFacingError(code: MonitorErrorCode, message: string): string {
  switch (code) {
    case "timeout":
      return "The site took too long to respond.";
    case "dns":
      return "Could not find that website (DNS).";
    case "too_large":
      return "The page is too large to check.";
    case "http_403":
      return "The site blocked the check (403).";
    case "http_429":
      return "The site rate-limited the check (429).";
    case "blocked":
      return "The site blocked automated checks.";
    case "empty_html":
      return "The page HTML was empty or unusable.";
    case "js_shell":
      return "This page needs JavaScript — plain fetch can’t see the content.";
    case "unsupported":
      return "This page type isn’t supported yet.";
    case "selector_missing":
      return "The watched element is no longer on the page.";
    case "extract":
      return "Couldn’t extract a value from the page.";
    case "ssrf":
      return "That URL isn’t allowed.";
    case "db":
      return "Database error while saving the check.";
    default:
      return message || "Check failed.";
  }
}
