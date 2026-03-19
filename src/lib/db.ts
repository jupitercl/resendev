import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { config } from "./config";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbDir = dirname(config.dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initialize(db);

  return db;
}

function initialize(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      from_address TEXT NOT NULL,
      to_addresses TEXT NOT NULL,
      cc_addresses TEXT,
      bcc_addresses TEXT,
      reply_to TEXT,
      subject TEXT NOT NULL,
      html TEXT,
      text_content TEXT,
      headers TEXT,
      attachments TEXT,
      tags TEXT,
      scheduled_at TEXT,
      status TEXT DEFAULT 'delivered',
      raw_request TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);

    CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(
      subject, from_address, to_addresses, html, text_content,
      content='emails', content_rowid='rowid'
    );

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS emails_ai AFTER INSERT ON emails BEGIN
      INSERT INTO emails_fts(rowid, subject, from_address, to_addresses, html, text_content)
      VALUES (NEW.rowid, NEW.subject, NEW.from_address, NEW.to_addresses, NEW.html, NEW.text_content);
    END;

    CREATE TRIGGER IF NOT EXISTS emails_ad AFTER DELETE ON emails BEGIN
      INSERT INTO emails_fts(emails_fts, rowid, subject, from_address, to_addresses, html, text_content)
      VALUES ('delete', OLD.rowid, OLD.subject, OLD.from_address, OLD.to_addresses, OLD.html, OLD.text_content);
    END;
  `);
}
