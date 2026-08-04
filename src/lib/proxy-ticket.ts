import { createHmac, timingSafeEqual } from "node:crypto";

const TICKET_TTL_MS = 15 * 60 * 1000;

function ticketSecret(): string | null {
  return (
    process.env.PROXY_TICKET_SECRET ||
    process.env.MONITOR_CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null
  );
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Short-lived ticket so /api/proxy is not anonymously open. */
export function mintProxyTicket(userId: string, now = Date.now()): string {
  const secret = ticketSecret();
  if (!secret) {
    throw new Error("Proxy ticket secret is not configured");
  }
  const exp = now + TICKET_TTL_MS;
  const payload = `${exp}.${userId}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyProxyTicket(
  ticket: string | null | undefined,
  now = Date.now(),
): { ok: true; userId: string } | { ok: false } {
  if (!ticket) return { ok: false };
  const secret = ticketSecret();
  if (!secret) return { ok: false };

  const parts = ticket.split(".");
  if (parts.length !== 3) return { ok: false };
  const [expRaw, userId, sig] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < now) return { ok: false };
  if (!userId || userId.length < 10 || userId.length > 80) return { ok: false };

  const payload = `${expRaw}.${userId}`;
  const expected = sign(payload, secret);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  } catch {
    return { ok: false };
  }

  return { ok: true, userId };
}

/** Constant-time string compare for secrets (pads to equal length). */
export function safeEqualSecret(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      // Still compare to avoid leaking length via early return timing alone.
      timingSafeEqual(a, a);
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const PROXY_COOKIE = "rinja_proxy";
