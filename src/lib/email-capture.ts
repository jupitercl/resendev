import type { CreateEmailRequest } from "@/types";
import { resolveTemplateForEmail } from "./store";

export type PreparedEmail =
  | { ok: true; request: CreateEmailRequest }
  | { ok: false; status: number; name: string; message: string };

// Expands a template reference (if present) into a fully-formed email request,
// merging any explicit fields from the request over the template defaults.
// Shared by POST /emails and POST /emails/batch so both behave identically.
export function prepareEmailRequest(req: CreateEmailRequest): PreparedEmail {
  if (!req.template) return { ok: true, request: req };

  const resolution = resolveTemplateForEmail(req.template);
  if (!resolution.ok) return resolution;

  const { resolved } = resolution;
  const merged: CreateEmailRequest = {
    ...req,
    from: req.from ?? resolved.from,
    subject: req.subject ?? resolved.subject,
    html: resolved.html,
    text: req.text ?? resolved.text,
    reply_to: req.reply_to ?? resolved.reply_to,
  };

  if (!merged.from) {
    return {
      ok: false,
      status: 422,
      name: "validation_error",
      message: "Missing `from` field (not provided and template has no default `from`)",
    };
  }
  if (!merged.subject) {
    return {
      ok: false,
      status: 422,
      name: "validation_error",
      message: "Missing `subject` field (not provided and template has no default `subject`)",
    };
  }

  return { ok: true, request: merged };
}
