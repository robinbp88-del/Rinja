import { describe, expect, it } from "vitest";
import { mintProxyTicket, safeEqualSecret, verifyProxyTicket } from "./proxy-ticket";
import { notificationDedupeKey } from "./monitoring/engine";
import { normalizeWatchUrl } from "./url-input";

describe("normalizeWatchUrl", () => {
  it("adds https when missing", () => {
    expect(normalizeWatchUrl("example.com/a")).toBe("https://example.com/a");
  });

  it("rejects garbage", () => {
    expect(normalizeWatchUrl("not a url")).toBeNull();
  });
});

describe("safeEqualSecret", () => {
  it("matches equal secrets", () => {
    expect(safeEqualSecret("cron-secret", "cron-secret")).toBe(true);
    expect(safeEqualSecret("a", "b")).toBe(false);
    expect(safeEqualSecret(null, "x")).toBe(false);
  });
});

describe("proxy tickets", () => {
  it("mints and verifies tickets", () => {
    process.env.PROXY_TICKET_SECRET = "test-proxy-secret-value";
    const ticket = mintProxyTicket("user-1234567890");
    expect(verifyProxyTicket(ticket).ok).toBe(true);
    expect(verifyProxyTicket("bad.ticket.value").ok).toBe(false);
  });

  it("rejects expired tickets", () => {
    process.env.PROXY_TICKET_SECRET = "test-proxy-secret-value";
    const ticket = mintProxyTicket("user-1234567890", Date.now() - 20 * 60 * 1000);
    expect(verifyProxyTicket(ticket).ok).toBe(false);
  });
});

describe("notification dedupe", () => {
  it("is stable for the same change", () => {
    const a = notificationDedupeKey("w1", "10", "11");
    const b = notificationDedupeKey("w1", "10", "11");
    const c = notificationDedupeKey("w1", "10", "12");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
