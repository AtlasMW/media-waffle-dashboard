import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.locations";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: client } = await supabase.from("msg_clients").select("*").eq("slug", params.slug).single();
  if (!client) throw new Response("Not found", { status: 404 });
  const { data: locations } = await supabase.from("msg_locations").select("*").eq("client_id", client.id).order("name");
  return { client, locations: locations || [] };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { data: client } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {};

  if (intent === "add") {
    await supabase.from("msg_locations").insert({
      client_id: client.id, name: form.get("name"), tag: form.get("tag"),
      address: form.get("address") || null, full_address: form.get("full_address") || null,
      booking_link: form.get("booking_link") || null, general_booking_link: form.get("general_booking_link") || null,
      ghl_pipeline_id: form.get("ghl_pipeline_id") || null, fresha_url: form.get("fresha_url") || null,
      booking_system: form.get("booking_system") || "fresha", is_active: true,
    });
  } else if (intent === "toggle") {
    const active = form.get("is_active") === "true";
    await supabase.from("msg_locations").update({ is_active: !active }).eq("id", form.get("id"));
  } else if (intent === "delete") {
    await supabase.from("msg_locations").delete().eq("id", form.get("id"));
  }
  return { success: true };
}

export default function Locations() {
  const { client, locations } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 24, color: "#3b3b3b", margin: 0 }}>{client.name}</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>Locations — {locations.length} total</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={btn}>{showAdd ? "Cancel" : "Add Location"}</button>
      </div>

      {showAdd && (
        <div style={card}>
          <fetcher.Form method="post" onSubmit={() => setShowAdd(false)}>
            <input type="hidden" name="intent" value="add" />
            {[["Name","name",true],["Tag (lowercase, no spaces)","tag",true],["Address","address"],["Full Address","full_address"],["Promo Booking Link","booking_link"],["General Booking Link","general_booking_link"],["GHL Pipeline ID","ghl_pipeline_id"],["Fresha URL","fresha_url"]].map(([l,n,r]: any) => (
              <div key={n} style={{ marginBottom: 12 }}>
                <label style={label}>{l}</label>
                <input name={n} required={r} style={input} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Booking System</label>
              <select name="booking_system" style={input}><option value="fresha">Fresha</option><option value="other">Other</option><option value="none">None</option></select>
            </div>
            <button type="submit" style={btn}>Save Location</button>
          </fetcher.Form>
        </div>
      )}

      {locations.map((loc: any) => (
        <div key={loc.id} style={{ ...card, opacity: loc.is_active ? 1 : 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#3b3b3b" }}>{loc.name}</div>
              <div style={{ fontSize: 12, color: "#c4a882", marginTop: 2 }}>Tag: {loc.tag}</div>
              {loc.address && <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>{loc.address}</div>}
              {loc.full_address && <div style={{ fontSize: 12, color: "#8a8478" }}>{loc.full_address}</div>}
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                {loc.booking_link && <div>Promo: <a href={loc.booking_link} target="_blank" style={{ color: "#5b9ea6" }}>{loc.booking_link}</a></div>}
                {loc.general_booking_link && <div>General: <a href={loc.general_booking_link} target="_blank" style={{ color: "#5b9ea6" }}>{loc.general_booking_link}</a></div>}
              </div>
              <div style={{ fontSize: 11, color: "#b0a89a", marginTop: 6 }}>
                {loc.booking_system} — Pipeline: {loc.ghl_pipeline_id || "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="toggle" />
                <input type="hidden" name="id" value={loc.id} />
                <input type="hidden" name="is_active" value={String(loc.is_active)} />
                <button type="submit" style={{ ...btnSm, background: loc.is_active ? "#fff3e0" : "#e8f5e9", color: loc.is_active ? "#ef6c00" : "#2e7d32" }}>
                  {loc.is_active ? "Deactivate" : "Activate"}
                </button>
              </fetcher.Form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const card: React.CSSProperties = { background: "white", borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const btn: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnSm: React.CSSProperties = { padding: "6px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
