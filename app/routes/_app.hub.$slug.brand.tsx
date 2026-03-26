import { useOutletContext, useParams, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.brand";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { data: client } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return { error: "Client not found" };

  if (intent === "save_brand") {
    const updates: Record<string, any> = {};
    for (const [key, value] of form.entries()) {
      if (key === "intent") continue;
      updates[key] = value;
    }
    // Use service role for reliable saves (RLS can block user-scoped updates)
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    const res = await fetch(`${SB_URL}/rest/v1/msg_brand_config?client_id=eq.${client.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_SERVICE_KEY}`,
        "apikey": SB_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { error: `Save failed: ${errText}` };
    }
    return { success: true };
  }

  // Custom rules (stored as JSON array in brand_config.custom_rules)
  if (intent === "save_rules") {
    const rulesJson = form.get("rules") as string;
    await supabase.from("msg_brand_config").update({ custom_rules: rulesJson }).eq("client_id", client.id);
    return { success: true };
  }

  // Blocked topics CRUD
  if (intent === "add_blocked") {
    await supabase.from("msg_blocked_topics").insert({ client_id: client.id, topic: form.get("topic"), reason: form.get("reason") || null });
    return { success: true };
  }
  if (intent === "update_blocked") {
    await supabase.from("msg_blocked_topics").update({ topic: form.get("topic"), reason: form.get("reason") || null }).eq("id", form.get("id"));
    return { success: true };
  }
  if (intent === "remove_blocked") {
    await supabase.from("msg_blocked_topics").delete().eq("id", form.get("id"));
    return { success: true };
  }

  return {};
}

export default function BrandIdentity() {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const { slug } = useParams();
  const data = allClientData[slug!] || {};
  const client = data.client || {};
  const brand = data.brand || {};
  const blocked = data.blocked || [];
  const fetcher = useFetcher();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("intent", "save_brand");
    fetcher.submit(formData, { method: "post" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 720, width: "100%" }}>
      <div className="hub-page-header">
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>Brand Identity</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>{client.name}</p>
        </div>
        {saved && <span style={{ color: "#2e7d32", fontSize: 13, fontWeight: 600 }}>Saved</span>}
      </div>

      <form onSubmit={handleSubmit}>
        <Card title="Assistant Identity">
          <Field label="Assistant Name" name="assistant_name" value={brand?.assistant_name || ""} hint="The name your AI assistant uses (e.g. Cassie)" />
          <TextArea label="Brand Voice" name="tone" value={brand?.tone || "friendly"} rows={3} hint="Describe how the assistant should sound (e.g. friendly, warm and professional, keeps it brief)" />
          <Field label="Greeting Style" name="greeting_style" value={brand?.greeting_style || "Hi [name]"} hint="Use [name] as placeholder for lead's first name" />
        </Card>

        <Card title="Response Behaviour">
          <Field label="Post-Booking Response" name="post_booking_response" value={brand?.post_booking_response || ""} hint="What to say when a lead confirms they booked" />

        </Card>

        <button type="submit" style={{ ...btnPrimary, marginBottom: 32 }}>Save Brand Identity</button>
      </form>

      {/* ==================== RULES & RESTRICTIONS ==================== */}
      <RulesSection brand={brand} blocked={blocked} />
    </div>
  );
}

