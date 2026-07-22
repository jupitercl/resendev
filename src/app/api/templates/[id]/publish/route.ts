import { NextRequest } from "next/server";
import { publishTemplate } from "@/lib/store";
import { broadcast } from "@/lib/sse";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const template = publishTemplate(id);
  if (!template) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  broadcast("template:updated", template);
  return Response.json(template);
}
