"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useEmailStream } from "@/hooks/use-email-stream";
import { toast } from "sonner";
import type { Email } from "@/types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRecipients(to: string[]): string {
  if (to.length === 1) return to[0];
  return `${to[0]} +${to.length - 1}`;
}

function EnvelopeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 shrink-0">
      <rect width="20" height="16" x="2" y="4" rx="2" stroke="currentColor" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="currentColor" />
    </svg>
  );
}

interface EmailListProps {
  searchResults?: Email[] | null;
}

export function EmailList({ searchResults }: EmailListProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusIndex, setFocusIndex] = useState(-1);

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch("/api/emails");
      const data = await res.json();
      setEmails(data.data);
    } catch {
      // Will retry via SSE reconnect
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const { connected } = useEmailStream((event) => {
    switch (event.type) {
      case "email:new":
        setEmails((prev) => [event.data, ...prev]);
        break;
      case "email:deleted":
        setEmails((prev) => prev.filter((e) => e.id !== event.data.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(event.data.id);
          return next;
        });
        break;
      case "emails:cleared":
        setEmails([]);
        setSelectedIds(new Set());
        break;
    }
  });

  const displayEmails = searchResults ?? emails;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "j":
          setFocusIndex((prev) => Math.min(prev + 1, displayEmails.length - 1));
          break;
        case "k":
          setFocusIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          if (focusIndex >= 0 && focusIndex < displayEmails.length) {
            window.location.href = `/view/${displayEmails[focusIndex].id}`;
          }
          break;
        case "x":
          if (focusIndex >= 0 && focusIndex < displayEmails.length) {
            const id = displayEmails[focusIndex].id;
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayEmails, focusIndex]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayEmails.map((e) => e.id)));
    }
  };

  const deleteSelected = async () => {
    const count = selectedIds.size;
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) => fetch(`/emails/${id}`, { method: "DELETE", headers: { Authorization: "Bearer resendev" } }))
    );
    setSelectedIds(new Set());
    toast.success(`Deleted ${count} email${count !== 1 ? "s" : ""}`);
  };

  const clearAll = async () => {
    if (!confirm("Delete all captured emails?")) return;
    const res = await fetch("/api/emails", { method: "DELETE" });
    const data = await res.json();
    toast.success(`Cleared ${data.deleted} email${data.deleted !== 1 ? "s" : ""}`);
  };

  if (loading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-3 border-b border-border">
            <div className="h-3 w-3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-[140px] rounded bg-muted animate-pulse" />
            <div className="h-3 w-[140px] rounded bg-muted animate-pulse hidden md:block" />
            <div className="h-3 flex-1 rounded bg-muted animate-pulse" />
            <div className="h-3 w-[60px] rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (displayEmails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-[15px] font-medium">{searchResults ? "No results found" : "No emails captured yet"}</h2>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
            Point your app at <code className="text-foreground/70 bg-muted px-1 py-0.5 rounded text-xs font-mono">http://localhost:3099</code> and
            send an email through the Resend SDK.
          </p>
        </div>
        <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs text-left font-mono text-muted-foreground max-w-lg w-full overflow-x-auto">
{`curl -X POST http://localhost:3099/emails \\
  -H "Authorization: Bearer re_test_123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "test@example.com",
    "to": "user@example.com",
    "subject": "Hello!",
    "html": "<h1>Hi there</h1>"
  }'`}
        </pre>
        {connected && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Listening for emails
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-1 px-3">
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <span className="text-[12px] text-muted-foreground">{selectedIds.size} selected</span>
              <button
                onClick={deleteSelected}
                className="text-[12px] text-destructive hover:underline"
              >
                Delete
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {connected && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            {displayEmails.length} email{displayEmails.length !== 1 ? "s" : ""}
          </div>
          <button
            onClick={clearAll}
            className="text-[12px] text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center gap-3 px-3 py-2 text-[12px] text-muted-foreground border-b border-border">
        <div className="w-5">
          <input
            type="checkbox"
            checked={selectedIds.size === displayEmails.length && displayEmails.length > 0}
            onChange={toggleSelectAll}
            className="rounded border-muted-foreground/30 bg-transparent"
          />
        </div>
        <div className="w-[200px]">To</div>
        <div className="w-[80px] hidden sm:block">Status</div>
        <div className="flex-1">Subject</div>
        <div className="w-[90px] text-right">Sent</div>
      </div>

      {/* Rows */}
      <div>
        {displayEmails.map((email, index) => (
          <Link
            key={email.id}
            href={`/view/${email.id}`}
            className={`flex items-center gap-3 px-3 py-2.5 border-b border-border transition-colors group ${
              focusIndex === index ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => setFocusIndex(index)}
          >
            <div className="w-5" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.has(email.id)}
                onChange={() => toggleSelect(email.id)}
                className="rounded border-muted-foreground/30 bg-transparent"
              />
            </div>
            <div className="w-[200px] truncate flex items-center gap-2">
              <EnvelopeIcon />
              <span className="text-[13px] text-foreground/90 truncate">
                {formatRecipients(email.to)}
              </span>
            </div>
            <div className="w-[80px] hidden sm:block">
              <span className={`text-[12px] ${
                email.last_event === "delivered"
                  ? "text-green-400"
                  : email.last_event === "bounced"
                    ? "text-red-400"
                    : "text-muted-foreground"
              }`}>
                {email.last_event.charAt(0).toUpperCase() + email.last_event.slice(1)}
              </span>
            </div>
            <div className="flex-1 truncate">
              <span className="text-[13px] text-foreground/70 group-hover:text-foreground/90">
                {email.subject}
              </span>
            </div>
            <div className="w-[90px] text-right text-[12px] text-muted-foreground">
              {formatTime(email.created_at)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
