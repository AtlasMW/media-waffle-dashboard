import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.offers";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: client } = await supabase.from("msg_clients").select("*").eq("slug", params.slug).single();
  if (!client) throw new Response("Not found", { status: 404 });
  const { data: offers } = await supabase.from("msg_offers").select("*").eq("client_id", client.id).order("is_active", { ascending: false }).order("updated_at", { ascending: false });
  return { client, offers: offers || [] };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { data: client } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return { error: "Client not found" };

  if (intent === "add") {
    await supabase.from("msg_offers").insert({
      client_id: client.id,
      name: form.get("name"),
      short_name: form.get("short_name") || null,
      price: form.get("price") || null,
      description: form.get("description") || null,
      terms: form.get("terms") || null,
      booking_link: form.get("booking_link") || null,
      health_rebate_eligible: form.get("health_rebate_eligible") === "true",
      one_per_customer: form.get("one_per_customer") === "true",
      is_active: true,
    });
  } else if (intent === "toggle") {
    const id = form.get("id") as string;
    const active = form.get("is_active") === "true";
    await supabase.from("msg_offers").update({ is_active: !active }).eq("id", id);
  } else if (intent === "delete") {
    await supabase.from("msg_offers").delete().eq("id", form.get("id"));
  }
  return { success: true };
}

export default function Offers() {
  const { client, offers } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>{client.name}</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>Offers | {offers.length} total</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>{showAdd ? "Cancel" : "Add Offer"}</button>
      </div>

      {showAdd && (
        <div style={{ background: "white", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, margin: "0 0 16px" }}>New Offer</h3>
          <fetcher.Form method="post" onSubmit={() => setShowAdd(false)}>
            <input type="hidden" name="intent" value="add" />
            <Field label="Name" name="name" required />
            <Field label="Short Name" name="short_name" />
            <Field label="Price" name="price" />
            <TextArea label="Description" name="description" />
            <TextArea label="Terms" name="terms" />
            <Field label="Booking Link" name="booking_link" />
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" name="health_rebate_eligible" value="true" /> Health rebate eligible
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" name="one_per_customer" value="true" /> One per customer
              </label>
            </div>
            <button type="submit" style={btnPrimary}>Save Offer</button>
          </fetcher.Form>
        </div>
      )}

      {offers.map((offer: any) => (
        <div key={offer.id} style={{
          background: "white",
          borderRadius: 12,
          padding: 20,
          marginBottom: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          opacity: offer.is_active ? 1 : 0.5,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#3b3b3b" }}>{offer.name}</div>
              {offer.price && <div style={{ fontSize: 18, fontWeight: 700, color: "#c4a882", marginTop: 4 }}>{offer.price}</div>}
              {offer.description && <div style={{ fontSize: 13, color: "#666", marginTop: 8, lineHeight: 1.5 }}>{offer.description}</div>}
              {offer.terms && <div style={{ fontSize: 12, color: "#8a8478", marginTop: 6 }}>Terms: {offer.terms}</div>}
              <div style={{ fontSize: 11, color: "#b0a89a", marginTop: 8 }}>
                Version {offer.version} | Updated {new Date(offer.updated_at).toLocaleDateString("en-AU")}
                {offer.one_per_customer && " | One per customer"}
                {offer.health_rebate_eligible && " | Health rebate eligible"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="toggle" />
                <input type="hidden" name="id" value={offer.id} />
                <input type="hidden" name="is_active" value={String(offer.is_active)} />
                <button type="submit" style={{ ...btnSmall, background: offer.is_active ? "#fff3e0" : "#e8f5e9", color: offer.is_active ? "#ef6c00" : "#2e7d32" }}>
                  {offer.is_active ? "Deactivate" : "Activate"}
                </button>
              </fetcher.Form>
              <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete this offer?")) e.preventDefault(); }}>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={offer.id} />
                <button type="submit" style={{ ...btnSmall, background: "#ffebee", color: "#c62828" }}>Delete</button>
              </fetcher.Form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 4 }}>{label}</label>
      <input name={name} required={required} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" }} />
    </div>
  );
}

function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 4 }}>{label}</label>
      <textarea name={name} rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box", resize: "vertical" }} />
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnSmall: React.CSSProperties = { padding: "6px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
