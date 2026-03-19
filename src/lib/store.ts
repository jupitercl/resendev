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

export interface EmailStats {
  total: number;
  today: number;
  topSenders: { address: string; count: number }[];
  avgSizeBytes: number;
  withAttachments: number;
  emailsPerHour: { hour: string; count: number }[];
}

export function getStats(): EmailStats {
  const db = getDb();

  const total = (db.prepare("SELECT COUNT(*) as count FROM emails").get() as { count: number }).count;

  const today = (db.prepare(
    "SELECT COUNT(*) as count FROM emails WHERE created_at >= datetime('now', 'start of day')"
  ).get() as { count: number }).count;

  const topSenders = db.prepare(
    "SELECT from_address as address, COUNT(*) as count FROM emails GROUP BY from_address ORDER BY count DESC LIMIT 5"
  ).all() as { address: string; count: number }[];

  const avgSize = (db.prepare(
    "SELECT AVG(LENGTH(COALESCE(html, '') || COALESCE(text_content, ''))) as avg_size FROM emails"
  ).get() as { avg_size: number | null });

  const withAttachments = (db.prepare(
    "SELECT COUNT(*) as count FROM emails WHERE attachments IS NOT NULL AND attachments != '[]'"
  ).get() as { count: number }).count;

  const emailsPerHour = db.prepare(`
    SELECT strftime('%Y-%m-%dT%H:00:00Z', created_at) as hour, COUNT(*) as count
    FROM emails
    WHERE created_at >= datetime('now', '-24 hours')
    GROUP BY hour
    ORDER BY hour ASC
  `).all() as { hour: string; count: number }[];

  return {
    total,
    today,
    topSenders,
    avgSizeBytes: Math.round(avgSize.avg_size || 0),
    withAttachments,
    emailsPerHour,
  };
}

export interface Settings {
  delayMs: number;
  errorRate: number;
  theme: "light" | "dark" | "system";
}

const DEFAULT_SETTINGS: Settings = {
  delayMs: 0,
  errorRate: 0,
  theme: "system",
};

export function getSettings(): Settings {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const saved: Record<string, string> = {};
  for (const row of rows) {
    saved[row.key] = row.value;
  }
  return {
    delayMs: saved.delayMs ? parseInt(saved.delayMs, 10) : DEFAULT_SETTINGS.delayMs,
    errorRate: saved.errorRate ? parseInt(saved.errorRate, 10) : DEFAULT_SETTINGS.errorRate,
    theme: (saved.theme as Settings["theme"]) || DEFAULT_SETTINGS.theme,
  };
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const db = getDb();
  const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  const txn = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        upsert.run(key, String(value));
      }
    }
  });
  txn();
  return getSettings();
}

export function searchEmails(query: string): Email[] {
  const db = getDb();
  // Append * for prefix matching
  const ftsQuery = query.split(/\s+/).map((t) => `"${t}"*`).join(" ");
  const rows = db.prepare(`
    SELECT emails.* FROM emails
    JOIN emails_fts ON emails.rowid = emails_fts.rowid
    WHERE emails_fts MATCH ?
    ORDER BY emails.created_at DESC
  `).all(ftsQuery) as EmailRow[];
  return rows.map(rowToEmail);
}
