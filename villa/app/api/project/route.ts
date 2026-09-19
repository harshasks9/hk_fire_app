import { available, head, init } from "@/lib/server/project";
import { authorised, locked, unauthorised } from "@/lib/server/auth";
import type { ProjectState } from "@/lib/model/types";

export const dynamic = "force-dynamic";

/**
 * GET  → where the data lives, and the current project if there is one.
 *        ?v=N returns only the version when the client is already at N.
 * POST → create the project from the state the first client brings along.
 */
export async function GET(req: Request) {
  if (!(await available())) return Response.json({ mode: "browser" });
  if (!authorised(req)) return Response.json({ mode: "server", locked: true });
  const url = new URL(req.url);
  const have = url.searchParams.get("v");
  const h = await head();
  if (!h) return Response.json({ mode: "server", locked: locked(), project: null });
  if (have !== null && Number(have) === h.version) return Response.json({ mode: "server", version: h.version, unchanged: true });
  return Response.json({ mode: "server", locked: locked(), project: h });
}

export async function POST(req: Request) {
  if (!(await available())) return Response.json({ error: "no database" }, { status: 503 });
  if (!authorised(req)) return unauthorised();
  const body = (await req.json()) as { state?: ProjectState };
  if (!body?.state?.meta || !Array.isArray(body.state.items)) return Response.json({ error: "bad state" }, { status: 400 });
  const h = await init(body.state);
  return Response.json({ mode: "server", project: h });
}
