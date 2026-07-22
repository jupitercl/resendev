"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Template } from "@/types";

interface TemplateDetailProps {
  id: string;
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

export function TemplateDetail({ id }: TemplateDetailProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const res = await fetch(`/api/templates/${id}`);
        if (!res.ok) {
          setError("Template not found");
          return;
        }
        setTemplate(await res.json());
      } catch {
        setError("Failed to load template");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [id]);

  const publish = async () => {
    const res = await fetch(`/api/templates/${id}/publish`, { method: "POST" });
    if (res.ok) {
      setTemplate(await res.json());
      toast.success("Template published");
    } else {
      toast.error("Failed to publish template");
    }
  };

  const remove = async () => {
    if (!template || !confirm(`Delete template "${template.name}"?`)) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Template deleted");
      router.push("/templates-view");
    } else {
      toast.error("Failed to delete template");
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground text-[13px]">Loading...</div>;
  }

  if (error || !template) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground text-[13px]">{error || "Template not found"}</p>
        <button
          onClick={() => router.push("/templates-view")}
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
        onClick={() => router.push("/templates-view")}
        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Templates
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <rect width="18" height="7" x="3" y="3" rx="1" />
              <rect width="9" height="7" x="3" y="14" rx="1" />
              <rect width="5" height="7" x="16" y="14" rx="1" />
            </svg>
          </div>
          <div>
            <div className="text-[12px] text-muted-foreground mb-1 flex items-center gap-2">
              Template
              <Badge variant={template.status === "published" ? "default" : "secondary"} className="text-[11px]">
                {template.status}
              </Badge>
            </div>
            <h1 className="text-[20px] font-semibold tracking-tight">{template.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {template.status !== "published" && (
            <button
              onClick={publish}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Publish
            </button>
          )}
          <button
            onClick={remove}
            className="text-[13px] text-muted-foreground hover:text-destructive transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-8 py-4 border-y border-border">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">ID</div>
          <div className="text-[13px] text-foreground font-mono flex items-center gap-2">
            {template.id}
            <CopyButton text={template.id} />
          </div>
        </div>
        {template.alias && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Alias</div>
            <div className="text-[13px] text-foreground font-mono">{template.alias}</div>
          </div>
        )}
        {template.subject && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Subject</div>
            <div className="text-[13px] text-foreground">{template.subject}</div>
          </div>
        )}
        {template.from && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">From</div>
            <div className="text-[13px] text-foreground">{template.from}</div>
          </div>
        )}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Created</div>
          <div className="text-[13px] text-foreground">
            {new Date(template.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="preview" className="text-[12px]">Preview</TabsTrigger>
          <TabsTrigger value="html" className="text-[12px]">HTML</TabsTrigger>
          <TabsTrigger value="text" disabled={!template.text} className="text-[12px]">Plain Text</TabsTrigger>
          <TabsTrigger value="variables" className="text-[12px]">
            Variables{template.variables.length ? ` (${template.variables.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <p className="text-[11px] text-muted-foreground mb-2">
            Placeholders like <code className="font-mono text-foreground/70">{"{{{VAR}}}"}</code> are shown unrendered — variables are interpolated when an email is sent.
          </p>
          <iframe
            srcDoc={template.html}
            sandbox=""
            className="w-full min-h-[500px] border border-border rounded-lg bg-white"
            title="Template HTML preview"
          />
        </TabsContent>

        <TabsContent value="html" className="mt-4">
          <pre className="bg-muted/30 border border-border rounded-lg p-4 text-[12px] font-mono whitespace-pre-wrap overflow-x-auto text-foreground/80">
            {template.html}
          </pre>
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          {template.text ? (
            <pre className="bg-muted/30 border border-border rounded-lg p-4 text-[12px] font-mono whitespace-pre-wrap text-foreground/80">
              {template.text}
            </pre>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-[13px]">No plain text content</p>
          )}
        </TabsContent>

        <TabsContent value="variables" className="mt-4">
          {template.variables.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">
                <div className="flex-1">Key</div>
                <div className="w-[100px]">Type</div>
                <div className="w-[160px]">Fallback</div>
              </div>
              {template.variables.map((v) => (
                <div key={v.key} className="flex items-center gap-3 px-4 py-2.5 text-[13px] border-b border-border last:border-b-0">
                  <div className="flex-1 font-mono text-foreground/90">{v.key}</div>
                  <div className="w-[100px] text-muted-foreground">{v.type}</div>
                  <div className="w-[160px] text-muted-foreground font-mono">
                    {v.fallback_value !== undefined ? String(v.fallback_value) : "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-[13px]">No variables defined</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
