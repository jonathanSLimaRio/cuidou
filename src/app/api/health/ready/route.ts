import { getReadiness } from "@/lib/health";

export async function GET() {
  const result = await getReadiness();
  return Response.json(result, { status: result.status === "ok" ? 200 : 503 });
}
