import { getLiveness } from "@/lib/health";

export async function GET() {
  return Response.json(getLiveness(), { status: 200 });
}
