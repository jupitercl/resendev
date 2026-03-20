"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface TemplateField {
  name: string;
  label: string;
  defaultValue: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  subject: string;
  fields: TemplateField[];
}

export default function PreviewPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [props, setProps] = useState<Record<string, string>>({});
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch templates
  useEffect(() => {
    fetch("/api/preview")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          const first = data.templates[0];
          setSelectedId(first.id);
          const defaults: Record<string, string> = {};
          first.fields.forEach((f: TemplateField) => {
            defaults[f.name] = f.defaultValue;
          });
          setProps(defaults);
        }
      });
  }, []);

  // Render template
  const renderTemplate = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedId, props }),
      });
      const data = await res.json();
      setHtml(data.html);
    } catch {
      toast.error("Failed to render template");
    } finally {
      setLoading(false);
    }
  }, [selectedId, props]);

  // Render on selection/props change
  useEffect(() => {
    const timer = setTimeout(renderTemplate, 300);
    return () => clearTimeout(timer);
  }, [renderTemplate]);

  const selectTemplate = (id: string) => {
    const tmpl = templates.find((t) => t.id === id);
    if (!tmpl) return;
    setSelectedId(id);
    const defaults: Record<string, string> = {};
    tmpl.fields.forEach((f) => {
      defaults[f.name] = f.defaultValue;
    });
    setProps(defaults);
  };

  const updateProp = (name: string, value: string) => {
    setProps((prev) => ({ ...prev, [name]: value }));
  };

  const selectedTemplate = templates.find((t) => t.id === selectedId);

  const sendTestEmail = async () => {
    if (!selectedTemplate || !html) return;
    setSending(true);

    const subject = selectedTemplate.subject.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => props[key] || key,
    );

    try {
      const res = await fetch("/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer resendev-preview",
        },
        body: JSON.stringify({
          from: `${props.company || "Acme"} <noreply@example.com>`,
          to: "preview@resendev.local",
          subject,
          html,
        }),
      });
      const data = await res.json();
      toast.success(`Email sent — ${data.id}`);
    } catch {
      toast.error("Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">React Email Preview</h2>
        <Button onClick={sendTestEmail} disabled={sending || !html}>
          {sending ? "Sending..." : "Send to Resendev"}
        </Button>
      </div>

      {/* Work in progress banner */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
        <strong>Preview is in development.</strong>{" "}
        Currently showing built-in sample templates. Custom template support (paste your own HTML or React Email JSX) is coming soon.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Left panel: template picker + props editor */}
        <div className="space-y-4">
          {/* Template selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => selectTemplate(tmpl.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedId === tmpl.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{tmpl.name}</div>
                  <div className={`text-xs ${selectedId === tmpl.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {tmpl.description}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Props editor */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name}>
                    <label className="text-xs font-medium text-muted-foreground">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={props[field.name] || ""}
                      onChange={(e) => updateProp(field.name, e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-sm border rounded-md bg-background"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel: preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Preview</span>
              {loading && <span className="text-xs text-muted-foreground">Rendering...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {html ? (
              <iframe
                srcDoc={html}
                sandbox=""
                className="w-full min-h-[600px] border rounded-lg bg-white"
                title="React Email preview"
              />
            ) : (
              <div className="flex items-center justify-center min-h-[600px] text-muted-foreground">
                Select a template to preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
