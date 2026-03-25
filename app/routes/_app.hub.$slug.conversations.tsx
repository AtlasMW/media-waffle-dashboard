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

  // Disambiguate contacts with the same display name
  const nameCount = new Map<string, number>();
  for (const c of contactMap.values()) {
    nameCount.set(c.name, (nameCount.get(c.name) || 0) + 1);
  }
  for (const c of contactMap.values()) {
    if ((nameCount.get(c.name) || 0) > 1 && c.contactId) {
      c.name = `${c.name} (${c.contactId.slice(-4)})`;
    }
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

            {/* Expanded chat thread */}
            {isExpanded && (
              <div style={{ borderTop: "1px solid #eee8dc", background: "#faf8f5" }}>
                {/* Chat messages - continuous thread */}
                <div style={{ padding: "16px 16px 12px", maxHeight: 400, overflowY: "auto" }}>
                  {contact.logs.slice().reverse().map((log: any, i: number) => {
                    const prevLog = i > 0 ? contact.logs.slice().reverse()[i - 1] : null;
                    const showDate = !prevLog || new Date(log.created_at).toDateString() !== new Date(prevLog.created_at).toDateString();

                    return (
                      <div key={log.id || i}>
                        {/* Date separator */}
                        {showDate && (
                          <div style={{ textAlign: "center", margin: "12px 0 8px", position: "relative" }}>
                            <span style={{ background: "#faf8f5", padding: "0 12px", fontSize: 10, color: "#b0a89a", fontWeight: 600, position: "relative", zIndex: 1 }}>
                              {new Date(log.created_at).toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short" })}
                            </span>
                          </div>
                        )}

                        {/* Inbound bubble */}
                        {log.inbound_text && (
                          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 4 }}>
                            <div style={{ maxWidth: "80%" }}>
                              <div style={{
                                padding: "8px 12px", borderRadius: "12px 12px 12px 4px",
                                background: "white", border: "1px solid #eee8dc",
                                fontSize: 13, lineHeight: 1.5, color: "#3b3b3b",
                              }}>
                                {log.inbound_text}
                              </div>
                              <div style={{ fontSize: 9, color: "#b0a89a", marginTop: 2, paddingLeft: 4 }}>
                                {new Date(log.created_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Outbound bubble */}
                        {log.outbound_text && (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                            <div style={{ maxWidth: "80%" }}>
                              <div style={{
                                padding: "8px 12px", borderRadius: "12px 12px 4px 12px",
                                background: "#3b3b3b", fontSize: 13, lineHeight: 1.5, color: "#f5f0e8",
                              }}>
                                {log.outbound_text}
                              </div>
                              <div style={{ fontSize: 9, color: "#b0a89a", marginTop: 2, textAlign: "right", paddingRight: 4 }}>
                                {new Date(log.created_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                                {log.action && log.action !== "responded" && (
                                  <span style={{
                                    marginLeft: 6, padding: "1px 5px", borderRadius: 6, fontSize: 8,
                                    background: actionColors[log.action]?.bg || "#f5f5f5",
                                    color: actionColors[log.action]?.color || "#666",
                                  }}>
                                    {actionColors[log.action]?.label || log.action}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Escalation / action-only entries (no outbound text) */}
                        {!log.outbound_text && log.action === "escalated" && (
                          <div style={{ textAlign: "center", margin: "6px 0" }}>
                            <span style={{ fontSize: 10, color: "#ef6c00", fontWeight: 600, background: "#fff3e0", padding: "2px 10px", borderRadius: 8 }}>
                              Escalated to owner
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Thread summary footer */}
                <div style={{ borderTop: "1px solid #eee8dc", padding: "8px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "#b0a89a" }}>
                    {contact.logs.length} exchange{contact.logs.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 10, color: "#b0a89a" }}>
                    First: {new Date(contact.logs[contact.logs.length - 1]?.created_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })}
                  </span>
                  <span style={{ fontSize: 10, color: "#b0a89a" }}>
                    Last: {new Date(contact.logs[0]?.created_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })}
                  </span>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#5b9ea6", fontWeight: 600, textDecoration: "none", marginLeft: "auto" }}>
                      View full history in GHL &rarr;
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
