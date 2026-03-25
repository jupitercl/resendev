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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <span className="text-[11px] text-muted-foreground font-mono">{email.id}</span>
      </div>

      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-border">
        <h2 className="text-[17px] font-medium">{email.subject}</h2>
        <div className="grid grid-cols-[60px_1fr] gap-y-1 text-[13px]">
          <span className="text-muted-foreground">From</span>
          <span>{email.from}</span>
          <span className="text-muted-foreground">To</span>
          <span>{email.to.join(", ")}</span>
          {email.cc && (
            <>
              <span className="text-muted-foreground">Cc</span>
              <span>{email.cc.join(", ")}</span>
            </>
          )}
          {email.bcc && (
            <>
              <span className="text-muted-foreground">Bcc</span>
              <span>{email.bcc.join(", ")}</span>
            </>
          )}
          <span className="text-muted-foreground">Date</span>
          <span className="text-muted-foreground">{new Date(email.created_at).toLocaleString()}</span>
        </div>
      </div>

      <Tabs defaultValue="html" className="w-full">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="html" disabled={!email.html} className="text-[12px]">HTML</TabsTrigger>
          <TabsTrigger value="text" disabled={!email.text} className="text-[12px]">Text</TabsTrigger>
          <TabsTrigger value="source" disabled={!email.html} className="text-[12px]">Source</TabsTrigger>
          <TabsTrigger value="attachments" disabled={!email.attachments?.length} className="text-[12px]">
            Attachments{email.attachments?.length ? ` (${email.attachments.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-[12px]">Headers</TabsTrigger>
          <TabsTrigger value="raw" className="text-[12px]">Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="mt-4">
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

        <TabsContent value="source" className="mt-4">
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
