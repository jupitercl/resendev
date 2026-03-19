import { getStats } from "@/lib/store";

export async function GET() {
  const stats = getStats();
  return Response.json(stats);
}
