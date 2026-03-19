import { NextRequest } from "next/server";
import { validateAuth } from "@/lib/validators";
import { getEmailById, deleteEmail } from "@/lib/store";
import { broadcast } from "@/lib/sse";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  const { id } = await params;
  const email = getEmailById(id);

  if (!email) {
    return Response.json(
      { statusCode: 404, message: "Email not found", name: "not_found" },
      { status: 404 },
    );
  }

  return Response.json(email);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = validateAuth(request);
  if (authCheck) return authCheck.error;

  const { id } = await params;
  const deleted = deleteEmail(id);

  if (!deleted) {
    return Response.json(
      { statusCode: 404, message: "Email not found", name: "not_found" },
      { status: 404 },
    );
  }

  broadcast("email:deleted", { id });

  return Response.json({ deleted: true });
}
