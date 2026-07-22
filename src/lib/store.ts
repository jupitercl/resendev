import { randomUUID } from "crypto";
import { getDb } from "./db";
import type {
  CreateEmailRequest,
  CreateTemplateRequest,
  Email,
  EmailRow,
  Template,
  TemplateReference,
  TemplateRow,
  TemplateVariable,
  UpdateTemplateRequest,
} from "@/types";
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

// ---------------------------------------------------------------------------
// Templates (Resend-compatible)
// ---------------------------------------------------------------------------

function generateTemplateId(): string {
  // Resend returns a bare UUID for templates.
  return randomUUID();
}

function rowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    object: "template",
    name: row.name,
    alias: row.alias,
    subject: row.subject,
    from: row.from_address,
    reply_to: row.reply_to ? JSON.parse(row.reply_to) : null,
    html: row.html,
    text: row.text_content,
    variables: row.variables ? JSON.parse(row.variables) : [],
    status: row.status === "published" ? "published" : "draft",
    created_at: new Date(row.created_at + "Z").toISOString(),
    published_at: row.published_at ? new Date(row.published_at + "Z").toISOString() : null,
  };
}

export function createTemplate(request: CreateTemplateRequest): Template {
  const db = getDb();
  const id = generateTemplateId();
  const replyTo = normalizeToArray(request.reply_to);

  db.prepare(`
    INSERT INTO templates (id, name, alias, subject, from_address, reply_to, html, text_content, variables, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `).run(
    id,
    request.name,
    request.alias || null,
    request.subject || null,
    request.from || null,
    replyTo ? JSON.stringify(replyTo) : null,
    request.html,
    request.text || null,
    request.variables ? JSON.stringify(request.variables) : null,
  );

  return getTemplateById(id)!;
}

export function getTemplateById(id: string): Template | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM templates WHERE id = ?").get(id) as TemplateRow | undefined;
  return row ? rowToTemplate(row) : null;
}

export function getTemplateByIdOrAlias(idOrAlias: string): Template | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM templates WHERE id = ? OR alias = ?")
    .get(idOrAlias, idOrAlias) as TemplateRow | undefined;
  return row ? rowToTemplate(row) : null;
}

export function listTemplates(): Template[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM templates ORDER BY created_at DESC").all() as TemplateRow[];
  return rows.map(rowToTemplate);
}

export function updateTemplate(id: string, updates: UpdateTemplateRequest): Template | null {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM templates WHERE id = ?").get(id) as TemplateRow | undefined;
  if (!existing) return null;

  const replyTo =
    updates.reply_to !== undefined ? normalizeToArray(updates.reply_to) : undefined;

  db.prepare(`
    UPDATE templates SET
      name = ?,
      alias = ?,
      subject = ?,
      from_address = ?,
      reply_to = ?,
      html = ?,
      text_content = ?,
      variables = ?
    WHERE id = ?
  `).run(
    updates.name ?? existing.name,
    updates.alias !== undefined ? updates.alias || null : existing.alias,
    updates.subject !== undefined ? updates.subject || null : existing.subject,
    updates.from !== undefined ? updates.from || null : existing.from_address,
    replyTo !== undefined ? (replyTo ? JSON.stringify(replyTo) : null) : existing.reply_to,
    updates.html ?? existing.html,
    updates.text !== undefined ? updates.text || null : existing.text_content,
    updates.variables !== undefined ? JSON.stringify(updates.variables) : existing.variables,
    id,
  );

  return getTemplateById(id);
}

export function deleteTemplate(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM templates WHERE id = ?").run(id);
  return result.changes > 0;
}

export function publishTemplate(id: string): Template | null {
  const db = getDb();
  const result = db
    .prepare("UPDATE templates SET status = 'published', published_at = datetime('now') WHERE id = ?")
    .run(id);
  if (result.changes === 0) return null;
  return getTemplateById(id);
}

// Replaces {{{VAR}}} placeholders using provided values, falling back to the
// template's declared fallback_value, then to an empty string.
function interpolate(
  input: string,
  declared: TemplateVariable[],
  provided: Record<string, string | number>,
): string {
  const values = new Map<string, string>();
  for (const v of declared) {
    const val = provided[v.key] ?? v.fallback_value ?? "";
    values.set(v.key, String(val));
  }
  for (const [k, val] of Object.entries(provided)) {
    if (!values.has(k)) values.set(k, String(val));
  }
  return input.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (match, key) =>
    values.has(key) ? values.get(key)! : match,
  );
}

export interface ResolvedTemplateEmail {
  from?: string;
  subject?: string;
  html: string;
  text?: string;
  reply_to?: string[];
}

export type TemplateResolution =
  | { ok: true; resolved: ResolvedTemplateEmail }
  | { ok: false; status: number; name: string; message: string };

// Resolves a template reference (by id or alias) into a renderable email body.
// Mirrors Resend behaviour: the template must exist and be published.
export function resolveTemplateForEmail(ref: TemplateReference): TemplateResolution {
  const template = getTemplateByIdOrAlias(ref.id);
  if (!template) {
    return { ok: false, status: 404, name: "not_found", message: `Template \`${ref.id}\` not found` };
  }
  if (template.status !== "published") {
    return {
      ok: false,
      status: 422,
      name: "validation_error",
      message: `Template \`${ref.id}\` must be published before it can be used`,
    };
  }

  const vars = ref.variables ?? {};
  return {
    ok: true,
    resolved: {
      from: template.from ?? undefined,
      subject: template.subject ? interpolate(template.subject, template.variables, vars) : undefined,
      html: interpolate(template.html, template.variables, vars),
      text: template.text ? interpolate(template.text, template.variables, vars) : undefined,
      reply_to: template.reply_to ?? undefined,
    },
  };
}
