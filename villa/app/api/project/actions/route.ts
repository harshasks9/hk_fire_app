import { submit, type Submit } from "@/lib/server/project";
import { authorised, unauthorised } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** One action, against the version the client believes is current. */
export async function POST(req: Request) {
  if (!authorised(req)) return unauthorised();
  const body = (await req.json()) as Submit;
  if (typeof body?.base !== "number" || !body.action?.type) return Response.json({ error: "bad request" }, { status: 400 });
  const r = await submit(body);
  if (r.ok) return Response.json(r);
  if (r.conflict) return Response.json(r, { status: 409 });
  return Response.json(r, { status: 503 });
}
