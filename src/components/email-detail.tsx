"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (error || !email) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{error || "Email not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/")}>
          ← Back
        </Button>
        <span className="text-xs text-muted-foreground font-mono">{email.id}</span>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{email.subject}</h2>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">From:</span> {email.from}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">To:</span> {email.to.join(", ")}
        </div>
        {email.cc && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Cc:</span> {email.cc.join(", ")}
          </div>
        )}
        {email.bcc && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Bcc:</span> {email.bcc.join(", ")}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Date:</span>{" "}
          {new Date(email.created_at).toLocaleString()}
        </div>
      </div>

      <Tabs defaultValue="html" className="w-full">
        <TabsList>
          <TabsTrigger value="html" disabled={!email.html}>HTML</TabsTrigger>
          <TabsTrigger value="text" disabled={!email.text}>Text</TabsTrigger>
          <TabsTrigger value="source" disabled={!email.html}>Source</TabsTrigger>
          <TabsTrigger value="attachments" disabled={!email.attachments?.length}>
            Attachments{email.attachments?.length ? ` (${email.attachments.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="mt-4">
          {email.html ? (
            <iframe
              srcDoc={email.html}
              sandbox=""
              className="w-full min-h-[400px] border rounded-lg bg-white"
              title="Email HTML preview"
            />
          ) : (
            <p className="text-muted-foreground py-8 text-center">No HTML content</p>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          {email.text ? (
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono whitespace-pre-wrap">
              {email.text}
            </pre>
          ) : (
            <p className="text-muted-foreground py-8 text-center">No plain text content</p>
          )}
        </TabsContent>

        <TabsContent value="source" className="mt-4">
          {email.html ? (
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
              {email.html}
            </pre>
          ) : (
            <p className="text-muted-foreground py-8 text-center">No HTML source</p>
          )}
        </TabsContent>

        <TabsContent value="attachments" className="mt-4">
          {email.attachments && email.attachments.length > 0 ? (
            <div className="space-y-2">
              {email.attachments.map((att, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{att.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {att.content_type || "unknown type"} · {Math.round(att.content.length * 0.75 / 1024)} KB
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadAttachment(att)}>
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">No attachments</p>
          )}
        </TabsContent>

        <TabsContent value="headers" className="mt-4">
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm font-mono">
            <div><span className="text-muted-foreground">ID:</span> {email.id}</div>
            <div><span className="text-muted-foreground">From:</span> {email.from}</div>
            <div><span className="text-muted-foreground">To:</span> {email.to.join(", ")}</div>
            {email.cc && <div><span className="text-muted-foreground">Cc:</span> {email.cc.join(", ")}</div>}
            {email.bcc && <div><span className="text-muted-foreground">Bcc:</span> {email.bcc.join(", ")}</div>}
            {email.reply_to && <div><span className="text-muted-foreground">Reply-To:</span> {email.reply_to.join(", ")}</div>}
            <div><span className="text-muted-foreground">Subject:</span> {email.subject}</div>
            <div><span className="text-muted-foreground">Status:</span> {email.last_event}</div>
            <div><span className="text-muted-foreground">Created:</span> {email.created_at}</div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <pre className="bg-muted rounded-lg p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
            {email.raw_request
              ? JSON.stringify(JSON.parse(email.raw_request), null, 2)
              : "No raw request data available"}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
