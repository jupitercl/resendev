import { z } from "zod";

const stringOrArray = z.union([z.string(), z.array(z.string())]);

const attachmentSchema = z.object({
  filename: z.string(),
  content: z.string(),
  content_type: z.string().optional(),
});

const tagSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export const createEmailSchema = z.object({
  from: z.string().min(1, "Missing `from` field"),
  to: stringOrArray,
  subject: z.string().min(1, "Missing `subject` field"),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: stringOrArray.optional(),
  bcc: stringOrArray.optional(),
  reply_to: stringOrArray.optional(),
  headers: z.record(z.string(), z.string()).optional(),
  attachments: z.array(attachmentSchema).optional(),
  tags: z.array(tagSchema).optional(),
  scheduled_at: z.string().optional(),
});

export const batchEmailSchema = z.object({
  emails: z.array(createEmailSchema).min(1, "At least one email is required"),
});

export function normalizeToArray(value: string | string[] | undefined): string[] | null {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? value : [value];
}

export function validateAuth(request: Request): { error: Response } | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: Response.json(
        { statusCode: 401, message: "Missing API key", name: "missing_api_key" },
        { status: 401 },
      ),
    };
  }
  return null;
}
