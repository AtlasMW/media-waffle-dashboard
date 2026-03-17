import { useOutletContext, useParams, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.services";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { data: client } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {};
  if (intent === "add") {
    await supabase.from("msg_services").insert({
      client_id: client.id, name: form.get("name"),
      description: form.get("description") || null,
      price_range: form.get("price_range") || null,
      duration: form.get("duration") || null, is_active: true,
    });
  } else if (intent === "toggle") {
    const active = form.get("is_active") === "true";
    await supabase.from("msg_services").update({ is_active: !active }).eq("id", form.get("id"));
  } else if (intent === "delete") {
    await supabase.from("msg_services").delete().eq("id", form.get("id"));
  }
  return { success: true };
}

export default function Services() {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const { slug } = useParams();
  const data = allClientData[slug!] || {};
  const client = data.client || {};
  const services = data.services || [];
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div style={{ maxWidth: 720, width: "100%" }}>
      <div className="hub-page-header">
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>Services</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>{client.name}</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={btn}>{showAdd ? "Cancel" : "Add Service"}</button>
      </div>

      {showAdd && (
        <div style={card}>
          <fetcher.Form method="post" onSubmit={() => setShowAdd(false)}>
            <input type="hidden" name="intent" value="add" />
            {[["Service Name","name",true],["Description","description"],["Price Range","price_range"],["Duration","duration"]].map(([l,n,r]: any) => (
              <div key={n} style={{ marginBottom: 12 }}>
                <label style={labelSt}>{l}</label>
                <input name={n} required={r} style={input} />
              </div>
            ))}
            <button type="submit" style={btn}>Save Service</button>
          </fetcher.Form>
        </div>
      )}

      {services.map((svc: any) => (
        <div key={svc.id} style={{ ...card, opacity: svc.is_active ? 1 : 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#3b3b3b" }}>{svc.name}</div>
            {svc.description && <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{svc.description}</div>}
            <div style={{ fontSize: 12, color: "#8a8478", marginTop: 4 }}>
              {svc.price_range && <span>{svc.price_range}</span>}
              {svc.price_range && svc.duration && <span> | </span>}
              {svc.duration && <span>{svc.duration}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="toggle" />
              <input type="hidden" name="id" value={svc.id} />
              <input type="hidden" name="is_active" value={String(svc.is_active)} />
              <button type="submit" style={{ ...btnSm, background: svc.is_active ? "#fff3e0" : "#e8f5e9", color: svc.is_active ? "#ef6c00" : "#2e7d32" }}>
                {svc.is_active ? "Off" : "On"}
              </button>
            </fetcher.Form>
            <fetcher.Form method="post" onSubmit={(e) => { if (!confirm("Delete?")) e.preventDefault(); }}>
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={svc.id} />
              <button type="submit" style={{ ...btnSm, background: "#ffebee", color: "#c62828" }}>X</button>
            </fetcher.Form>
          </div>
        </div>
      ))}
    </div>
  );
}

const card: React.CSSProperties = { background: "white", borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" };
const labelSt: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#3b3b3b", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" };
const btn: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
const btnSm: React.CSSProperties = { padding: "6px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
