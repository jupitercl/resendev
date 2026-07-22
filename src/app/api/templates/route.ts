import { NextRequest } from "next/server";
import { createTemplateSchema } from "@/lib/validators";
import { createTemplate, listTemplates } from "@/lib/store";
import { broadcast } from "@/lib/sse";

export async function GET() {
  return Response.json({ data: listTemplates() });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createTemplateSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const template = createTemplate(result.data);
  broadcast("template:new", template);
  return Response.json(template);
}
