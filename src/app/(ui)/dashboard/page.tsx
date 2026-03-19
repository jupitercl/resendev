"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmailStats } from "@/lib/store";

export default function DashboardPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    }
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return <div className="py-20 text-center text-muted-foreground">Loading stats...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgSizeBytes < 1024
                ? `${stats.avgSizeBytes} B`
                : `${(stats.avgSizeBytes / 1024).toFixed(1)} KB`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withAttachments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top senders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Senders</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topSenders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No emails yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topSenders.map((sender) => (
                <div key={sender.address} className="flex items-center justify-between">
                  <span className="text-sm font-mono truncate">{sender.address}</span>
                  <span className="text-sm text-muted-foreground">{sender.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Emails per Hour (last 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.emailsPerHour.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {stats.emailsPerHour.map((bucket) => {
                const max = Math.max(...stats.emailsPerHour.map((b) => b.count));
                const height = max > 0 ? (bucket.count / max) * 100 : 0;
                return (
                  <div
                    key={bucket.hour}
                    className="flex-1 bg-primary rounded-t min-w-1"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${bucket.hour}: ${bucket.count} email(s)`}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
