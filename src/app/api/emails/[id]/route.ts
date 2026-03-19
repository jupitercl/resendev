import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { EmailRow } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT * FROM emails WHERE id = ?").get(id) as EmailRow | undefined;

  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    id: row.id,
    object: "email",
    from: row.from_address,
    to: JSON.parse(row.to_addresses),
    cc: row.cc_addresses ? JSON.parse(row.cc_addresses) : null,
    bcc: row.bcc_addresses ? JSON.parse(row.bcc_addresses) : null,
    reply_to: row.reply_to ? JSON.parse(row.reply_to) : null,
    subject: row.subject,
    html: row.html,
    text: row.text_content,
    created_at: new Date(row.created_at + "Z").toISOString(),
    last_event: row.status,
    raw_request: row.raw_request,
  });
}
