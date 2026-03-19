"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEmailStream } from "@/hooks/use-email-stream";
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

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatRecipients(to: string[]): string {
  if (to.length === 1) return to[0];
  return `${to[0]} +${to.length - 1}`;
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

  // Initial fetch
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // SSE real-time updates
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

  // Use search results when available, otherwise use live emails
  const displayEmails = searchResults ?? emails;

  // Keyboard navigation
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
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayEmails.map((e) => e.id)));
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) => fetch(`/emails/${id}`, { method: "DELETE", headers: { Authorization: "Bearer resendev" } }))
    );
    setSelectedIds(new Set());
  };

  const clearAll = async () => {
    await fetch("/api/emails", { method: "DELETE" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading emails...
      </div>
    );
  }

  if (displayEmails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="text-4xl">📭</div>
        <h2 className="text-xl font-semibold">{searchResults ? "No results found" : "No emails captured yet"}</h2>
        <p className="text-muted-foreground max-w-md">
          Point your app at <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">http://localhost:3099</code> and
          send an email through the Resend SDK to see it here.
        </p>
        <pre className="bg-muted rounded-lg p-4 text-sm text-left font-mono max-w-lg w-full overflow-x-auto">
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
          <p className="text-xs text-muted-foreground">
            Listening for emails...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <button
                onClick={deleteSelected}
                className="text-sm text-destructive hover:underline"
              >
                Delete selected
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {displayEmails.length} email{displayEmails.length !== 1 ? "s" : ""}
            {connected && " · live"}
          </span>
          <button
            onClick={clearAll}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Clear all
          </button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <input
                type="checkbox"
                checked={selectedIds.size === displayEmails.length && displayEmails.length > 0}
                onChange={toggleSelectAll}
                className="rounded"
              />
            </TableHead>
            <TableHead className="w-[200px]">From</TableHead>
            <TableHead className="w-[200px]">To</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[120px] text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEmails.map((email, index) => (
            <TableRow
              key={email.id}
              className={`cursor-pointer ${focusIndex === index ? "bg-accent" : ""}`}
              onClick={() => setFocusIndex(index)}
            >
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.has(email.id)}
                  onChange={() => toggleSelect(email.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded"
                />
              </TableCell>
              <TableCell>
                <Link href={`/view/${email.id}`} className="block truncate hover:underline">
                  {email.from}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/view/${email.id}`} className="block truncate">
                  {formatRecipients(email.to)}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/view/${email.id}`} className="block truncate font-medium">
                  {email.subject}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={email.last_event === "delivered" ? "default" : "destructive"}>
                  {email.last_event}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {formatTime(email.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
