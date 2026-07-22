import { NextRequest } from "next/server";
import { createTemplateSchema, validateAuth } from "@/lib/validators";
import { createTemplate, listTemplates } from "@/lib/store";
import { broadcast } from "@/lib/sse";

export async function GET(request: NextRequest) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  return Response.json({ data: listTemplates() });
}

export async function POST(request: NextRequest) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { statusCode: 422, message: "Invalid JSON", name: "validation_error" },
      { status: 422 },
    );
  }

  const result = createTemplateSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return Response.json(
      { statusCode: 422, message: firstError.message, name: "validation_error" },
      { status: 422 },
    );
  }

  const template = createTemplate(result.data);
  broadcast("template:new", template);

  return Response.json({ id: template.id, object: "template" });
}
