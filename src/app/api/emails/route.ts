import { listEmails, deleteAllEmails } from "@/lib/store";
import { broadcast } from "@/lib/sse";

export async function GET() {
  const emails = listEmails();
  return Response.json({ data: emails });
}

export async function DELETE() {
  const count = deleteAllEmails();
  broadcast("emails:cleared", { count });
  return Response.json({ deleted: count });
}
