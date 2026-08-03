import type { PickerSelection } from "./picker-protocol";
import type { WatchMode } from "./watch-mode";

export type ElementKind = "price" | "stock" | "date" | "image" | "text";

export function detectKind(selection: PickerSelection | null): ElementKind {
  if (!selection) return "text";

  if (selection.tag === "img" || /<img\b/i.test(selection.html)) {
    return "image";
  }

  const text = selection.text.trim();

  if (!text) return "text";

  if (
    /([$€£¥₹]|\bkr\b|\bNOK\b|\bUSD\b|\bEUR\b|\bGBP\b)\s?\d/i.test(text)
  ) {
    return "price";
  }

  if (
    /^\s*[$€£¥₹]?\s?\d{1,3}([.,\s]\d{3})*([.,]\d{1,2})?\s?(kr|NOK|USD|EUR|GBP|\$|€|£)?\s*$/i.test(
      text,
    )
  ) {
    return "price";
  }

  if (
    /(in stock|out of stock|sold out|available|unavailable|på lager|utsolgt)/i.test(
      text,
    )
  ) {
    return "stock";
  }

  if (/\b(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\b/.test(text)) {
    return "date";
  }

  if (
    /\b(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(
      text,
    )
  ) {
    return "date";
  }

  return "text";
}

export function kindLabel(kind: ElementKind) {
  if (kind === "price") return "Price detected";
  if (kind === "stock") return "Stock detected";
  if (kind === "date") return "Date detected";
  if (kind === "image") return "Image detected";
  return "Element selected";
}

export function defaultModeFor(kind: ElementKind): WatchMode {
  if (kind === "price") return "price";
  if (kind === "stock") return "stock";
  if (kind === "image") return "image";
  return "any";
}

export function labelFor(kind: ElementKind, mode: WatchMode, text: string) {
  const trimmed = text.trim().slice(0, 40);

  if (mode === "price") return `Price · ${trimmed}`;
  if (mode === "stock") return "Stock availability";
  if (mode === "image") return "Image";
  if (mode === "text") return trimmed || "Text element";
  if (mode === "custom") return trimmed || `${kind} element`;

  return trimmed || "Any change";
}
