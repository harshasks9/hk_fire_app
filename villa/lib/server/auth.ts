import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A single shared password, optional.
 *
 * Set APP_PASSWORD and every API call needs the cookie this module issues;
 * leave it unset and the API is open, which is fine while the app is only
 * reachable by the people who know the address. There are no accounts —
 * "who" is chosen inside the app from the people list, the way it is on a
 * whiteboard in the site office, and the journal records that name.
 */
export const AUTH_COOKIE = "villa_auth";

export function locked(): boolean {
  return !!process.env.APP_PASSWORD;
}

function token(pw: string): string {
  return createHmac("sha256", "villa-fitout").update(pw).digest("hex");
}

export function tokenFor(password: string): string | null {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return null;
  const a = Buffer.from(token(password));
  const b = Buffer.from(token(pw));
  return a.length === b.length && timingSafeEqual(a, b) ? token(pw) : null;
}

export function authorised(req: Request): boolean {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return true;
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([a-f0-9]+)`));
  if (!m) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(token(pw));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unauthorised(): Response {
  return Response.json({ error: "locked" }, { status: 401 });
}
