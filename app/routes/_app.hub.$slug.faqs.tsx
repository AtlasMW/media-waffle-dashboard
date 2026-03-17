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
      answer: form.get("answer"),
      source: "manual",
      is_active: true,
    });
  } else if (intent === "toggle") {
    const id = form.get("id") as string;
    const active = form.get("is_active") === "true";
    await supabase.from("msg_faqs").update({ is_active: !active }).eq("id", id);
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

  return (
    <div style={{ maxWidth: 720, width: "100%" }}>
      <div className="hub-page-header">
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>FAQs</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>{client.name}</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>{showAdd ? "Cancel" : "Add FAQ"}</button>
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
              <label style={labelStyle}>Answer</label>
              <textarea name="answer" required rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <input type="hidden" name="category" value="general" />
            <button type="submit" style={btnPrimary}>Save FAQ</button>
          </fetcher.Form>
        </div>
      )}

      {faqs.map((faq: any) => (
        <div key={faq.id} style={{
          background: "white", borderRadius: 8, padding: 16, marginBottom: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)", opacity: faq.is_active ? 1 : 0.5,
          borderLeft: `3px solid ${faq.source === "learned" ? "#f57f17" : "#c4a882"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#3b3b3b" }}>Q: {faq.question}</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 6, lineHeight: 1.5 }}>A: {faq.answer}</div>
              <div style={{ fontSize: 11, color: "#b0a89a", marginTop: 6 }}>
                Used {faq.times_used}x
                {faq.source === "learned" && " | AI Learned"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
              <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete this FAQ?")) e.preventDefault(); }}>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={faq.id} />
                <button type="submit" style={{ ...btnSmall, background: "#ffebee", color: "#c62828" }}>Delete</button>
              </fetcher.Form>
            </div>
          </div>
        </div>
      ))}

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
