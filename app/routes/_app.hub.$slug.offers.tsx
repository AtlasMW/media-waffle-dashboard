import { useOutletContext, useParams, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.offers";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { data: client } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return { error: "Client not found" };

  // Offer actions
  if (intent === "add_offer") {
    await supabase.from("msg_offers").insert({
      client_id: client.id, name: form.get("name"), short_name: form.get("short_name") || null,
      price: form.get("price") || null, description: form.get("description") || null,
      terms: form.get("terms") || null, booking_link: form.get("booking_link") || null,
      health_rebate_eligible: form.get("health_rebate_eligible") === "true",
      one_per_customer: form.get("one_per_customer") === "true", is_active: true,
    });
  } else if (intent === "toggle_offer") {
    const active = form.get("is_active") === "true";
    await supabase.from("msg_offers").update({ is_active: !active }).eq("id", form.get("id"));
  } else if (intent === "delete_offer") {
    await supabase.from("msg_offers").delete().eq("id", form.get("id"));
  }

  // Service actions
  if (intent === "add_service") {
    await supabase.from("msg_services").insert({
      client_id: client.id, name: form.get("name"),
      description: form.get("description") || null,
      price_range: form.get("price_range") || null,
      duration: form.get("duration") || null, is_active: true,
    });
  } else if (intent === "toggle_service") {
    const active = form.get("is_active") === "true";
    await supabase.from("msg_services").update({ is_active: !active }).eq("id", form.get("id"));
  } else if (intent === "delete_service") {
    await supabase.from("msg_services").delete().eq("id", form.get("id"));
  }

  return { success: true };
}

