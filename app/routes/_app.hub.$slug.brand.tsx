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
      if (key === "emoji_allowed" || key === "deposit_required") updates[key] = value === "true";
      else if (key === "sms_char_limit" || key === "sms_max_messages" || key === "dm_max_messages") updates[key] = parseInt(value as string) || 0;
      else updates[key] = value;
    }
    await supabase.from("msg_brand_config").update(updates).eq("client_id", client.id);
    return { success: true };
  }
  if (intent === "add_blocked") {
    await supabase.from("msg_blocked_topics").insert({ client_id: client.id, topic: form.get("topic"), reason: form.get("reason") });
    return { success: true };
  }
  if (intent === "remove_blocked") {
    await supabase.from("msg_blocked_topics").delete().eq("id", form.get("id"));
    return { success: true };
  }
  return {};
}

export default function BrandConfig() {
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
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>Brand Configuration</h1>
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
        <Card title="Contact Details">
          <Field label="Phone Number" name="phone_number" value={brand?.phone_number || ""} />
          <Field label="Escalation Phone" name="escalation_phone" value={brand?.escalation_phone || ""} hint="Phone number for escalation messages" />
        </Card>
        <Card title="Message Limits">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#3b3b3b", marginBottom: 12 }}>SMS</div>
            <div className="hub-grid-2">
              <Field label="Character Limit" name="sms_char_limit" value={brand?.sms_char_limit || 160} type="number" />
              <Field label="Max Messages" name="sms_max_messages" value={brand?.sms_max_messages || 7} type="number" />
            </div>
          </div>
          <div style={{ borderTop: "1px solid #eee8dc", paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#3b3b3b", marginBottom: 12 }}>Social Media DMs</div>
            <div className="hub-grid-2">
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Character Limit</label>
                <div style={{ padding: "10px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, background: "#faf8f5", color: "#8a8478" }}>None</div>
              </div>
              <Field label="Max Messages" name="dm_max_messages" value={brand?.dm_max_messages || 10} type="number" />
            </div>
            <CheckboxField label="Allow emojis in DMs" name="emoji_allowed" checked={brand?.emoji_allowed || false} />
          </div>
        </Card>
        <Card title="Booking Settings">
          <CheckboxField label="Require deposit for online booking" name="deposit_required" checked={brand?.deposit_required || false} />
          <TextArea label="Deposit Info Message" name="deposit_info" value={brand?.deposit_info || ""} hint="Message to include when mentioning booking links" />
          <Field label="Post-Booking Response" name="post_booking_response" value={brand?.post_booking_response || ""} hint="What to say when a lead confirms they booked" />
          <Field label="Returning Customer Note" name="returning_customer_note" value={brand?.returning_customer_note || ""} />
        </Card>
        <Card title="GHL Trigger Tags">
          <p style={{ fontSize: 12, color: "#8a8478", marginBottom: 12 }}>The AI will only respond to contacts that have ALL of these tags in GHL. The contact must also have a location tag matching one of your configured locations.</p>
          <TagInput
            label="Required Tags"
            name="trigger_tags"
            initial={(() => {
              const raw = brand?.trigger_tags;
              if (Array.isArray(raw)) return raw;
              if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return ["hot lead", "meta lead"]; } }
              return ["hot lead", "meta lead"];
            })()}
            hint="Type a tag name and press Enter to add it"
          />
        </Card>

        <Card title="Custom Rules">
          <TextArea label="Custom Rules (JSON array)" name="custom_rules" value={typeof brand?.custom_rules === "string" ? brand.custom_rules : JSON.stringify(brand?.custom_rules || [], null, 2)} rows={6} hint="JSON array of rule strings the AI must follow" />
        </Card>
        <button type="submit" style={{ ...btnPrimary, marginBottom: 32 }}>Save Brand Configuration</button>
      </form>

      <Card title="Blocked Topics">
        <p style={{ fontSize: 12, color: "#8a8478", marginBottom: 16 }}>Topics the AI must never discuss with leads</p>
        {blocked.map((b: any) => (
          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee8dc" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{b.topic}</div>
              <div style={{ fontSize: 12, color: "#8a8478" }}>{b.reason}</div>
            </div>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="remove_blocked" />
              <input type="hidden" name="id" value={b.id} />
              <button type="submit" style={{ ...btnDanger, fontSize: 11 }}>Remove</button>
            </fetcher.Form>
          </div>
        ))}
        <fetcher.Form method="post" className="hub-form-row" style={{ marginTop: 12 }}>
          <input type="hidden" name="intent" value="add_blocked" />
          <input name="topic" placeholder="Topic" required style={inputStyle} />
          <input name="reason" placeholder="Reason" style={inputStyle} />
          <button type="submit" style={btnPrimary}>Add</button>
        </fetcher.Form>
      </Card>
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
function TagInput({ label, name, initial, hint }: { label: string; name: string; initial: string[]; hint?: string }) {
  const [tags, setTags] = useState<string[]>(initial);
  const [input, setInput] = useState("");

  const addTag = () => {
    const val = input.trim().toLowerCase();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", background: "#3b3b3b", color: "#f5f0e8",
            borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)} style={{
              background: "none", border: "none", color: "#f5f0e8", cursor: "pointer",
              fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.7,
            }}>x</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="Type a tag and press Enter"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={addTag} style={{
          padding: "10px 16px", background: "#eee8dc", color: "#3b3b3b", border: "none",
          borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: "'Montserrat', sans-serif",
        }}>Add</button>
      </div>
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  );
}

function CheckboxField({ label, name, checked }: { label: string; name: string; checked: boolean }) {
  const [isChecked, setIsChecked] = useState(checked);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3b3b3b", cursor: "pointer" }}>
        <input type="hidden" name={name} value={isChecked ? "true" : "false"} />
        <input type="checkbox" checked={isChecked} onChange={(e) => setIsChecked(e.target.checked)} style={{ accentColor: "#3b3b3b" }} />
        {label}
      </label>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const hintStyle: React.CSSProperties = { fontSize: 11, color: "#8a8478", marginTop: 4 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnDanger: React.CSSProperties = { padding: "6px 12px", background: "#c47a6c", color: "white", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
