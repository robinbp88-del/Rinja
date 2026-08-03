/** Normalize pasted URLs so "prisjakt.no/..." still works. */
export function normalizeWatchUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  // Strip wrapping quotes / angle brackets from copy-paste.
  value = value.replace(/^['"<]+/, "").replace(/['">]+$/, "").trim();

  if (!/^https?:\/\//i.test(value)) {
    if (/^[\w.-]+\.[a-z]{2,}([/:?].*)?$/i.test(value)) {
      value = `https://${value}`;
    } else {
      return null;
    }
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function looksLikeSiteHome(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.pathname === "/" || parsed.pathname === "") &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}
