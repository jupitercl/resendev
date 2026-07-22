"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreateTemplateRequest, TemplateVariable } from "@/types";

const inputClass =
  "w-full px-3 py-1.5 text-[13px] border border-border rounded-md bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

interface VariableRow {
  key: string;
  type: "string" | "number";
  fallback: string;
}

export function TemplateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [variables, setVariables] = useState<VariableRow[]>([]);
  const [saving, setSaving] = useState(false);

  const addVariable = () =>
    setVariables((prev) => [...prev, { key: "", type: "string", fallback: "" }]);

  const updateVariable = (index: number, patch: Partial<VariableRow>) =>
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const removeVariable = (index: number) =>
    setVariables((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!html.trim()) {
      toast.error("HTML is required");
      return;
    }

    const parsedVariables: TemplateVariable[] = variables
      .filter((v) => v.key.trim())
      .map((v) => {
        const variable: TemplateVariable = { key: v.key.trim(), type: v.type };
        if (v.fallback.trim()) {
          variable.fallback_value = v.type === "number" ? Number(v.fallback) : v.fallback;
        }
        return variable;
      });

    const payload: CreateTemplateRequest = {
      name: name.trim(),
      html,
      ...(alias.trim() && { alias: alias.trim() }),
      ...(subject.trim() && { subject: subject.trim() }),
      ...(from.trim() && { from: from.trim() }),
      ...(replyTo.trim() && { reply_to: replyTo.trim() }),
      ...(text.trim() && { text }),
      ...(parsedVariables.length > 0 && { variables: parsedVariables }),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to create template");
        return;
      }
      const template = await res.json();
      toast.success("Template created");
      router.push(`/templates-view/${template.id}`);
    } catch {
      toast.error("Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
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

      <h1 className="text-[22px] font-semibold tracking-tight">New template</h1>

      {/* Fields */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-medium">Details</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[13px] font-medium">Name <span className="text-destructive">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="order-confirmation" className={`${inputClass} mt-1.5`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium">Alias</label>
              <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="order-confirm" className={`${inputClass} mt-1.5`} />
            </div>
            <div>
              <label className="text-[13px] font-medium">From</label>
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="shop@example.com" className={`${inputClass} mt-1.5`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your order {{{ORDER}}}" className={`${inputClass} mt-1.5`} />
            </div>
            <div>
              <label className="text-[13px] font-medium">Reply-To</label>
              <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="support@example.com" className={`${inputClass} mt-1.5`} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-medium">Content</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[13px] font-medium">HTML <span className="text-destructive">*</span></label>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-1.5">
              Use <code className="font-mono text-foreground/70">{"{{{VAR}}}"}</code> placeholders for variables.
            </p>
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={8} placeholder="<p>Hi {{{NAME}}}, ...</p>" className={`${inputClass} font-mono`} />
          </div>
          <div>
            <label className="text-[13px] font-medium">Plain Text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Hi {{{NAME}}}, ..." className={`${inputClass} font-mono mt-1.5`} />
          </div>
        </div>
      </div>

      {/* Variables */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-[13px] font-medium">Variables</h3>
          <button onClick={addVariable} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            + Add variable
          </button>
        </div>
        <div className="p-4">
          {variables.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No variables. Add one to define placeholder fallbacks.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground px-1">
                <div className="flex-1">Key</div>
                <div className="w-[110px]">Type</div>
                <div className="flex-1">Fallback</div>
                <div className="w-6" />
              </div>
              {variables.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={v.key} onChange={(e) => updateVariable(i, { key: e.target.value })} placeholder="NAME" className={`${inputClass} flex-1 font-mono`} />
                  <select value={v.type} onChange={(e) => updateVariable(i, { type: e.target.value as "string" | "number" })} className={`${inputClass} w-[110px]`}>
                    <option value="string">string</option>
                    <option value="number">number</option>
                  </select>
                  <input value={v.fallback} onChange={(e) => updateVariable(i, { fallback: e.target.value })} placeholder="optional" className={`${inputClass} flex-1`} />
                  <button onClick={() => removeVariable(i)} className="w-6 text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={saving}
          className="px-3 py-1.5 text-[12px] font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create template"}
        </button>
        <button
          onClick={() => router.push("/templates-view")}
          className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-md hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <span className="text-[11px] text-muted-foreground ml-auto">Created as a draft — publish it to send with it.</span>
      </div>
    </div>
  );
}
