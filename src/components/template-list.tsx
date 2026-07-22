"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTemplateStream } from "@/hooks/use-template-stream";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Template } from "@/types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TemplateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 shrink-0">
      <rect width="18" height="7" x="3" y="3" rx="1" />
      <rect width="9" height="7" x="3" y="14" rx="1" />
      <rect width="5" height="7" x="16" y="14" rx="1" />
    </svg>
  );
}

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.data);
    } catch {
      // Will retry via SSE reconnect
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const { connected } = useTemplateStream((event) => {
    switch (event.type) {
      case "template:new":
        setTemplates((prev) => [event.data, ...prev.filter((t) => t.id !== event.data.id)]);
        break;
      case "template:updated":
        setTemplates((prev) => prev.map((t) => (t.id === event.data.id ? event.data : t)));
        break;
      case "template:deleted":
        setTemplates((prev) => prev.filter((t) => t.id !== event.data.id));
        break;
    }
  });

  const publish = async (id: string) => {
    const res = await fetch(`/api/templates/${id}/publish`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success("Template published");
    } else {
      toast.error("Failed to publish template");
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deleted");
    } else {
      toast.error("Failed to delete template");
    }
  };

  if (loading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-3 border-b border-border">
            <div className="h-3 w-3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-[180px] rounded bg-muted animate-pulse" />
            <div className="h-3 w-[70px] rounded bg-muted animate-pulse" />
            <div className="h-3 flex-1 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
            <rect width="18" height="7" x="3" y="3" rx="1" />
            <rect width="9" height="7" x="3" y="14" rx="1" />
            <rect width="5" height="7" x="16" y="14" rx="1" />
          </svg>
        </div>
        <div>
          <h2 className="text-[15px] font-medium">No templates yet</h2>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
            Create a template through the Resend SDK or API, then publish it to use it when sending.
          </p>
        </div>
        <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs text-left font-mono text-muted-foreground max-w-lg w-full overflow-x-auto">
{`curl -X POST http://localhost:3099/templates \\
  -H "Authorization: Bearer re_test_123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "welcome",
    "subject": "Hi {{{NAME}}}",
    "html": "<p>Welcome, {{{NAME}}}!</p>",
    "variables": [
      { "key": "NAME", "type": "string", "fallback_value": "there" }
    ]
  }'`}
        </pre>
        {connected && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Listening for templates
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-end mb-1 px-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {connected && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
          {templates.length} template{templates.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center gap-3 px-3 py-2 text-[12px] text-muted-foreground border-b border-border">
        <div className="flex-1">Name</div>
        <div className="w-[90px] hidden sm:block">Status</div>
        <div className="w-[70px] text-center hidden md:block">Vars</div>
        <div className="w-[90px] text-right">Created</div>
        <div className="w-[140px] text-right">Actions</div>
      </div>

      {/* Rows */}
      <div>
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex items-center gap-3 px-3 py-2.5 border-b border-border transition-colors group hover:bg-accent/50"
          >
            <Link href={`/templates-view/${template.id}`} className="flex-1 min-w-0 flex items-center gap-2">
              <TemplateIcon />
              <span className="text-[13px] text-foreground/90 truncate">{template.name}</span>
              {template.alias && (
                <span className="text-[11px] text-muted-foreground font-mono truncate">{template.alias}</span>
              )}
            </Link>
            <div className="w-[90px] hidden sm:block">
              <Badge variant={template.status === "published" ? "default" : "secondary"} className="text-[11px]">
                {template.status}
              </Badge>
            </div>
            <div className="w-[70px] text-center hidden md:block text-[12px] text-muted-foreground">
              {template.variables.length}
            </div>
            <div className="w-[90px] text-right text-[12px] text-muted-foreground">
              {formatTime(template.created_at)}
            </div>
            <div className="w-[140px] flex items-center justify-end gap-3">
              {template.status !== "published" && (
                <button
                  onClick={() => publish(template.id)}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Publish
                </button>
              )}
              <button
                onClick={() => remove(template.id, template.name)}
                className="text-[12px] text-muted-foreground hover:text-destructive transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
