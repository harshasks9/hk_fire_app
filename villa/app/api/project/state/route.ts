import { stateAt } from "@/lib/server/project";
import { authorised, unauthorised } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** The project as it stood after version ?v — what a restore is built from. */
export async function GET(req: Request) {
  if (!authorised(req)) return unauthorised();
  const v = Number(new URL(req.url).searchParams.get("v"));
  if (!Number.isFinite(v)) return Response.json({ error: "bad version" }, { status: 400 });
  const state = await stateAt(v);
  if (!state) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ v, state });
}
