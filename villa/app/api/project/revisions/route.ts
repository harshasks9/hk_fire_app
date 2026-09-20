import { revisions } from "@/lib/server/project";
import { authorised, unauthorised } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorised(req)) return unauthorised();
  const p = new URL(req.url).searchParams;
  const num = (k: string) => (p.get(k) === null ? undefined : Number(p.get(k)));
  const list = await revisions({ before: num("before"), limit: num("limit"), itemId: p.get("itemId") ?? undefined, spaceId: p.get("spaceId") ?? undefined });
  return Response.json({ revisions: list });
}
