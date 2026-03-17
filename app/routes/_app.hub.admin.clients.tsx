import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.admin.clients";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return Response.redirect(new URL("/hub", request.url).toString());

  const { data: clients } = await supabase.from("msg_clients").select("*").order("name");

  // Stats per client
  const stats: Record<string, any> = {};
  for (const c of clients || []) {
    const { count: totalConvs } = await supabase.from("msg_conversation_logs").select("*", { count: "exact", head: true }).eq("client_id", c.id);
    const { count: weekConvs } = await supabase.from("msg_conversation_logs").select("*", { count: "exact", head: true }).eq("client_id", c.id).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
    const { count: escalations } = await supabase.from("msg_conversation_logs").select("*", { count: "exact", head: true }).eq("client_id", c.id).eq("action", "escalated");
    const { count: lost } = await supabase.from("msg_conversation_logs").select("*", { count: "exact", head: true }).eq("client_id", c.id).eq("action", "mark_lost");
    const { count: faqCount } = await supabase.from("msg_faqs").select("*", { count: "exact", head: true }).eq("client_id", c.id).eq("is_active", true);
    const { count: offerCount } = await supabase.from("msg_offers").select("*", { count: "exact", head: true }).eq("client_id", c.id).eq("is_active", true);
    const { count: locCount } = await supabase.from("msg_locations").select("*", { count: "exact", head: true }).eq("client_id", c.id).eq("is_active", true);
    const { count: pendingSuggestions } = await supabase.from("msg_learned_patterns").select("*", { count: "exact", head: true }).eq("client_id", c.id).eq("status", "pending_review");
    stats[c.id] = { total: totalConvs || 0, week: weekConvs || 0, escalations: escalations || 0, lost: lost || 0, faqs: faqCount || 0, offers: offerCount || 0, locations: locCount || 0, pending: pendingSuggestions || 0 };
  }

  return { clients: clients || [], stats };
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "toggle_status") {
    const id = form.get("id") as string;
    const current = form.get("status") as string;
    const next = current === "active" ? "paused" : "active";
    await supabase.from("msg_clients").update({ status: next }).eq("id", id);
  }
  return { success: true };
}

export default function AdminClients() {
  const { clients, stats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 28, color: "#3b3b3b", margin: 0 }}>All Clients</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>{clients.length} messaging clients configured</p>
        </div>
        <a href="/hub/admin/onboarding" style={btnPrimary}>Onboard New Client</a>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Active Clients", value: clients.filter((c: any) => c.status === "active").length, color: "#2e7d32" },
          { label: "This Week", value: Object.values(stats).reduce((s: number, v: any) => s + v.week, 0), color: "#1565c0" },
          { label: "Escalations", value: Object.values(stats).reduce((s: number, v: any) => s + v.escalations, 0), color: "#ef6c00" },
          { label: "Pending Suggestions", value: Object.values(stats).reduce((s: number, v: any) => s + v.pending, 0), color: "#7b1fa2" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, color: "#8a8478", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Client table */}
      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Montserrat', sans-serif" }}>
          <thead>
            <tr style={{ background: "#3b3b3b", color: "#f5f0e8" }}>
              {["Client", "Status", "Locations", "Offers", "FAQs", "Conversations", "This Week", "Escalations", "Lost", "Suggestions", ""].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any, i: number) => {
              const s = stats[c.id] || {};
              return (
                <tr key={c.id} style={{ background: i % 2 === 0 ? "white" : "#faf8f5" }}>
                  <td style={{ ...td, fontWeight: 700 }}>
                    <a href={`/hub/${c.slug}/brand`} style={{ color: "#3b3b3b", textDecoration: "none" }}>{c.name}</a>
                    <div style={{ fontSize: 11, color: "#b0a89a", fontWeight: 400 }}>{c.slug}</div>
                  </td>
                  <td style={td}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: c.status === "active" ? "#e8f5e9" : "#fff3e0",
                      color: c.status === "active" ? "#2e7d32" : "#ef6c00",
                    }}>{c.status}</span>
                  </td>
                  <td style={td}>{s.locations}</td>
                  <td style={td}>{s.offers}</td>
                  <td style={td}>{s.faqs}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{s.total}</td>
                  <td style={td}>{s.week}</td>
                  <td style={td}>{s.escalations > 0 ? <span style={{ color: "#ef6c00", fontWeight: 600 }}>{s.escalations}</span> : 0}</td>
                  <td style={td}>{s.lost}</td>
                  <td style={td}>{s.pending > 0 ? <span style={{ color: "#7b1fa2", fontWeight: 600 }}>{s.pending}</span> : 0}</td>
                  <td style={td}>
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="toggle_status" />
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value={c.status} />
                      <button type="submit" style={{
                        ...btnSmall,
                        background: c.status === "active" ? "#fff3e0" : "#e8f5e9",
                        color: c.status === "active" ? "#ef6c00" : "#2e7d32",
                      }}>
                        {c.status === "active" ? "Pause" : "Activate"}
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 };
const td: React.CSSProperties = { padding: "12px 14px", borderBottom: "1px solid #eee8dc" };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif", textDecoration: "none" };
const btnSmall: React.CSSProperties = { padding: "5px 10px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
