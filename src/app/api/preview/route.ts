import { NextRequest } from "next/server";
import { render } from "@react-email/render";
import { templates, getTemplate } from "@/emails";
import { createElement } from "react";

export async function GET() {
  const list = templates.map(({ id, name, description, subject, fields }) => ({
    id,
    name,
    description,
    subject,
    fields,
  }));
  return Response.json({ templates: list });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { templateId, props } = body as { templateId: string; props: Record<string, string> };

  const template = getTemplate(templateId);
  if (!template) {
    return Response.json(
      { error: "Template not found" },
      { status: 404 },
    );
  }

  const html = await render(createElement(template.component, props));

  return Response.json({ html });
}
