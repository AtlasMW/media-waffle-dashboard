import { useOutletContext, useParams, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.offers";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

// OfferCard component with icon buttons and tag management
function OfferCard({ offer, offerTags, onEdit, fetcher }: any) {
  const [newTag, setNewTag] = useState("");

  const handleRemoveTag = (tagToRemove: string) => {
    const remainingTags = offerTags.filter((t: string) => t !== tagToRemove);
    const formData = new FormData();
    formData.append("intent", "update_offer_tags");
    formData.append("id", offer.id);
    formData.append("trigger_tags", remainingTags.join(", "));
    fetcher.submit(formData, { method: "post" });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const allTags = [...offerTags, newTag.trim()];
    const formData = new FormData();
    formData.append("intent", "update_offer_tags");
    formData.append("id", offer.id);
    formData.append("trigger_tags", allTags.join(", "));
    fetcher.submit(formData, { method: "post" });
    setNewTag("");
  };

  return (
    <div style={{ ...card, marginBottom: 10, opacity: offer.is_active ? 1 : 0.5, position: "relative" }}>
      {/* Icon action buttons in top right */}
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
        <button 
          onClick={onEdit} 
          title="Edit"
          style={iconButton}
        >
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <fetcher.Form method="post" style={{ display: "inline" }}>
          <input type="hidden" name="intent" value="toggle_offer" />
          <input type="hidden" name="id" value={offer.id} />
          <input type="hidden" name="is_active" value={String(offer.is_active)} />
          <button 
            type="submit" 
            title={offer.is_active ? "Deactivate" : "Activate"}
            style={{ ...iconButton, background: offer.is_active ? "#fff3e0" : "#e8f5e9", color: offer.is_active ? "#ef6c00" : "#2e7d32" }}
          >
            {offer.is_active ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
          </button>
        </fetcher.Form>
        <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete this offer?")) e.preventDefault(); }} style={{ display: "inline" }}>
          <input type="hidden" name="intent" value="delete_offer" />
          <input type="hidden" name="id" value={offer.id} />
          <button 
            type="submit" 
            title="Delete"
            style={{ ...iconButton, background: "#ffebee", color: "#c62828" }}
          >
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </fetcher.Form>
      </div>

      {/* Card content */}
      <div style={{ paddingRight: 80 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#3b3b3b" }}>{offer.name}</div>
        {offer.price && <div style={{ fontSize: 18, fontWeight: 700, color: "#c4a882", marginTop: 4 }}>{offer.price}</div>}
        {offer.description && <div style={{ fontSize: 13, color: "#666", marginTop: 8, lineHeight: 1.5 }}>{offer.description}</div>}
        {offer.terms && <div style={{ fontSize: 12, color: "#8a8478", marginTop: 6 }}>Terms: {offer.terms}</div>}
        
        {/* Tag management UI */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#8a8478", marginBottom: 6 }}>Trigger tags:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {offerTags.length > 0 ? offerTags.map((tag: string) => (
              <div key={tag} style={tagPill}>
                <span>{tag}</span>
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  style={tagRemoveButton}
                  title="Remove tag"
                >
                  ×
                </button>
              </div>
            )) : <span style={{ fontSize: 11, color: "#b0a89a", fontStyle: "italic" }}>no tags set</span>}
          </div>
          <form onSubmit={handleAddTag} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input 
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              style={{ 
                padding: "4px 8px", 
                border: "1px solid #ddd5c4", 
                borderRadius: 4, 
                fontSize: 11, 
                fontFamily: "'Montserrat', sans-serif",
                width: 120
              }}
            />
            <button 
              type="submit"
              style={{ 
                padding: "4px 12px", 
                background: "#3b3b3b", 
                color: "#f5f0e8", 
                border: "none", 
                borderRadius: 4, 
                fontSize: 11, 
                fontWeight: 600, 
                cursor: "pointer",
                fontFamily: "'Montserrat', sans-serif"
              }}
            >
              Add
            </button>
          </form>
        </div>

        <div style={{ fontSize: 11, color: "#b0a89a", marginTop: 8 }}>
          Updated {new Date(offer.updated_at).toLocaleDateString("en-AU")}
          {offer.one_per_customer && " | One per customer"}
          {offer.health_rebate_eligible && " | Health rebate eligible"}
        </div>
      </div>
    </div>
  );
}

// ServiceCard component with icon buttons
function ServiceCard({ service, onEdit, fetcher }: any) {
  return (
    <div style={{ ...card, marginBottom: 10, opacity: service.is_active ? 1 : 0.5, position: "relative" }}>
      {/* Icon action buttons in top right */}
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
        <button 
          onClick={onEdit} 
          title="Edit"
          style={iconButton}
        >
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <fetcher.Form method="post" style={{ display: "inline" }}>
          <input type="hidden" name="intent" value="toggle_service" />
          <input type="hidden" name="id" value={service.id} />
          <input type="hidden" name="is_active" value={String(service.is_active)} />
          <button 
            type="submit" 
            title={service.is_active ? "Deactivate" : "Activate"}
            style={{ ...iconButton, background: service.is_active ? "#fff3e0" : "#e8f5e9", color: service.is_active ? "#ef6c00" : "#2e7d32" }}
          >
            {service.is_active ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
          </button>
        </fetcher.Form>
        <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete this service?")) e.preventDefault(); }} style={{ display: "inline" }}>
          <input type="hidden" name="intent" value="delete_service" />
          <input type="hidden" name="id" value={service.id} />
          <button 
            type="submit" 
            title="Delete"
            style={{ ...iconButton, background: "#ffebee", color: "#c62828" }}
          >
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </fetcher.Form>
      </div>

      {/* Card content */}
      <div style={{ paddingRight: 80 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#3b3b3b" }}>{service.name}</div>
        {service.description && <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{service.description}</div>}
        <div style={{ fontSize: 12, color: "#8a8478", marginTop: 4 }}>
          {service.price_range && <span>{service.price_range}</span>}
          {service.price_range && service.duration && <span> | </span>}
          {service.duration && <span>{service.duration}</span>}
        </div>
      </div>
    </div>
  );
}

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { data: client } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return { error: "Client not found" };

  // Offer actions
  if (intent === "add_offer") {
    const tagsRaw = (form.get("trigger_tags") as string || "").trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
    await supabase.from("msg_offers").insert({
      client_id: client.id, name: form.get("name"), short_name: form.get("short_name") || null,
      price: form.get("price") || null, description: form.get("description") || null,
      terms: form.get("terms") || null, booking_link: form.get("booking_link") || null,
      trigger_tags: JSON.stringify(tags),
      health_rebate_eligible: form.get("health_rebate_eligible") === "true",
      one_per_customer: form.get("one_per_customer") === "true", is_active: true,
    });
  } else if (intent === "update_offer_tags") {
    const tagsRaw = (form.get("trigger_tags") as string || "").trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_offers?id=eq.${form.get("id")}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${SB_SERVICE_KEY}`, "apikey": SB_SERVICE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ trigger_tags: JSON.stringify(tags) }),
    });
  } else if (intent === "toggle_offer") {
    const active = form.get("is_active") === "true";
    await supabase.from("msg_offers").update({ is_active: !active }).eq("id", form.get("id"));
  } else if (intent === "edit_offer") {
    const tagsRaw = (form.get("trigger_tags") as string || "").trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_offers?id=eq.${form.get("id")}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({
        name: form.get("name"), short_name: form.get("short_name") || null,
        price: form.get("price") || null, description: form.get("description") || null,
        terms: form.get("terms") || null, booking_link: form.get("booking_link") || null,
        trigger_tags: JSON.stringify(tags),
        health_rebate_eligible: form.get("health_rebate_eligible") === "true",
        one_per_customer: form.get("one_per_customer") === "true",
      }),
    });
  } else if (intent === "delete_offer") {
    await supabase.from("msg_offers").delete().eq("id", form.get("id"));
  } else if (intent === "edit_service") {
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_services?id=eq.${form.get("id")}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({
        name: form.get("name"), description: form.get("description") || null,
        price_range: form.get("price_range") || null, duration: form.get("duration") || null,
      }),
    });
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
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

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
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>GHL Trigger Tags</label>
              <input name="trigger_tags" placeholder="e.g. hot lead, meta lead (comma separated)" style={inputStyle} />
              <div style={{ fontSize: 11, color: "#8a8478", marginTop: 4 }}>Leads with ALL these tags will receive this offer's promo messaging</div>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" name="health_rebate_eligible" value="true" /> Health rebate eligible</label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" name="one_per_customer" value="true" /> One per customer</label>
            </div>
            <button type="submit" style={{ ...btnPrimary, background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b", transition: "all 0.3s" }}>{fetcher.state === "submitting" ? "Saving..." : "Save Offer"}</button>
          </fetcher.Form>
        </div>
      )}

      {offers.length === 0 && !showAddOffer && (
        <div style={{ ...card, textAlign: "center", color: "#8a8478", padding: 32, marginBottom: 16 }}>No offers yet</div>
      )}

      {offers.map((offer: any) => {
        const offerTags = (() => { try { return typeof offer.trigger_tags === "string" ? JSON.parse(offer.trigger_tags) : (offer.trigger_tags || []); } catch { return []; } })();
        
        if (editingOfferId === offer.id) {
          return (
            <div key={offer.id} style={{ ...card, marginBottom: 10, border: "2px solid #c4a882" }}>
              <fetcher.Form method="post" onSubmit={() => setEditingOfferId(null)}>
                <input type="hidden" name="intent" value="edit_offer" />
                <input type="hidden" name="id" value={offer.id} />
                {[["Name","name",offer.name],["Short Name","short_name",offer.short_name],["Price","price",offer.price]].map(([l,n,v]: any) => (
                  <div key={n} style={{ marginBottom: 12 }}><label style={labelStyle}>{l}</label><input name={n} defaultValue={v || ""} style={inputStyle} /></div>
                ))}
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Description</label><textarea name="description" defaultValue={offer.description || ""} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Terms</label><textarea name="terms" defaultValue={offer.terms || ""} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Booking Link</label><input name="booking_link" defaultValue={offer.booking_link || ""} style={inputStyle} /></div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>GHL Trigger Tags</label>
                  <input name="trigger_tags" defaultValue={offerTags.join(", ")} placeholder="hot lead, meta lead" style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" name="health_rebate_eligible" value="true" defaultChecked={offer.health_rebate_eligible} /> Health rebate eligible</label>
                  <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" name="one_per_customer" value="true" defaultChecked={offer.one_per_customer} /> One per customer</label>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" style={btnPrimary}>Save</button>
                  <button type="button" onClick={() => setEditingOfferId(null)} style={{ ...btnSmall, background: "#eee8dc", color: "#3b3b3b" }}>Cancel</button>
                </div>
              </fetcher.Form>
            </div>
          );
        }
        
        return (
          <OfferCard 
            key={offer.id} 
            offer={offer} 
            offerTags={offerTags}
            onEdit={() => setEditingOfferId(offer.id)}
            fetcher={fetcher}
          />
        );
      })}

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
            <button type="submit" style={{ ...btnPrimary, background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b", transition: "all 0.3s" }}>{fetcher.state === "submitting" ? "Saving..." : "Save Service"}</button>
          </fetcher.Form>
        </div>
      )}

      {services.length === 0 && !showAddService && (
        <div style={{ ...card, textAlign: "center", color: "#8a8478", padding: 32 }}>No services yet</div>
      )}

      {services.map((svc: any) => {
        if (editingServiceId === svc.id) {
          return (
            <div key={svc.id} style={{ ...card, marginBottom: 10, border: "2px solid #c4a882" }}>
              <fetcher.Form method="post" onSubmit={() => setEditingServiceId(null)}>
                <input type="hidden" name="intent" value="edit_service" />
                <input type="hidden" name="id" value={svc.id} />
                {[["Service Name","name",svc.name],["Description","description",svc.description],["Price Range","price_range",svc.price_range],["Duration","duration",svc.duration]].map(([l,n,v]: any) => (
                  <div key={n} style={{ marginBottom: 12 }}><label style={labelStyle}>{l}</label><input name={n} defaultValue={v || ""} style={inputStyle} /></div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" style={btnPrimary}>Save</button>
                  <button type="button" onClick={() => setEditingServiceId(null)} style={{ ...btnSmall, background: "#eee8dc", color: "#3b3b3b" }}>Cancel</button>
                </div>
              </fetcher.Form>
            </div>
          );
        }
        return (
          <ServiceCard
            key={svc.id}
            service={svc}
            onEdit={() => setEditingServiceId(svc.id)}
            fetcher={fetcher}
          />
        );
      })}
    </div>
  );
}

const card: React.CSSProperties = { background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnSmall: React.CSSProperties = { padding: "6px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const iconButton: React.CSSProperties = { width: 24, height: 24, borderRadius: "50%", border: "none", background: "#e8e8e8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, padding: 0 };
const tagPill: React.CSSProperties = { padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: "#e3f2fd", color: "#1565c0", display: "inline-flex", alignItems: "center", gap: 4 };
const tagRemoveButton: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, color: "#1565c0", fontWeight: 700 };
