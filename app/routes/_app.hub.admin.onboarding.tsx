import { useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/_app.hub.admin.onboarding";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return Response.redirect(new URL("/hub", request.url).toString());
  return { userId: user.id };
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "create_client") {
    const name = form.get("name") as string;
    const slug = form.get("slug") as string;
    const ghlApiKey = form.get("ghl_api_key") as string;
    const ghlLocationId = form.get("ghl_location_id") as string;

    // Create client
    const { data: client, error: clientErr } = await supabase.from("msg_clients").insert({
      name, slug, ghl_api_key: ghlApiKey, ghl_location_id: ghlLocationId, status: "setup",
    }).select().single();

    if (clientErr) return { error: clientErr.message };

    // Create default brand config
    await supabase.from("msg_brand_config").insert({
      client_id: client.id,
      assistant_name: form.get("assistant_name") || "Assistant",
      tone: form.get("tone") || "friendly",
      greeting_style: form.get("greeting_style") || "Hi [name]",
      phone_number: form.get("phone_number") || "",
      sms_char_limit: 160,
      sms_max_messages: 7,
      dm_max_messages: 10,
      emoji_allowed: false,
      deposit_required: false,
      post_booking_response: "Amazing, see you then!",
    });

    // Create default blocked topics
    const defaultBlocked = [
      { topic: "Owner personal information", reason: "Privacy - never share owner details" },
      { topic: "Staff personal information", reason: "Privacy - never share staff details" },
      { topic: "Other lead information", reason: "Privacy - never reference other leads" },
      { topic: "Business financials", reason: "Never discuss revenue or costs" },
      { topic: "Medical advice", reason: "Never provide medical recommendations - escalate" },
    ];
    for (const b of defaultBlocked) {
      await supabase.from("msg_blocked_topics").insert({ client_id: client.id, ...b });
    }

    // Link admin user
    await supabase.from("msg_client_users").insert({
      client_id: client.id, user_id: user.id, role: "owner",
    });

    return { success: true, clientSlug: client.slug };
  }

  return {};
}

export default function Onboarding() {
  const fetcher = useFetcher();
  const [step, setStep] = useState(1);
  const result = fetcher.data as any;

  if (result?.success) {
    return (
      <div style={{ maxWidth: 600, width: "100%" }}>
        <div style={{ background: "#e8f5e9", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#2e7d32", marginBottom: 8 }}>Client Created</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>Now configure their locations, offers, and FAQs.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a href={`/hub/${result.clientSlug}/brand`} style={btnPrimary}>Configure Brand</a>
            <a href={`/hub/${result.clientSlug}/locations`} style={{ ...btnPrimary, background: "transparent", color: "#3b3b3b", border: "1px solid #ddd5c4" }}>Add Locations</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, width: "100%" }}>
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 28, color: "#3b3b3b", margin: "0 0 8px" }}>Onboard New Client</h1>
      <p style={{ color: "#8a8478", fontSize: 13, marginBottom: 32 }}>Set up a new AI messaging client. You can configure details after creation.</p>

      {result?.error && (
        <div style={{ background: "#ffebee", borderRadius: 8, padding: 12, marginBottom: 20, color: "#c62828", fontSize: 13 }}>{result.error}</div>
      )}

      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="create_client" />

        {/* Step 1: Basic Info */}
        <Card title="Step 1: Business Details" step={1} current={step}>
          <Field label="Business Name" name="name" required hint="e.g. MB Luxury Spa" />
          <Field label="Slug (URL-safe)" name="slug" required hint="e.g. mb-luxury (lowercase, hyphens only)" />
          <Field label="Phone Number" name="phone_number" hint="Business phone for leads to call/text" />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={() => setStep(2)} style={btnPrimary}>Next</button>
          </div>
        </Card>

        {/* Step 2: GHL */}
        <Card title="Step 2: GoHighLevel Integration" step={2} current={step}>
          <Field label="GHL API Key" name="ghl_api_key" required hint="API key for this location" />
          <Field label="GHL Location ID" name="ghl_location_id" required hint="Location ID from GHL" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button type="button" onClick={() => setStep(1)} style={{ ...btnPrimary, background: "transparent", color: "#3b3b3b", border: "1px solid #ddd5c4" }}>Back</button>
            <button type="button" onClick={() => setStep(3)} style={btnPrimary}>Next</button>
          </div>
        </Card>

        {/* Step 3: Assistant */}
        <Card title="Step 3: AI Assistant" step={3} current={step}>
          <Field label="Assistant Name" name="assistant_name" hint="e.g. Cassie, Sophie, Mia" />
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Tone</label>
            <select name="tone" style={inputStyle}>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          <Field label="Greeting Style" name="greeting_style" hint="Use [name] for the lead's first name. e.g. Hi [name]" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button type="button" onClick={() => setStep(2)} style={{ ...btnPrimary, background: "transparent", color: "#3b3b3b", border: "1px solid #ddd5c4" }}>Back</button>
            <button type="submit" style={{ ...btnPrimary, background: "#2e7d32" }}>Create Client</button>
          </div>
        </Card>
      </fetcher.Form>
    </div>
  );
}

function Card({ title, step, current, children }: { title: string; step: number; current: number; children: React.ReactNode }) {
  if (step !== current) return null;
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#3b3b3b", color: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{step}</div>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: "#3b3b3b", margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, name, required, hint }: { label: string; name: string; required?: boolean; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input name={name} required={required} style={inputStyle} />
      {hint && <div style={{ fontSize: 11, color: "#8a8478", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif", textDecoration: "none" };
