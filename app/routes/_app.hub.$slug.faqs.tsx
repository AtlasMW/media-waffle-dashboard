import { useOutletContext, useParams, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.faqs";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { data: client } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {};

  if (intent === "add") {
    await supabase.from("msg_faqs").insert({
      client_id: client.id,
      category: form.get("category") || "general",
      question: form.get("question"),
      answer: form.get("answer") || (form.get("response_type") === "escalate" ? "Escalate to owner" : ""),
      response_type: form.get("response_type") || "direct",
      profile: form.get("profile") || "shared",
      source: "manual",
      is_active: true,
    });
  } else if (intent === "toggle") {
    const id = form.get("id") as string;
    const active = form.get("is_active") === "true";
    await supabase.from("msg_faqs").update({ is_active: !active }).eq("id", id);
  } else if (intent === "update") {
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_faqs?id=eq.${form.get("id")}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ question: form.get("question"), answer: form.get("answer"), ...(form.get("profile") ? { profile: form.get("profile") } : {}), ...(form.get("response_type") ? { response_type: form.get("response_type") } : {}) }),
    });
  } else if (intent === "delete") {
    await supabase.from("msg_faqs").delete().eq("id", form.get("id"));
  } else if (intent === "approve_suggestion") {
    const patternId = form.get("pattern_id") as string;
    const { data: pattern } = await supabase.from("msg_learned_patterns").select("*").eq("id", patternId).single();
    if (pattern) {
      await supabase.from("msg_faqs").insert({
        client_id: client.id,
        category: "general",
        question: pattern.example_inbound,
        answer: form.get("answer") || pattern.suggested_answer,
        source: "learned",
        is_active: true,
      });
      await supabase.from("msg_learned_patterns").update({ status: "approved" }).eq("id", patternId);
    }
  } else if (intent === "reject_suggestion") {
    await supabase.from("msg_learned_patterns").update({ status: "rejected" }).eq("id", form.get("pattern_id"));
  }
  return { success: true };
}

