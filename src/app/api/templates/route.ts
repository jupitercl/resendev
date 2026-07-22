import { listTemplates } from "@/lib/store";

export async function GET() {
  return Response.json({ data: listTemplates() });
}
