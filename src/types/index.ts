// Resend-compatible types

export interface CreateEmailRequest {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string | string[];
  headers?: Record<string, string>;
  attachments?: Attachment[];
  tags?: Tag[];
  scheduled_at?: string;
}

export interface Attachment {
  filename: string;
  content: string; // Base64 encoded
  content_type?: string;
}

export interface Tag {
  name: string;
  value: string;
}

export interface CreateEmailResponse {
  id: string;
}

export interface Email {
  id: string;
  object: "email";
  to: string[];
  from: string;
  cc: string[] | null;
  bcc: string[] | null;
  reply_to: string[] | null;
  subject: string;
  html: string | null;
  text: string | null;
  created_at: string;
  last_event: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  name: string;
}

// Internal DB row type
export interface EmailRow {
  id: string;
  from_address: string;
  to_addresses: string; // JSON array
  cc_addresses: string | null;
  bcc_addresses: string | null;
  reply_to: string | null;
  subject: string;
  html: string | null;
  text_content: string | null;
  headers: string | null;
  attachments: string | null;
  tags: string | null;
  scheduled_at: string | null;
  status: string;
  raw_request: string;
  created_at: string;
}

// Batch email types
export interface BatchEmailRequest {
  emails: CreateEmailRequest[];
}

export interface BatchEmailResponse {
  data: CreateEmailResponse[];
}