export default function FAQs() {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const { slug } = useParams();
  const data = allClientData[slug!] || {};
  const client = data.client || {};
  const faqs = data.faqs || [];
  const suggested = data.suggested || [];
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileFilter, setProfileFilter] = useState<string>("all");

  const profileTabs = [
    { key: "all", label: "All" },
    { key: "shared", label: "Shared" },
    { key: "promo", label: "Promo" },
    { key: "general", label: "General" },
  ];

  const filteredFaqs = profileFilter === "all" ? faqs : faqs.filter((f: any) => f.profile === profileFilter);

  const profileColors: Record<string, { bg: string; color: string }> = {
    shared: { bg: "#eee8dc", color: "#3b3b3b" },
    promo: { bg: "#e3f2fd", color: "#1565c0" },
    general: { bg: "#e8f5e9", color: "#2e7d32" },
  };

  return (
    <div style={{ maxWidth: 720, width: "100%" }}>
      <div className="hub-page-header">
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>FAQs</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>{client.name}</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>{showAdd ? "Cancel" : "Add FAQ"}</button>
      </div>

      {/* Profile filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#eee8dc", borderRadius: 8, padding: 4 }}>
        {profileTabs.map(t => (
          <button key={t.key} onClick={() => setProfileFilter(t.key)} style={{
            flex: 1, padding: "8px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
            background: profileFilter === t.key ? "#3b3b3b" : "transparent",
            color: profileFilter === t.key ? "#f5f0e8" : "#5a5a5a",
            transition: "all 0.15s",
          }}>
            {t.label} {t.key !== "all" && `(${faqs.filter((f: any) => f.profile === t.key).length})`}
          </button>
        ))}
      </div>

      {suggested.length > 0 && (
        <div style={{ background: "#fffde7", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #fff9c4" }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, margin: "0 0 12px", color: "#f57f17" }}>AI Suggested FAQs ({suggested.length})</h3>
          <p style={{ fontSize: 12, color: "#8a8478", marginBottom: 12 }}>Based on common questions from lead conversations</p>
          {suggested.map((s: any) => (
            <div key={s.id} style={{ background: "white", borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Q: {s.example_inbound}</div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>A: {s.suggested_answer}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="approve_suggestion" />
                  <input type="hidden" name="pattern_id" value={s.id} />
                  <input type="hidden" name="answer" value={s.suggested_answer} />
                  <button type="submit" style={{ ...btnSmall, background: "#e8f5e9", color: "#2e7d32" }}>Approve</button>
                </fetcher.Form>
                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="reject_suggestion" />
                  <input type="hidden" name="pattern_id" value={s.id} />
                  <button type="submit" style={{ ...btnSmall, background: "#ffebee", color: "#c62828" }}>Reject</button>
                </fetcher.Form>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={{ background: "white", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <fetcher.Form method="post" onSubmit={() => setShowAdd(false)}>
            <input type="hidden" name="intent" value="add" />
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Question</label>
              <input name="question" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Response Type</label>
              <select name="response_type" id="add-response-type" defaultValue="direct" style={inputStyle} onChange={(e) => {
                const answerDiv = document.getElementById("add-answer-field")!;
                const answerLabel = document.getElementById("add-answer-label")!;
                const answerInput = document.getElementById("add-answer-input") as HTMLTextAreaElement;
                if (e.target.value === "escalate") {
                  answerLabel.textContent = "Reason (optional)";
                  answerInput.placeholder = "e.g. Medical question, Sensitive topic";
                  answerInput.required = false;
                  answerInput.rows = 1;
                } else if (e.target.value === "instruction") {
                  answerLabel.textContent = "Instruction";
                  answerInput.placeholder = "e.g. Check Fresha for availability, then direct to booking page";
                  answerInput.required = true;
                  answerInput.rows = 3;
                } else {
                  answerLabel.textContent = "Answer";
                  answerInput.placeholder = "The exact reply to send to the lead";
                  answerInput.required = true;
                  answerInput.rows = 3;
                }
              }}>
                <option value="direct">Direct Response (send this answer to the lead)</option>
                <option value="escalate">Escalate (do not reply, escalate to owner)</option>
                <option value="instruction">Instruction (tells AI how to behave, never sent)</option>
              </select>
            </div>
            <div id="add-answer-field" style={{ marginBottom: 12 }}>
              <label id="add-answer-label" style={labelStyle}>Answer</label>
              <textarea id="add-answer-input" name="answer" required rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="The exact reply to send to the lead" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Profile</label>
              <select name="profile" defaultValue="shared" style={inputStyle}>
                <option value="shared">Shared (both profiles)</option>
                <option value="promo">Promo only</option>
                <option value="general">General only</option>
              </select>
            </div>
            <input type="hidden" name="category" value="general" />
            <button type="submit" style={{ ...btnPrimary, background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b", transition: "all 0.3s" }}>{fetcher.state === "submitting" ? "Saving..." : "Save FAQ"}</button>
          </fetcher.Form>
        </div>
      )}

      {filteredFaqs.map((faq: any) => {
        const pc = profileColors[faq.profile] || profileColors.shared;
        if (editingId === faq.id) {
          return (
            <div key={faq.id} style={{ background: "#faf8f5", borderRadius: 8, padding: 20, marginBottom: 8, border: "2px solid #c4a882" }}>
              <fetcher.Form method="post" onSubmit={() => setEditingId(null)}>
                <input type="hidden" name="intent" value="update" />
                <input type="hidden" name="id" value={faq.id} />
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Question</label>
                  <input name="question" defaultValue={faq.question} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Response Type</label>
                  <select name="response_type" defaultValue={faq.response_type || "direct"} style={inputStyle} onChange={(e) => {
                    const label = (e.target as HTMLSelectElement).closest("div")?.parentElement?.querySelector(`[data-edit-label="${faq.id}"]`);
                    if (label) label.textContent = e.target.value === "escalate" ? "Reason (optional)" : e.target.value === "instruction" ? "Instruction" : "Answer";
                  }}>
                    <option value="direct">Direct Response</option>
                    <option value="escalate">Escalate</option>
                    <option value="instruction">Instruction</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label data-edit-label={faq.id} style={labelStyle}>{faq.response_type === "escalate" ? "Reason (optional)" : faq.response_type === "instruction" ? "Instruction" : "Answer"}</label>
                  <textarea name="answer" defaultValue={faq.answer} rows={faq.response_type === "escalate" ? 1 : 3} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Profile</label>
                  <select name="profile" defaultValue={faq.profile || "shared"} style={inputStyle}>
                    <option value="shared">Shared (both profiles)</option>
                    <option value="promo">Promo only</option>
                    <option value="general">General only</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" style={{ ...btnPrimary, background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b", transition: "all 0.3s" }}>{fetcher.state === "submitting" ? "Saving..." : "Save"}</button>
                  <button type="button" onClick={() => setEditingId(null)} style={{ ...btnSmall, background: "#eee8dc", color: "#3b3b3b" }}>Cancel</button>
                </div>
              </fetcher.Form>
            </div>
          );
        }
        return (
          <div key={faq.id} style={{
            background: "white", borderRadius: 8, padding: 16, marginBottom: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)", opacity: faq.is_active ? 1 : 0.5,
            borderLeft: `3px solid ${faq.source === "learned" ? "#f57f17" : "#c4a882"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#3b3b3b" }}>Q: {faq.question}</div>
                  <span style={{ padding: "1px 6px", borderRadius: 8, fontSize: 9, fontWeight: 600, background: pc.bg, color: pc.color, flexShrink: 0 }}>
                    {(faq.profile || "shared").toUpperCase()}
                  </span>
                  {faq.response_type === "escalate" && (
                    <span style={{ padding: "1px 6px", borderRadius: 8, fontSize: 9, fontWeight: 600, background: "#fff3e0", color: "#ef6c00", flexShrink: 0 }}>ESCALATE</span>
                  )}
                  {faq.response_type === "instruction" && (
                    <span style={{ padding: "1px 6px", borderRadius: 8, fontSize: 9, fontWeight: 600, background: "#f3e5f5", color: "#7b1fa2", flexShrink: 0 }}>INSTRUCTION</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 6, lineHeight: 1.5 }}>A: {faq.answer}</div>
                <div style={{ fontSize: 11, color: "#b0a89a", marginTop: 6 }}>
                  Used {faq.times_used}x
                  {faq.source === "learned" && " | AI Learned"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12, alignItems: "flex-start" }}>
                <button onClick={() => setEditingId(faq.id)} style={{ ...btnSmall, background: "#e3f2fd", color: "#1565c0" }}>Edit</button>
                <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete this FAQ?")) e.preventDefault(); }}>
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={faq.id} />
                  <button type="submit" style={{ ...btnSmall, background: "#ffebee", color: "#c62828" }}>Delete</button>
                </fetcher.Form>
              </div>
            </div>
          </div>
        );
      })}

      {!showAdd && faqs.length > 3 && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button onClick={() => setShowAdd(true)} style={btnPrimary}>Add FAQ</button>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnSmall: React.CSSProperties = { padding: "5px 10px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
