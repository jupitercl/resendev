import { NextRequest } from "next/server";
import { listEmails, deleteAllEmails, searchEmails } from "@/lib/store";
import { broadcast } from "@/lib/sse";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (q && q.trim().length > 0) {
    const emails = searchEmails(q.trim());
    return Response.json({ data: emails });
  }

  const emails = listEmails();
  return Response.json({ data: emails });
}

export async function DELETE() {
  const count = deleteAllEmails();
  broadcast("emails:cleared", { count });
  return Response.json({ deleted: count });
}
