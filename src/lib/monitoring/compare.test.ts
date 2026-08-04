import { describe, expect, it } from "vitest";
import { changeSummary, extractPriceNumber, normalizeText, valuesEqual } from "./compare";

describe("normalizeText", () => {
  it("collapses whitespace around punctuation", () => {
    expect(normalizeText("Vaser (146)")).toBe(normalizeText("Vaser(146)"));
  });

  it("treats whitespace-only differences as equal for text mode", () => {
    expect(valuesEqual("Hello   world", "Hello world", "text")).toBe(true);
  });
});

describe("extractPriceNumber", () => {
  it("merges EU thousands and decimals", () => {
    expect(extractPriceNumber("1.234,56 kr")).toBe("1234.56");
  });

  it("merges US thousands and decimals", () => {
    expect(extractPriceNumber("$1,234.56")).toBe("1234.56");
  });

  it("handles simple comma decimals", () => {
    expect(extractPriceNumber("19,99")).toBe("19.99");
  });
});

describe("valuesEqual", () => {
  it("compares prices by normalized number", () => {
    expect(valuesEqual("kr 199,00", "199.00", "price")).toBe(true);
    expect(valuesEqual("199", "249", "price")).toBe(false);
  });

  it("detects missing element text as a change", () => {
    expect(valuesEqual("In stock", "Not found on page", "text")).toBe(false);
  });

  it("page mode is exact fingerprint", () => {
    expect(valuesEqual("h1:10", "h1:10", "page")).toBe(true);
    expect(valuesEqual("h1:10", "h2:10", "page")).toBe(false);
  });
});

describe("changeSummary", () => {
  it("describes missing text", () => {
    const s = changeSummary("text", "Sale", "Not found on page");
    expect(s.title).toBe("Text missing");
  });
});
