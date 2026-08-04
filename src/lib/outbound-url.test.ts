import { describe, expect, it } from "vitest";
import { assertSafeOutboundUrl, isPrivateOrReservedIp } from "./outbound-url";
import { MonitorError } from "./monitoring/errors";

describe("isPrivateOrReservedIp", () => {
  it("blocks localhost and private ranges", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.5.1")).toBe(true);
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
  });

  it("blocks IPv6 loopback and ULA", () => {
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fc00::1")).toBe(true);
  });
});

describe("assertSafeOutboundUrl", () => {
  it("allows public https", async () => {
    const url = await assertSafeOutboundUrl("https://example.com/path");
    expect(url.hostname).toBe("example.com");
  });

  it("rejects non-http protocols", async () => {
    await expect(assertSafeOutboundUrl("file:///etc/passwd")).rejects.toBeInstanceOf(MonitorError);
  });

  it("rejects localhost hostnames", async () => {
    await expect(assertSafeOutboundUrl("http://localhost/admin")).rejects.toMatchObject({
      code: "ssrf",
    });
  });

  it("rejects literal private IPs", async () => {
    await expect(assertSafeOutboundUrl("http://127.0.0.1/")).rejects.toMatchObject({
      code: "ssrf",
    });
    await expect(
      assertSafeOutboundUrl("http://169.254.169.254/latest/meta-data/"),
    ).rejects.toMatchObject({ code: "ssrf" });
  });

  it("rejects credentials and odd ports", async () => {
    await expect(assertSafeOutboundUrl("https://user:pass@example.com/")).rejects.toMatchObject({
      code: "ssrf",
    });
    await expect(assertSafeOutboundUrl("https://example.com:8080/")).rejects.toMatchObject({
      code: "ssrf",
    });
  });
});
