export const PICKER_SOURCE = "watchpage-picker" as const;
export const HOST_SOURCE = "watchpage-host" as const;

export type PickerSelection = {
  selector: string;
  tag: string;
  text: string;
  html: string;
};

export type PickerReadyPayload = {
  title?: string;
  url?: string;
};

export type PickerMessage =
  | { source: typeof PICKER_SOURCE; type: "ready"; payload?: PickerReadyPayload }
  | {
      source: typeof PICKER_SOURCE;
      type: "selected";
      payload: PickerSelection;
    }
  | {
      source: typeof PICKER_SOURCE;
      type: "revealed";
      payload?: { selector?: string };
    }
  | {
      source: typeof PICKER_SOURCE;
      type: "reveal-missing";
      payload?: { selector?: string };
    };

export type HostMessageType = "enable" | "disable" | "clear" | "mark" | "reveal";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Narrow unknown postMessage data to a picker protocol message. */
export function parsePickerMessage(data: unknown): PickerMessage | null {
  if (!isRecord(data) || data.source !== PICKER_SOURCE) return null;
  if (typeof data.type !== "string") return null;

  switch (data.type) {
    case "ready":
      return {
        source: PICKER_SOURCE,
        type: "ready",
        payload: isRecord(data.payload)
          ? (data.payload as PickerReadyPayload)
          : undefined,
      };
    case "selected":
      if (!isRecord(data.payload)) return null;
      if (
        typeof data.payload.selector !== "string" ||
        typeof data.payload.tag !== "string" ||
        typeof data.payload.text !== "string" ||
        typeof data.payload.html !== "string"
      ) {
        return null;
      }
      return {
        source: PICKER_SOURCE,
        type: "selected",
        payload: {
          selector: data.payload.selector,
          tag: data.payload.tag,
          text: data.payload.text,
          html: data.payload.html,
        },
      };
    case "revealed":
    case "reveal-missing":
      return {
        source: PICKER_SOURCE,
        type: data.type,
        payload: isRecord(data.payload)
          ? { selector: data.payload.selector as string | undefined }
          : undefined,
      };
    default:
      return null;
  }
}

/**
 * Prefer exact iframe window match; also accept same-origin / opaque-null
 * origins used by sandboxed proxy documents.
 */
export function isTrustedPickerEvent(
  event: MessageEvent,
  frame: Window | null | undefined,
): boolean {
  const fromFrame = Boolean(frame && event.source === frame);
  const fromProxyOrigin =
    event.origin === window.location.origin || event.origin === "null";
  return fromFrame || fromProxyOrigin;
}

export function postToPicker(
  frame: Window | null | undefined,
  type: HostMessageType,
  extra?: Record<string, unknown>,
) {
  frame?.postMessage(
    {
      source: HOST_SOURCE,
      type,
      ...extra,
    },
    "*",
  );
}
