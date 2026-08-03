import type { DatabaseWatch } from "./watches";

/** Short English line for what the watch is looking for (setup/success UI). */
export function watchConditionLabel(watch: DatabaseWatch): string {
  if (watch.mode === "page" || watch.element_tag === "page") {
    return "Any change on the page";
  }

  const isPaste =
    !watch.selector?.trim() && Boolean(watch.element_text?.trim());
  if (isPaste) {
    return "If this text leaves the page";
  }
  if (watch.mode === "text") {
    return "When the text changes";
  }

  switch (watch.mode) {
    case "price":
      return "When the price text changes";
    case "stock":
      return "When availability text changes";
    case "image":
      return "When the image changes";
    case "any":
      return "Any change";
    case "custom":
      return "Custom watch";
    default:
      return "When something changes";
  }
}
