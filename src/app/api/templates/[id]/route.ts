import { NextRequest } from "next/server";
import { getTemplateById, deleteTemplate } from "@/lib/store";
import { broadcast } from "@/lib/sse";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(template);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = deleteTemplate(id);
  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  broadcast("template:deleted", { id });
  return Response.json({ deleted: true });
}
