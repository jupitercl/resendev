import { NextRequest } from "next/server";
import { createEmailSchema, validateAuth } from "@/lib/validators";
import { createEmail, listEmails, getSettings } from "@/lib/store";
import { prepareEmailRequest } from "@/lib/email-capture";
import { broadcast } from "@/lib/sse";

export async function POST(request: NextRequest) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  const settings = getSettings();

  // Simulated delay
  if (settings.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, settings.delayMs));
  }

  // Error simulation
  if (settings.errorRate > 0 && Math.random() * 100 < settings.errorRate) {
    return Response.json(
      { statusCode: 500, message: "Internal server error", name: "internal_server_error" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { statusCode: 422, message: "Invalid JSON", name: "validation_error" },
      { status: 422 },
    );
  }

  const result = createEmailSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return Response.json(
      { statusCode: 422, message: firstError.message, name: "validation_error" },
      { status: 422 },
    );
  }

  const prepared = prepareEmailRequest(result.data);
  if (!prepared.ok) {
    return Response.json(
      { statusCode: prepared.status, message: prepared.message, name: prepared.name },
      { status: prepared.status },
    );
  }

  const email = createEmail(prepared.request);
  broadcast("email:new", email);

  return Response.json({ id: email.id });
}

export async function GET(request: NextRequest) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  const emails = listEmails();
  return Response.json({ data: emails });
}
