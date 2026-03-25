"use client";

import { useEffect, useState } from "react";

interface Settings {
  delayMs: number;
  errorRate: number;
  theme: "light" | "dark" | "system";
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  const save = async (updates: Partial<Settings>) => {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setSettings(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportEmails = async () => {
    const res = await fetch("/api/emails");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resendev-emails-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!settings) {
    return <div className="py-20 text-center text-muted-foreground text-[13px]">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-[15px] font-medium">Settings</h2>

      {/* Error Simulation */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-medium">Error Simulation</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[13px] font-medium">API Response Delay (ms)</label>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
              Simulate network latency on POST /emails
            </p>
            <input
              type="number"
              min="0"
              max="10000"
              step="100"
              value={settings.delayMs}
              onChange={(e) => setSettings({ ...settings, delayMs: parseInt(e.target.value) || 0 })}
              className="w-32 px-3 py-1.5 text-[13px] border border-border rounded-md bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium">Error Rate (%)</label>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
              Percentage of POST /emails requests that return 500 errors
            </p>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.errorRate}
              onChange={(e) => setSettings({ ...settings, errorRate: parseInt(e.target.value) || 0 })}
              className="w-32 px-3 py-1.5 text-[13px] border border-border rounded-md bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => save({ delayMs: settings.delayMs, errorRate: settings.errorRate })}
              disabled={saving}
              className="px-3 py-1.5 text-[12px] font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {saved && <span className="text-[12px] text-green-400">Saved</span>}
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-medium">Data</h3>
        </div>
        <div className="p-4">
          <button
            onClick={exportEmails}
            className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-md hover:bg-accent transition-colors"
          >
            Export all emails as JSON
          </button>
        </div>
      </div>
    </div>
  );
}
