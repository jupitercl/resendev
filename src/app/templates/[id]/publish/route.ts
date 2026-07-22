import { NextRequest } from "next/server";
import { validateAuth } from "@/lib/validators";
import { publishTemplate } from "@/lib/store";
import { broadcast } from "@/lib/sse";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  const { id } = await params;
  const template = publishTemplate(id);

  if (!template) {
    return Response.json(
      { statusCode: 404, message: "Template not found", name: "not_found" },
      { status: 404 },
    );
  }

  broadcast("template:updated", template);

  return Response.json({ id: template.id, object: "template" });
}
