import { useOutletContext, useParams } from "react-router";
import { useState } from "react";

export default function Conversations() {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const { slug } = useParams();
  const data = allClientData[slug!] || {};
  const client = data.client || {};
  const logs = data.conversations?.logs || [];
  const locationId = client.ghl_location_id || "";

  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const actionColors: Record<string, { bg: string; color: string; label: string }> = {
    responded: { bg: "#e8f5e9", color: "#2e7d32", label: "Responded" },
    escalated: { bg: "#fff3e0", color: "#ef6c00", label: "Escalated" },
    mark_lost: { bg: "#ffebee", color: "#c62828", label: "Lost" },
    check_availability: { bg: "#e3f2fd", color: "#1565c0", label: "Availability" },
    ignored: { bg: "#f5f5f5", color: "#666", label: "Ignored" },
  };

  function ghlLink(contactId: string) {
    if (!contactId || !locationId) return null;
    return `https://app.gohighlevel.com/v2/location/${locationId}/contacts/detail/${contactId}`;
  }

  function timeAgo(dateStr: string) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const mins = Math.floor((now - then) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-AU", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  // Group logs by contact
  const contactMap = new Map<string, { name: string; contactId: string; location: string; channel: string; logs: any[]; lastAction: string; lastTime: string }>();

  for (const log of logs) {
    const key = log.contact_id || log.contact_name || "unknown";
    if (!contactMap.has(key)) {
      contactMap.set(key, {
        name: log.contact_name || "Unknown",
        contactId: log.contact_id || "",
        location: log.location_tag || "",
        channel: (log.channel || "").replace("TYPE_", ""),
        logs: [],
        lastAction: log.action || "",
        lastTime: log.created_at,
      });
    }
    contactMap.get(key)!.logs.push(log);
  }

  const contacts = Array.from(contactMap.values());

  // Filter
  const filtered = filter === "all" ? contacts : contacts.filter(c => c.lastAction === filter);

  // Summary counts
  const totalConversations = contacts.length;
  const responded = contacts.filter(c => c.logs.some((l: any) => l.action === "responded")).length;
  const escalated = contacts.filter(c => c.logs.some((l: any) => l.action === "escalated")).length;
  const lost = contacts.filter(c => c.lastAction === "mark_lost").length;

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>Conversations</h1>
      <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 24px" }}>{client.name}</p>

      {/* Summary cards */}
      <div className="hub-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total", value: totalConversations, bg: "#f5f0e8", color: "#3b3b3b" },
          { label: "Responded", value: responded, bg: "#e8f5e9", color: "#2e7d32" },
          { label: "Escalated", value: escalated, bg: "#fff3e0", color: "#ef6c00" },
          { label: "Lost", value: lost, bg: "#ffebee", color: "#c62828" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#8a8478", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#eee8dc", borderRadius: 8, padding: 4, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All" },
          { key: "responded", label: "Responded" },
          { key: "escalated", label: "Escalated" },
          { key: "mark_lost", label: "Lost" },
          { key: "check_availability", label: "Availability" },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            flex: 1, minWidth: 70, padding: "8px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
            background: filter === t.key ? "#3b3b3b" : "transparent",
            color: filter === t.key ? "#f5f0e8" : "#5a5a5a",
            transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contact list */}
      {filtered.length === 0 && (
        <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, color: "#8a8478" }}>No conversations yet</div>
        </div>
      )}

      {filtered.map(contact => {
        const isExpanded = expanded === contact.contactId;
        const link = ghlLink(contact.contactId);
        const ac = actionColors[contact.lastAction] || actionColors.ignored;

        return (
          <div key={contact.contactId} style={{
            background: "white", borderRadius: 12, marginBottom: 10,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderLeft: `3px solid ${ac.color}`,
            overflow: "hidden",
          }}>
            {/* Contact header - clickable to expand */}
            <div
              onClick={() => setExpanded(isExpanded ? null : contact.contactId)}
              style={{
                padding: "14px 16px", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 200 }}>
                {/* Avatar circle */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: "#eee8dc",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#3b3b3b", flexShrink: 0,
                }}>
                  {(contact.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#3b3b3b" }}>{contact.name}</div>
                  <div style={{ fontSize: 11, color: "#8a8478", marginTop: 2 }}>
                    {contact.location} | {contact.channel} | {contact.logs.length} message{contact.logs.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: ac.bg, color: ac.color,
                }}>
                  {ac.label}
                </span>
                <span style={{ fontSize: 12, color: "#8a8478", minWidth: 60, textAlign: "right" }}>
                  {timeAgo(contact.lastTime)}
                </span>
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ color: "#5b9ea6", fontSize: 11, fontWeight: 600, textDecoration: "none", padding: "4px 8px", background: "#f0f7f7", borderRadius: 4 }}>
                    GHL
                  </a>
                )}
                <span style={{ fontSize: 16, color: "#b0a89a", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  &#9660;
                </span>
              </div>
            </div>

            {/* Expanded message history */}
            {isExpanded && (
              <div style={{ borderTop: "1px solid #eee8dc", padding: "12px 16px", background: "#faf8f5" }}>
                {contact.logs.slice().reverse().map((log: any, i: number) => (
                  <div key={log.id || i} style={{ marginBottom: i < contact.logs.length - 1 ? 16 : 0 }}>
                    <div style={{ fontSize: 10, color: "#b0a89a", marginBottom: 6, fontWeight: 600 }}>
                      {formatTime(log.created_at)}
                      <span style={{
                        marginLeft: 8, padding: "1px 6px", borderRadius: 8, fontSize: 9,
                        background: actionColors[log.action]?.bg || "#f5f5f5",
                        color: actionColors[log.action]?.color || "#666",
                      }}>
                        {actionColors[log.action]?.label || log.action}
                      </span>
                    </div>

                    {/* Inbound message */}
                    {log.inbound_text && (
                      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 6 }}>
                        <div style={{
                          maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
                          borderBottomLeftRadius: 4, background: "white",
                          fontSize: 13, lineHeight: 1.5, color: "#3b3b3b",
                          border: "1px solid #eee8dc",
                        }}>
                          <div style={{ fontSize: 10, color: "#8a8478", marginBottom: 4, fontWeight: 600 }}>Lead</div>
                          {log.inbound_text}
                        </div>
                      </div>
                    )}

                    {/* Outbound message */}
                    {log.outbound_text && (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div style={{
                          maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
                          borderBottomRightRadius: 4, background: "#3b3b3b",
                          fontSize: 13, lineHeight: 1.5, color: "#f5f0e8",
                        }}>
                          <div style={{ fontSize: 10, color: "#b0a89a", marginBottom: 4, fontWeight: 600 }}>AI</div>
                          {log.outbound_text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