// ==================== RULES & RESTRICTIONS ====================
function RulesSection({ brand, blocked }: { brand: any; blocked: any[] }) {
  const fetcher = useFetcher();

  // Parse custom rules from JSON string or array
  const parseRules = (): string[] => {
    const raw = brand?.custom_rules;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
    return [];
  };

  const [rules, setRules] = useState<string[]>(parseRules());
  const [addingRule, setAddingRule] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editRuleText, setEditRuleText] = useState("");

  const [addingBlocked, setAddingBlocked] = useState(false);
  const [editingBlocked, setEditingBlocked] = useState<string | null>(null);
  const [editBlockedTopic, setEditBlockedTopic] = useState("");
  const [editBlockedReason, setEditBlockedReason] = useState("");

  const saveRules = (updated: string[]) => {
    setRules(updated);
    const formData = new FormData();
    formData.set("intent", "save_rules");
    formData.set("rules", JSON.stringify(updated));
    fetcher.submit(formData, { method: "post" });
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    saveRules([...rules, newRule.trim()]);
    setNewRule("");
    setAddingRule(false);
  };

  const updateRule = (idx: number) => {
    if (!editRuleText.trim()) return;
    const updated = [...rules];
    updated[idx] = editRuleText.trim();
    saveRules(updated);
    setEditingRule(null);
  };

  const deleteRule = (idx: number) => {
    saveRules(rules.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* CUSTOM RULES */}
      <Card title="Conversation Rules">
        <p style={{ fontSize: 12, color: "#8a8478", marginBottom: 16 }}>
          Behavioural instructions that control how the AI responds. These are injected directly into the system prompt.
        </p>

        {rules.length === 0 && !addingRule && (
          <div style={{ padding: 20, textAlign: "center", color: "#b0a89a", fontSize: 13 }}>No custom rules yet</div>
        )}

        {rules.map((rule, idx) => (
          <div key={idx} style={ruleRow}>
            {editingRule === idx ? (
              <div style={{ flex: 1 }}>
                <textarea
                  value={editRuleText}
                  onChange={e => setEditRuleText(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => updateRule(idx)} style={btnSave}>Save</button>
                  <button type="button" onClick={() => setEditingRule(null)} style={btnCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, fontSize: 13, color: "#3b3b3b", lineHeight: 1.5 }}>{rule}</div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <button type="button" onClick={() => { setEditingRule(idx); setEditRuleText(rule); }} style={btnEdit}>Edit</button>
                  <button type="button" onClick={() => { if (confirm("Delete this rule?")) deleteRule(idx); }} style={btnDelete}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}

        {addingRule ? (
          <div style={{ marginTop: 12 }}>
            <textarea
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              rows={2}
              placeholder="e.g. Always ask about their preferred appointment time"
              style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={addRule} style={btnSave}>Add Rule</button>
              <button type="button" onClick={() => { setAddingRule(false); setNewRule(""); }} style={btnCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingRule(true)} style={{ ...btnPrimary, marginTop: 12 }}>Add Rule</button>
        )}
      </Card>

      {/* BLOCKED TOPICS */}
      <Card title="Blocked Topics">
        <p style={{ fontSize: 12, color: "#8a8478", marginBottom: 16 }}>
          Topics the AI must never discuss with leads. If a lead asks about these, the AI will deflect or escalate.
        </p>

        {blocked.length === 0 && !addingBlocked && (
          <div style={{ padding: 20, textAlign: "center", color: "#b0a89a", fontSize: 13 }}>No blocked topics yet</div>
        )}

        {blocked.map((b: any) => (
          <div key={b.id} style={ruleRow}>
            {editingBlocked === b.id ? (
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={labelSmall}>Topic</label>
                  <input value={editBlockedTopic} onChange={e => setEditBlockedTopic(e.target.value)} style={inputStyle} autoFocus />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={labelSmall}>Reason (optional)</label>
                  <input value={editBlockedReason} onChange={e => setEditBlockedReason(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => {
                    if (!editBlockedTopic.trim()) return;
                    const formData = new FormData();
                    formData.set("intent", "update_blocked");
                    formData.set("id", b.id);
                    formData.set("topic", editBlockedTopic.trim());
                    formData.set("reason", editBlockedReason.trim());
                    fetcher.submit(formData, { method: "post" });
                    setEditingBlocked(null);
                  }} style={btnSave}>Save</button>
                  <button type="button" onClick={() => setEditingBlocked(null)} style={btnCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#3b3b3b" }}>{b.topic}</div>
                  {b.reason && <div style={{ fontSize: 12, color: "#8a8478", marginTop: 2 }}>{b.reason}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <button type="button" onClick={() => { setEditingBlocked(b.id); setEditBlockedTopic(b.topic); setEditBlockedReason(b.reason || ""); }} style={btnEdit}>Edit</button>
                  <button type="button" onClick={() => {
                    if (!confirm("Delete this blocked topic?")) return;
                    const formData = new FormData();
                    formData.set("intent", "remove_blocked");
                    formData.set("id", b.id);
                    fetcher.submit(formData, { method: "post" });
                  }} style={btnDelete}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}

        {addingBlocked ? (
          <AddBlockedForm
            onSave={(topic, reason) => {
              const formData = new FormData();
              formData.set("intent", "add_blocked");
              formData.set("topic", topic);
              formData.set("reason", reason);
              fetcher.submit(formData, { method: "post" });
              setAddingBlocked(false);
            }}
            onCancel={() => setAddingBlocked(false)}
          />
        ) : (
          <button type="button" onClick={() => setAddingBlocked(true)} style={{ ...btnPrimary, marginTop: 12 }}>Add Blocked Topic</button>
        )}
      </Card>
    </div>
  );
}

function AddBlockedForm({ onSave, onCancel }: { onSave: (topic: string, reason: string) => void; onCancel: () => void }) {
  const [topic, setTopic] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={labelSmall}>Topic</label>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Competitor pricing" style={inputStyle} autoFocus />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={labelSmall}>Reason (optional)</label>
        <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why this topic is blocked" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => { if (topic.trim()) onSave(topic.trim(), reason.trim()); }} style={btnSave}>Add Topic</button>
        <button type="button" onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: "#3b3b3b", marginTop: 0, marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, name, value, hint, type }: { label: string; name: string; value: any; hint?: string; type?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input name={name} defaultValue={value} type={type || "text"} style={inputStyle} />
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  );
}
function TextArea({ label, name, value, hint, rows }: { label: string; name: string; value: any; hint?: string; rows?: number }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <textarea name={name} defaultValue={value} rows={rows || 3} style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} />
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  );
}

const ruleRow: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eee8dc" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 6 };
const labelSmall: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#8a8478", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" as any };
const hintStyle: React.CSSProperties = { fontSize: 11, color: "#8a8478", marginTop: 4 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnEdit: React.CSSProperties = { padding: "5px 12px", background: "#eee8dc", color: "#3b3b3b", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnDelete: React.CSSProperties = { padding: "5px 12px", background: "#ffebee", color: "#c62828", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnSave: React.CSSProperties = { padding: "8px 16px", background: "#2e7d32", color: "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnCancel: React.CSSProperties = { padding: "8px 16px", background: "#f5f5f5", color: "#666", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
