import { randomUUID } from "crypto";
import { getDb } from "./db";
import type { CreateEmailRequest, Email, EmailRow } from "@/types";
import { normalizeToArray } from "./validators";

function generateId(): string {
  return `rdv_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function rowToEmail(row: EmailRow): Email {
  return {
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
  };
}

export function createEmail(request: CreateEmailRequest): Email {
  const db = getDb();
  const id = generateId();
  const to = normalizeToArray(request.to)!;
  const cc = normalizeToArray(request.cc);
  const bcc = normalizeToArray(request.bcc);
  const replyTo = normalizeToArray(request.reply_to);

  const stmt = db.prepare(`
    INSERT INTO emails (id, from_address, to_addresses, cc_addresses, bcc_addresses, reply_to, subject, html, text_content, headers, attachments, tags, scheduled_at, raw_request)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    request.from,
    JSON.stringify(to),
    cc ? JSON.stringify(cc) : null,
    bcc ? JSON.stringify(bcc) : null,
    replyTo ? JSON.stringify(replyTo) : null,
    request.subject,
    request.html || null,
    request.text || null,
    request.headers ? JSON.stringify(request.headers) : null,
    request.attachments ? JSON.stringify(request.attachments) : null,
    request.tags ? JSON.stringify(request.tags) : null,
    request.scheduled_at || null,
    JSON.stringify(request),
  );

  const row = db.prepare("SELECT * FROM emails WHERE id = ?").get(id) as EmailRow;
  return rowToEmail(row);
}

export function getEmailById(id: string): Email | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM emails WHERE id = ?").get(id) as EmailRow | undefined;
  return row ? rowToEmail(row) : null;
}

export function listEmails(): Email[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM emails ORDER BY created_at DESC").all() as EmailRow[];
  return rows.map(rowToEmail);
}

export function deleteEmail(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM emails WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAllEmails(): number {
  const db = getDb();
  const result = db.prepare("DELETE FROM emails").run();
  return result.changes;
}

export function getEmailCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM emails").get() as { count: number };
  return row.count;
}
