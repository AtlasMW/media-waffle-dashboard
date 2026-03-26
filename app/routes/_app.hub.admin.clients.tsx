import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.admin.clients";
import { createSupabaseServerClient } from "../lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());

  // Single query for clients
  const { data: clients } = await supabase.from("msg_clients").select("*").order("name");

  // Batch stats in parallel (2 queries total instead of 8 per client)
  const [convRes, faqRes] = await Promise.all([
    supabase.from("msg_conversation_logs").select("client_id, action"),
    supabase.from("msg_faqs").select("client_id").eq("is_active", true),
  ]);

  // Aggregate stats in JS
  const stats: Record<string, any> = {};
  for (const c of clients || []) {
    const convs = (convRes.data || []).filter((r: any) => r.client_id === c.id);
    stats[c.id] = {
      total: convs.length,
      escalations: convs.filter((r: any) => r.action === "escalated").length,
      lost: convs.filter((r: any) => r.action === "mark_lost").length,
      faqs: (faqRes.data || []).filter((r: any) => r.client_id === c.id).length,
    };
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
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_clients?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ status: next }),
    });
  }
  return { success: true };
}

export default function AdminClients() {
  const { clients, stats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div>
      <div className="hub-page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 28, color: "#3b3b3b", margin: 0 }}>All Clients</h1>
          <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 0" }}>{clients.length} messaging clients configured</p>
        </div>
        <a href="/hub/admin/onboarding" style={btnPrimary}>+ New Client</a>
      </div>

      {/* Summary cards */}
      <div className="hub-grid-4" style={{ marginBottom: 32 }}>
        {[
          { label: "Active Clients", value: clients.filter((c: any) => c.status === "active").length, color: "#2e7d32" },
          { label: "Total Conversations", value: Object.values(stats).reduce((s: number, v: any) => s + v.total, 0), color: "#1565c0" },
          { label: "Escalations", value: Object.values(stats).reduce((s: number, v: any) => s + v.escalations, 0), color: "#ef6c00" },
          { label: "Total FAQs", value: Object.values(stats).reduce((s: number, v: any) => s + v.faqs, 0), color: "#7b1fa2" },
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
              {["Client", "Status", "FAQs", "Conversations", "Escalations", "Lost", ""].map(h => (
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
                  <td style={td}>{s.faqs}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{s.total}</td>
                  <td style={td}>{s.escalations > 0 ? <span style={{ color: "#ef6c00", fontWeight: 600 }}>{s.escalations}</span> : 0}</td>
                  <td style={td}>{s.lost}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={`/hub/${c.slug}/brand`} style={{ ...btnSmall, background: "#e3f2fd", color: "#1565c0", textDecoration: "none" }}>Manage</a>
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
                    </div>
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
