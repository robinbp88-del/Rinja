import { describe, expect, it } from "vitest";
import { pageContainsText, scoreFetchedHtml } from "./extract";

describe("extract helpers", () => {
  it("finds visible text", () => {
    const html = "<html><body><p>Hello Shop</p></body></html>";
    expect(pageContainsText(html, "hello shop")).toBe(true);
    expect(pageContainsText(html, "missing")).toBe(false);
  });

  it("flags js shells", () => {
    const shell =
      "<html><body><div id=root></div>" +
      "<script></script><script></script><script></script></body></html>";
    expect(scoreFetchedHtml(shell)).toBe("js_shell");
  });

  it("flags empty html", () => {
    expect(scoreFetchedHtml("<html></html>")).toBe("empty_html");
  });
});
