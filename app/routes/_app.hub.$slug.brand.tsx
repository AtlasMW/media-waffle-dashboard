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
    await supabase.from("msg_brand_config").update(updates).eq("client_id", client.id);
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
          <TextArea label="Tone" name="tone" value={brand?.tone || "friendly"} rows={3} hint="Describe how the assistant should sound (e.g. friendly, warm and professional, keeps it brief)" />
          <Field label="Greeting Style" name="greeting_style" value={brand?.greeting_style || "Hi [name]"} hint="Use [name] as placeholder for lead's first name" />
        </Card>

        <Card title="Response Behaviour">
          <Field label="Post-Booking Response" name="post_booking_response" value={brand?.post_booking_response || ""} hint="What to say when a lead confirms they booked" />
          <Field label="Returning Customer Note" name="returning_customer_note" value={brand?.returning_customer_note || ""} hint="Message for leads who want to use the offer again" />
          <TextArea label="Custom Rules" name="custom_rules" value={typeof brand?.custom_rules === "string" ? brand.custom_rules : JSON.stringify(brand?.custom_rules || [], null, 2)} rows={4} hint='JSON array of additional rules (e.g. ["Never mention competitors", "Always ask about preferred time"])' />
        </Card>

        <button type="submit" style={{ ...btnPrimary, marginBottom: 32 }}>Save Brand Identity</button>
      </form>
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

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const hintStyle: React.CSSProperties = { fontSize: 11, color: "#8a8478", marginTop: 4 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
