"use client";

import { useEffect, useState } from "react";
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
    return <div className="py-20 text-center text-muted-foreground text-[13px]">Loading stats...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[15px] font-medium">Dashboard</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Emails", value: stats.total },
          { label: "Today", value: stats.today },
          {
            label: "Avg Size",
            value: stats.avgSizeBytes < 1024
              ? `${stats.avgSizeBytes} B`
              : `${(stats.avgSizeBytes / 1024).toFixed(1)} KB`,
          },
          { label: "With Attachments", value: stats.withAttachments },
        ].map((card) => (
          <div key={card.label} className="border border-border rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{card.label}</div>
            <div className="text-2xl font-semibold mt-1">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Top senders */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-medium">Top Senders</h3>
        </div>
        <div className="p-4">
          {stats.topSenders.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No emails yet</p>
          ) : (
            <div className="space-y-2.5">
              {stats.topSenders.map((sender) => (
                <div key={sender.address} className="flex items-center justify-between">
                  <span className="text-[13px] font-mono text-foreground/80 truncate">{sender.address}</span>
                  <span className="text-[13px] text-muted-foreground tabular-nums">{sender.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-medium">Emails per Hour (last 24h)</h3>
        </div>
        <div className="p-4">
          {stats.emailsPerHour.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No data yet</p>
          ) : (
            <div className="flex items-end gap-[3px] h-28">
              {stats.emailsPerHour.map((bucket) => {
                const max = Math.max(...stats.emailsPerHour.map((b) => b.count));
                const height = max > 0 ? (bucket.count / max) * 100 : 0;
                return (
                  <div
                    key={bucket.hour}
                    className="flex-1 bg-foreground/20 hover:bg-foreground/40 rounded-sm min-w-[3px] transition-colors"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${bucket.hour}: ${bucket.count} email(s)`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