export default function OffersAndServices() {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const { slug } = useParams();
  const data = allClientData[slug!] || {};
  const client = data.client || {};
  const offers = data.offers || [];
  const services = data.services || [];
  const fetcher = useFetcher();
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [showAddService, setShowAddService] = useState(false);

  return (
    <div style={{ maxWidth: 720, width: "100%" }}>
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>Offers & Services</h1>
      <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 32px" }}>{client.name}</p>

      {/* ==================== OFFERS ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: "#3b3b3b", margin: 0 }}>Offers</h2>
        <button onClick={() => setShowAddOffer(!showAddOffer)} style={btnPrimary}>{showAddOffer ? "Cancel" : "Add Offer"}</button>
      </div>

      {showAddOffer && (
        <div style={{ ...card, marginBottom: 16 }}>
          <fetcher.Form method="post" onSubmit={() => setShowAddOffer(false)}>
            <input type="hidden" name="intent" value="add_offer" />
            {[["Name","name",true],["Short Name","short_name"],["Price","price"]].map(([l,n,r]: any) => (
              <div key={n} style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{l}</label>
                <input name={n} required={r} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Description</label><textarea name="description" rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Terms</label><textarea name="terms" rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Booking Link</label><input name="booking_link" style={inputStyle} /></div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" name="health_rebate_eligible" value="true" /> Health rebate eligible</label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" name="one_per_customer" value="true" /> One per customer</label>
            </div>
            <button type="submit" style={btnPrimary}>Save Offer</button>
          </fetcher.Form>
        </div>
      )}

      {offers.length === 0 && !showAddOffer && (
        <div style={{ ...card, textAlign: "center", color: "#8a8478", padding: 32, marginBottom: 16 }}>No offers yet</div>
      )}

      {offers.map((offer: any) => (
        <div key={offer.id} style={{ ...card, marginBottom: 10, opacity: offer.is_active ? 1 : 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as any }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#3b3b3b" }}>{offer.name}</div>
              {offer.price && <div style={{ fontSize: 18, fontWeight: 700, color: "#c4a882", marginTop: 4 }}>{offer.price}</div>}
              {offer.description && <div style={{ fontSize: 13, color: "#666", marginTop: 8, lineHeight: 1.5 }}>{offer.description}</div>}
              {offer.terms && <div style={{ fontSize: 12, color: "#8a8478", marginTop: 6 }}>Terms: {offer.terms}</div>}
              <div style={{ fontSize: 11, color: "#b0a89a", marginTop: 8 }}>
                Updated {new Date(offer.updated_at).toLocaleDateString("en-AU")}
                {offer.one_per_customer && " | One per customer"}
                {offer.health_rebate_eligible && " | Health rebate eligible"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 4 }}>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="toggle_offer" />
                <input type="hidden" name="id" value={offer.id} />
                <input type="hidden" name="is_active" value={String(offer.is_active)} />
                <button type="submit" style={{ ...btnSmall, background: offer.is_active ? "#fff3e0" : "#e8f5e9", color: offer.is_active ? "#ef6c00" : "#2e7d32" }}>
                  {offer.is_active ? "Deactivate" : "Activate"}
                </button>
              </fetcher.Form>
              <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete this offer?")) e.preventDefault(); }}>
                <input type="hidden" name="intent" value="delete_offer" />
                <input type="hidden" name="id" value={offer.id} />
                <button type="submit" style={{ ...btnSmall, background: "#ffebee", color: "#c62828" }}>Delete</button>
              </fetcher.Form>
            </div>
          </div>
        </div>
      ))}

      {/* ==================== DIVIDER ==================== */}
      <div style={{ borderTop: "2px solid #ddd5c4", margin: "32px 0" }} />

      {/* ==================== SERVICES ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: "#3b3b3b", margin: 0 }}>Services</h2>
        <button onClick={() => setShowAddService(!showAddService)} style={btnPrimary}>{showAddService ? "Cancel" : "Add Service"}</button>
      </div>

      {showAddService && (
        <div style={{ ...card, marginBottom: 16 }}>
          <fetcher.Form method="post" onSubmit={() => setShowAddService(false)}>
            <input type="hidden" name="intent" value="add_service" />
            {[["Service Name","name",true],["Description","description"],["Price Range","price_range"],["Duration","duration"]].map(([l,n,r]: any) => (
              <div key={n} style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{l}</label>
                <input name={n} required={r} style={inputStyle} />
              </div>
            ))}
            <button type="submit" style={btnPrimary}>Save Service</button>
          </fetcher.Form>
        </div>
      )}

      {services.length === 0 && !showAddService && (
        <div style={{ ...card, textAlign: "center", color: "#8a8478", padding: 32 }}>No services yet</div>
      )}

      {services.map((svc: any) => (
        <div key={svc.id} style={{ ...card, marginBottom: 10, opacity: svc.is_active ? 1 : 0.5, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as any }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#3b3b3b" }}>{svc.name}</div>
            {svc.description && <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{svc.description}</div>}
            <div style={{ fontSize: 12, color: "#8a8478", marginTop: 4 }}>
              {svc.price_range && <span>{svc.price_range}</span>}
              {svc.price_range && svc.duration && <span> | </span>}
              {svc.duration && <span>{svc.duration}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="toggle_service" />
              <input type="hidden" name="id" value={svc.id} />
              <input type="hidden" name="is_active" value={String(svc.is_active)} />
              <button type="submit" style={{ ...btnSmall, background: svc.is_active ? "#fff3e0" : "#e8f5e9", color: svc.is_active ? "#ef6c00" : "#2e7d32" }}>
                {svc.is_active ? "Off" : "On"}
              </button>
            </fetcher.Form>
            <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete?")) e.preventDefault(); }}>
              <input type="hidden" name="intent" value="delete_service" />
              <input type="hidden" name="id" value={svc.id} />
              <button type="submit" style={{ ...btnSmall, background: "#ffebee", color: "#c62828" }}>Delete</button>
            </fetcher.Form>
          </div>
        </div>
      ))}
    </div>
  );
}

const card: React.CSSProperties = { background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnSmall: React.CSSProperties = { padding: "6px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
