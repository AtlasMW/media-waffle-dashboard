import { useOutletContext, useParams } from "react-router";

export default function Conversations() {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const { slug } = useParams();
  const data = allClientData[slug!] || {};
  const client = data.client || {};
  const logs = data.conversations?.logs || [];
  const locationId = client.ghl_location_id || "";

  const actionColors: Record<string, { bg: string; color: string }> = {
    responded: { bg: "#e8f5e9", color: "#2e7d32" },
    escalated: { bg: "#fff3e0", color: "#ef6c00" },
    mark_lost: { bg: "#ffebee", color: "#c62828" },
    check_availability: { bg: "#e3f2fd", color: "#1565c0" },
    ignored: { bg: "#f5f5f5", color: "#666" },
  };

  function ghlLink(contactId: string) {
    if (!contactId || !locationId) return null;
    return `https://app.gohighlevel.com/v2/location/${locationId}/contacts/detail/${contactId}`;
  }

  return (
    <div style={{ maxWidth: 960, width: "100%" }}>
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>Conversations</h1>
      <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 24px" }}>{client.name}</p>

      <div className="hub-table-wrap" style={{ background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
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
              <th style={th}>GHL</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any, i: number) => {
              const link = ghlLink(log.contact_id);
              return (
                <tr key={log.id} style={{ background: i % 2 === 0 ? "white" : "#faf8f5" }}>
                  <td style={td}>{new Date(log.created_at).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{log.contact_name || "-"}</td>
                  <td style={td}>{log.location_tag || "-"}</td>
                  <td style={td}>{(log.channel || "").replace("TYPE_", "")}</td>
                  <td style={{ ...td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.inbound_text}>{log.inbound_text || "-"}</td>
                  <td style={{ ...td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.outbound_text}>{log.outbound_text || "-"}</td>
                  <td style={td}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: actionColors[log.action]?.bg || "#f5f5f5",
                      color: actionColors[log.action]?.color || "#666",
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={td}>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "#5b9ea6", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                        Open
                      </a>
                    ) : "-"}
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr><td colSpan={8} style={{ ...td, textAlign: "center", color: "#8a8478", padding: 40 }}>No conversations yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 };
const td: React.CSSProperties = { padding: "10px 14px", borderBottom: "1px solid #eee8dc", fontSize: 13 };
