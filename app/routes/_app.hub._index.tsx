import { useLoaderData } from "react-router";
import type { Route } from "./+types/_app.hub._index";
import { createSupabaseServerClient } from "../lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { clients: [], stats: {} };

  const { data: clients } = await supabase.from("msg_clients").select("*").order("name");
  
  // Get conversation stats per client
  const stats: Record<string, any> = {};
  for (const client of clients || []) {
    const { count: totalConvs } = await supabase.from("msg_conversation_logs").select("*", { count: "exact", head: true }).eq("client_id", client.id);
    const { count: todayConvs } = await supabase.from("msg_conversation_logs").select("*", { count: "exact", head: true }).eq("client_id", client.id).gte("created_at", new Date().toISOString().slice(0, 10));
    stats[client.id] = { total: totalConvs || 0, today: todayConvs || 0 };
  }

  return { clients: clients || [], stats };
}

export default function HubOverview() {
  const { clients, stats } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 28, color: "#3b3b3b", marginBottom: 8 }}>AI Messaging Hub</h1>
      <p style={{ color: "#8a8478", fontSize: 14, marginBottom: 32 }}>Manage AI messaging systems for all clients</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {clients.map((client: any) => (
          <div key={client.id} style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 18, color: "#3b3b3b", margin: 0 }}>{client.name}</h3>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 20,
                background: client.status === "active" ? "#e8f5e9" : client.status === "paused" ? "#fff3e0" : "#f5f5f5",
                color: client.status === "active" ? "#2e7d32" : client.status === "paused" ? "#ef6c00" : "#666",
              }}>
                {client.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#8a8478", marginBottom: 2 }}>Total Conversations</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#3b3b3b" }}>{stats[client.id]?.total || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#8a8478", marginBottom: 2 }}>Today</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#3b3b3b" }}>{stats[client.id]?.today || 0}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <a href={`/hub/${client.slug}/brand`} style={btnStyle}>Manage</a>
              <a href={`/hub/${client.slug}/conversations`} style={{ ...btnStyle, background: "transparent", color: "#3b3b3b", border: "1px solid #ddd5c4" }}>Conversations</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'Montserrat', sans-serif",
  border: "none",
  cursor: "pointer",
};
