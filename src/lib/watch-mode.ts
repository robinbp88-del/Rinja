export type WatchMode =
  | "price"
  | "stock"
  | "text"
  | "image"
  | "any"
  | "custom"
  /** Fingerprint of page body text — no highlight needed. */
  | "page";

export type WatchFrequency = "5m" | "15m" | "1h" | "6h" | "1d";
