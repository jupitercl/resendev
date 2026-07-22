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

const templateReferenceSchema = z.object({
  id: z.string().min(1, "Missing `template.id` field"),
  variables: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export const createEmailSchema = z
  .object({
    from: z.string().optional(),
    to: stringOrArray,
    subject: z.string().optional(),
    html: z.string().optional(),
    text: z.string().optional(),
    cc: stringOrArray.optional(),
    bcc: stringOrArray.optional(),
    reply_to: stringOrArray.optional(),
    headers: z.record(z.string(), z.string()).optional(),
    attachments: z.array(attachmentSchema).optional(),
    tags: z.array(tagSchema).optional(),
    scheduled_at: z.string().optional(),
    template: templateReferenceSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.template) {
      // A template cannot be combined with an inline body.
      if (data.html !== undefined || data.text !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "The `template` field cannot be used together with `html` or `text`",
        });
      }
    } else {
      // Without a template, `from` and `subject` are required.
      if (!data.from || data.from.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Missing `from` field" });
      }
      if (!data.subject || data.subject.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Missing `subject` field" });
      }
    }
  });

export const batchEmailSchema = z.object({
  emails: z.array(createEmailSchema).min(1, "At least one email is required"),
});

const templateVariableSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["string", "number"]),
  fallback_value: z.union([z.string(), z.number()]).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Missing `name` field"),
  html: z.string().min(1, "Missing `html` field"),
  alias: z.string().optional(),
  subject: z.string().optional(),
  from: z.string().optional(),
  reply_to: stringOrArray.optional(),
  text: z.string().optional(),
  variables: z.array(templateVariableSchema).max(50, "A template can have at most 50 variables").optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

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
