import { NextRequest } from "next/server";
import { updateTemplateSchema, validateAuth } from "@/lib/validators";
import { getTemplateById, updateTemplate, deleteTemplate } from "@/lib/store";
import { broadcast } from "@/lib/sse";

const notFound = () =>
  Response.json(
    { statusCode: 404, message: "Template not found", name: "not_found" },
    { status: 404 },
  );

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) return notFound();

  return Response.json(template);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { statusCode: 422, message: "Invalid JSON", name: "validation_error" },
      { status: 422 },
    );
  }

  const result = updateTemplateSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return Response.json(
      { statusCode: 422, message: firstError.message, name: "validation_error" },
      { status: 422 },
    );
  }

  const template = updateTemplate(id, result.data);
  if (!template) return notFound();

  broadcast("template:updated", template);

  return Response.json({ id: template.id, object: "template" });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  const { id } = await params;
  const deleted = deleteTemplate(id);
  if (!deleted) return notFound();

  broadcast("template:deleted", { id });

  return Response.json({ object: "template", id, deleted: true });
}
