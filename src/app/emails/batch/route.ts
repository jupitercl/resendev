import { NextRequest } from "next/server";
import { batchEmailSchema, validateAuth } from "@/lib/validators";
import { createEmail } from "@/lib/store";
import { broadcast } from "@/lib/sse";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  if (config.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, config.delayMs));
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

  const result = batchEmailSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return Response.json(
      { statusCode: 422, message: firstError.message, name: "validation_error" },
      { status: 422 },
    );
  }

  const data = result.data.emails.map((emailReq) => {
    const email = createEmail(emailReq);
    broadcast("email:new", email);
    return { id: email.id };
  });

  return Response.json({ data });
}
