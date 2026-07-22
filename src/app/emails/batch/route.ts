import { NextRequest } from "next/server";
import { batchEmailSchema, validateAuth } from "@/lib/validators";
import { createEmail } from "@/lib/store";
import { prepareEmailRequest } from "@/lib/email-capture";
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

  // Resolve any template references before capturing. If any email fails to
  // resolve, reject the whole batch (Resend validates the batch atomically).
  const prepared = result.data.emails.map(prepareEmailRequest);
  const failure = prepared.find((p) => !p.ok);
  if (failure && !failure.ok) {
    return Response.json(
      { statusCode: failure.status, message: failure.message, name: failure.name },
      { status: failure.status },
    );
  }

  const data = prepared.map((p) => {
    // Every entry is ok here — the failure guard above returned early otherwise.
    if (!p.ok) throw new Error("unreachable");
    const email = createEmail(p.request);
    broadcast("email:new", email);
    return { id: email.id };
  });

  return Response.json({ data });
}
