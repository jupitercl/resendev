"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Attachment, Email } from "@/types";

interface EmailDetailProps {
  id: string;
}

interface EmailWithRaw extends Email {
  raw_request?: string;
  attachments?: Attachment[] | null;
  tags?: { name: string; value: string }[] | null;
}

function downloadAttachment(att: Attachment) {
  const byteString = atob(att.content);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: att.content_type || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </button>
  );
}

export function EmailDetail({ id }: EmailDetailProps) {
  const [email, setEmail] = useState<EmailWithRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchEmail() {
      try {
        const res = await fetch(`/api/emails/${id}`);
        if (!res.ok) {
          setError("Email not found");
          return;
        }
        const data = await res.json();
        setEmail(data);
      } catch {
        setError("Failed to load email");
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground text-[13px]">Loading...</div>;
  }

  if (error || !email) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground text-[13px]">{error || "Email not found"}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/")}
        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Emails
      </button>

      {/* Header with icon */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
            <rect width="20" height="16" x="2" y="4" rx="2" stroke="currentColor" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="currentColor" />
          </svg>
        </div>
        <div>
          <div className="text-[12px] text-muted-foreground mb-1">Email</div>
          <h1 className="text-[20px] font-semibold tracking-tight">{email.to.join(", ")}</h1>
        </div>
      </div>

      {/* Horizontal metadata row */}
      <div className="flex flex-wrap gap-8 py-4 border-y border-border">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">From</div>
          <div className="text-[13px] text-foreground">{email.from}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Subject</div>
          <div className="text-[13px] text-foreground">{email.subject}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">To</div>
          <div className="text-[13px] text-foreground">{email.to.join(", ")}</div>
        </div>
        {email.cc && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Cc</div>
            <div className="text-[13px] text-foreground">{email.cc.join(", ")}</div>
          </div>
        )}
        {email.bcc && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Bcc</div>
            <div className="text-[13px] text-foreground">{email.bcc.join(", ")}</div>
          </div>
        )}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">ID</div>
          <div className="text-[13px] text-foreground font-mono flex items-center gap-2">
            {email.id}
            <CopyButton text={email.id} />
          </div>
        </div>
      </div>

      {/* Email Events timeline */}
      <div>
        <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Email Events</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[12px] text-foreground">Sent</span>
            <span className="text-[11px] text-muted-foreground ml-1">
              {new Date(email.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${email.last_event === "delivered" ? "bg-green-400" : "bg-muted-foreground"}`} />
            <span className="text-[12px] text-foreground">
              {email.last_event.charAt(0).toUpperCase() + email.last_event.slice(1)}
            </span>
            <span className="text-[11px] text-muted-foreground ml-1">
              {new Date(email.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="preview" disabled={!email.html} className="text-[12px]">Preview</TabsTrigger>
          <TabsTrigger value="text" disabled={!email.text} className="text-[12px]">Plain Text</TabsTrigger>
          <TabsTrigger value="html" disabled={!email.html} className="text-[12px]">HTML</TabsTrigger>
          <TabsTrigger value="attachments" disabled={!email.attachments?.length} className="text-[12px]">
            Attachments{email.attachments?.length ? ` (${email.attachments.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-[12px]">Headers</TabsTrigger>
          <TabsTrigger value="raw" className="text-[12px]">Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          {email.html ? (
            <iframe
              srcDoc={email.html}
              sandbox=""
              className="w-full min-h-[500px] border border-border rounded-lg bg-white"
              title="Email HTML preview"
            />
          ) : (
            <p className="text-muted-foreground py-8 text-center text-[13px]">No HTML content</p>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          {email.text ? (
            <pre className="bg-muted/30 border border-border rounded-lg p-4 text-[12px] font-mono whitespace-pre-wrap text-foreground/80">
              {email.text}
            </pre>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-[13px]">No plain text content</p>
          )}
        </TabsContent>

        <TabsContent value="html" className="mt-4">
          {email.html ? (
            <pre className="bg-muted/30 border border-border rounded-lg p-4 text-[12px] font-mono whitespace-pre-wrap overflow-x-auto text-foreground/80">
              {email.html}
            </pre>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-[13px]">No HTML source</p>
          )}
        </TabsContent>

        <TabsContent value="attachments" className="mt-4">
          {email.attachments && email.attachments.length > 0 ? (
            <div className="space-y-2">
              {email.attachments.map((att, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-4 py-3">
                  <div>
                    <div className="text-[13px] font-medium">{att.filename}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {att.content_type || "unknown type"} · {Math.round(att.content.length * 0.75 / 1024)} KB
                    </div>
                  </div>
                  <button
                    onClick={() => downloadAttachment(att)}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-[13px]">No attachments</p>
          )}
        </TabsContent>

        <TabsContent value="headers" className="mt-4">
          <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-1.5 text-[12px] font-mono">
            <div><span className="text-muted-foreground">ID:</span> <span className="text-foreground/80">{email.id}</span></div>
            <div><span className="text-muted-foreground">From:</span> <span className="text-foreground/80">{email.from}</span></div>
            <div><span className="text-muted-foreground">To:</span> <span className="text-foreground/80">{email.to.join(", ")}</span></div>
            {email.cc && <div><span className="text-muted-foreground">Cc:</span> <span className="text-foreground/80">{email.cc.join(", ")}</span></div>}
            {email.bcc && <div><span className="text-muted-foreground">Bcc:</span> <span className="text-foreground/80">{email.bcc.join(", ")}</span></div>}
            {email.reply_to && <div><span className="text-muted-foreground">Reply-To:</span> <span className="text-foreground/80">{email.reply_to.join(", ")}</span></div>}
            <div><span className="text-muted-foreground">Subject:</span> <span className="text-foreground/80">{email.subject}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="text-foreground/80">{email.last_event}</span></div>
            <div><span className="text-muted-foreground">Created:</span> <span className="text-foreground/80">{email.created_at}</span></div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <pre className="bg-muted/30 border border-border rounded-lg p-4 text-[12px] font-mono whitespace-pre-wrap overflow-x-auto text-foreground/80">
            {email.raw_request
              ? JSON.stringify(JSON.parse(email.raw_request), null, 2)
              : "No raw request data available"}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
