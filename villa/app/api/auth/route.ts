import { AUTH_COOKIE, authorised, locked, tokenFor } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return Response.json({ locked: locked(), ok: authorised(req) });
}

/** Exchange the shared password for a cookie. */
export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string };
  const t = password ? tokenFor(password) : null;
  if (!t) return Response.json({ ok: false }, { status: 401 });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": `${AUTH_COOKIE}=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`,
    },
  });
}
