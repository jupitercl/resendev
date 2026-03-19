export const config = {
  port: parseInt(process.env.RESENDEV_PORT || "3099", 10),
  maxEmails: parseInt(process.env.RESENDEV_MAX_EMAILS || "1000", 10),
  retentionHours: parseInt(process.env.RESENDEV_RETENTION_HOURS || "24", 10),
  delayMs: parseInt(process.env.RESENDEV_DELAY_MS || "0", 10),
  errorRate: parseInt(process.env.RESENDEV_ERROR_RATE || "0", 10),
  dbPath: process.env.RESENDEV_DB_PATH || "./data/resendev.db",
};
