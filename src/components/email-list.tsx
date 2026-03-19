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

export function EmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch("/api/emails");
      const data = await res.json();
      setEmails(data.data);
    } catch {
      // Silently retry on next poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 2000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading emails...
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="text-4xl">📭</div>
        <h2 className="text-xl font-semibold">No emails captured yet</h2>
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
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">From</TableHead>
          <TableHead className="w-[200px]">To</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[120px] text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {emails.map((email) => (
          <TableRow key={email.id} className="cursor-pointer">
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
  );
}
