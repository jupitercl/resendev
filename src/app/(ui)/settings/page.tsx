"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

    // Apply theme immediately
    if (updates.theme) {
      applyTheme(updates.theme);
    }
  };

  const applyTheme = (theme: string) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
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
    return <div className="py-20 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Error Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Error Simulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">API Response Delay (ms)</label>
            <p className="text-xs text-muted-foreground mb-2">
              Simulate network latency on POST /emails
            </p>
            <input
              type="number"
              min="0"
              max="10000"
              step="100"
              value={settings.delayMs}
              onChange={(e) => setSettings({ ...settings, delayMs: parseInt(e.target.value) || 0 })}
              className="w-32 px-3 py-1.5 text-sm border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Error Rate (%)</label>
            <p className="text-xs text-muted-foreground mb-2">
              Percentage of POST /emails requests that return 500 errors
            </p>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.errorRate}
              onChange={(e) => setSettings({ ...settings, errorRate: parseInt(e.target.value) || 0 })}
              className="w-32 px-3 py-1.5 text-sm border rounded-md bg-background"
            />
          </div>
          <Button onClick={() => save({ delayMs: settings.delayMs, errorRate: settings.errorRate })} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {saved && <span className="text-sm text-green-600 ml-2">Saved</span>}
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <Button
                key={t}
                variant={settings.theme === t ? "default" : "outline"}
                size="sm"
                onClick={() => save({ theme: t })}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Button variant="outline" onClick={exportEmails}>
              Export all emails as JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
