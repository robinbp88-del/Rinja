/** Home-screen app icon badge (Badging API). Best on installed PWA / Android Chrome. */

export function badgeSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.setAppBadge === "function" &&
    typeof navigator.clearAppBadge === "function"
  );
}

export async function syncAppBadge(count: number): Promise<void> {
  if (!badgeSupported()) return;

  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
  } catch {
    // Unsupported / permission quirks — ignore.
  }

  // Keep SW in sync when it also owns badge state.
  try {
    const reg = await navigator.serviceWorker?.ready;
    reg?.active?.postMessage({ type: "SET_BADGE", count: Math.max(0, count) });
  } catch {
    // ignore
  }
}

export async function clearAppBadge(): Promise<void> {
  await syncAppBadge(0);
}
