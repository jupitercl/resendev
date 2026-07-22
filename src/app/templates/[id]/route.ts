import { NextRequest } from "next/server";
import { updateTemplateSchema, validateAuth } from "@/lib/validators";
import { getTemplateById, updateTemplate, deleteTemplate, TemplateAliasConflictError } from "@/lib/store";
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

// Resend's SDK sends PATCH for template updates; PUT is accepted too for
// robustness with hand-written clients.
async function handleUpdate(
  request: NextRequest,
  params: Promise<{ id: string }>,
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

  let template;
  try {
    template = updateTemplate(id, result.data);
  } catch (e) {
    if (e instanceof TemplateAliasConflictError) {
      return Response.json(
        { statusCode: 422, message: e.message, name: "validation_error" },
        { status: 422 },
      );
    }
    throw e;
  }
  if (!template) return notFound();

  broadcast("template:updated", template);

  return Response.json({ id: template.id, object: "template" });
}

export function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleUpdate(request, params);
}

export function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleUpdate(request, params);
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
