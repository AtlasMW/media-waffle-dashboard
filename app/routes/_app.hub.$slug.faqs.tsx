import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.faqs";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: client } = await supabase.from("msg_clients").select("*").eq("slug", params.slug).single();
  if (!client) throw new Response("Not found", { status: 404 });
  const { data: faqs } = await supabase.from("msg_faqs").select("*").eq("client_id", client.id).order("times_used", { ascending: false });
  const { data: suggested } = await supabase.from("msg_learned_patterns").select("*").eq("client_id", client.id).eq("status", "pending_review");
  return { client, faqs: faqs || [], suggested: suggested || [] };
}

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
  const { client, faqs, suggested } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");

  const categories = ["all", "general", "pricing", "services", "booking", "objections"];
  const filtered = filter === "all" ? faqs : faqs.filter((f: any) => f.category === filter);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>{client.name}</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>FAQs | {faqs.length} total, {faqs.filter((f: any) => f.is_active).length} active</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>{showAdd ? "Cancel" : "Add FAQ"}</button>
      </div>

      {/* AI Suggestions */}
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
              <label style={labelStyle}>Category</label>
              <select name="category" style={inputStyle}>
                {categories.filter(c => c !== "all").map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Question</label>
              <input name="question" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Answer</label>
              <textarea name="answer" required rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <button type="submit" style={btnPrimary}>Save FAQ</button>
          </fetcher.Form>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: filter === c ? "#3b3b3b" : "#eee8dc", color: filter === c ? "#f5f0e8" : "#3b3b3b",
            fontFamily: "'Montserrat', sans-serif",
          }}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {filtered.map((faq: any) => (
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
                {faq.category} | Used {faq.times_used}x | v{faq.version}
                {faq.source === "learned" && " | AI Learned"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="toggle" />
                <input type="hidden" name="id" value={faq.id} />
                <input type="hidden" name="is_active" value={String(faq.is_active)} />
                <button type="submit" style={{ ...btnSmall, background: faq.is_active ? "#fff3e0" : "#e8f5e9", color: faq.is_active ? "#ef6c00" : "#2e7d32" }}>
                  {faq.is_active ? "Off" : "On"}
                </button>
              </fetcher.Form>
              <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete?")) e.preventDefault(); }}>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={faq.id} />
                <button type="submit" style={{ ...btnSmall, background: "#ffebee", color: "#c62828" }}>X</button>
              </fetcher.Form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnSmall: React.CSSProperties = { padding: "5px 10px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
