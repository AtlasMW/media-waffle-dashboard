import { useLoaderData } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.conversations";
import { createSupabaseServerClient } from "../lib/supabase.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: client } = await supabase.from("msg_clients").select("*").eq("slug", params.slug).single();
  if (!client) throw new Response("Not found", { status: 404 });
  
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 30;
  const offset = (page - 1) * limit;

  const { data: logs, count } = await supabase.from("msg_conversation_logs")
    .select("*", { count: "exact" })
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { client, logs: logs || [], total: count || 0, page, limit };
}

export default function Conversations() {
  const { client, logs, total, page, limit } = useLoaderData<typeof loader>();
  const totalPages = Math.ceil(total / limit);

  const actionColors: Record<string, { bg: string; color: string }> = {
    responded: { bg: "#e8f5e9", color: "#2e7d32" },
    escalated: { bg: "#fff3e0", color: "#ef6c00" },
    mark_lost: { bg: "#ffebee", color: "#c62828" },
    check_availability: { bg: "#e3f2fd", color: "#1565c0" },
    ignored: { bg: "#f5f5f5", color: "#666" },
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>{client.name}</h1>
      <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 24px" }}>Conversation Log | {total} total</p>

      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Montserrat', sans-serif" }}>
          <thead>
            <tr style={{ background: "#3b3b3b", color: "#f5f0e8" }}>
              <th style={th}>Time</th>
              <th style={th}>Contact</th>
              <th style={th}>Location</th>
              <th style={th}>Channel</th>
              <th style={th}>Inbound</th>
              <th style={th}>Outbound</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any, i: number) => (
              <tr key={log.id} style={{ background: i % 2 === 0 ? "white" : "#faf8f5" }}>
                <td style={td}>{new Date(log.created_at).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td style={{ ...td, fontWeight: 600 }}>{log.contact_name || "-"}</td>
                <td style={td}>{log.location_tag || "-"}</td>
                <td style={td}>{(log.channel || "").replace("TYPE_", "")}</td>
                <td style={{ ...td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.inbound_text}>{log.inbound_text || "-"}</td>
                <td style={{ ...td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.outbound_text}>{log.outbound_text || "-"}</td>
                <td style={td}>
                  <span style={{
                    padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: actionColors[log.action]?.bg || "#f5f5f5",
                    color: actionColors[log.action]?.color || "#666",
                  }}>
                    {log.action}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#8a8478", padding: 40 }}>No conversations yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {page > 1 && <a href={`?page=${page - 1}`} style={pageBtn}>Previous</a>}
          <span style={{ padding: "8px 16px", fontSize: 13, color: "#8a8478" }}>Page {page} of {totalPages}</span>
          {page < totalPages && <a href={`?page=${page + 1}`} style={pageBtn}>Next</a>}
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 };
const td: React.CSSProperties = { padding: "10px 14px", borderBottom: "1px solid #eee8dc", fontSize: 13 };
const pageBtn: React.CSSProperties = { padding: "8px 16px", background: "#3b3b3b", color: "#f5f0e8", borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 600 };
