import { useOutletContext, useParams, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.escalations";
import { createSupabaseServerClient } from "../lib/supabase.server";

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "resolve") {
    const id = form.get("id") as string;
    const notes = form.get("notes") as string;
    await supabase.from("msg_conversation_logs").update({
      escalation_status: "resolved",
      escalation_notes: notes || null,
    }).eq("id", id);
  } else if (intent === "dismiss") {
    const id = form.get("id") as string;
    await supabase.from("msg_conversation_logs").update({
      escalation_status: "dismissed",
    }).eq("id", id);
  }
  return { success: true };
}

export default function Escalations() {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const { slug } = useParams();
  const data = allClientData[slug!] || {};
  const client = data.client || {};
  const allLogs = data.conversations?.logs || [];
  const locationId = client.ghl_location_id || "";
  const fetcher = useFetcher();

  const escalations = allLogs.filter((l: any) => l.action === "escalated");
  const open = escalations.filter((l: any) => !l.escalation_status);
  const resolved = escalations.filter((l: any) => l.escalation_status);

  function ghlLink(contactId: string) {
    if (!contactId || !locationId) return null;
    return `https://app.gohighlevel.com/v2/location/${locationId}/contacts/detail/${contactId}`;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>Escalations</h1>
      <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 24px" }}>{client.name}</p>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: "#8a8478", marginBottom: 4 }}>Open</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: open.length > 0 ? "#ef6c00" : "#2e7d32" }}>{open.length}</div>
        </div>
        <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: "#8a8478", marginBottom: 4 }}>Resolved</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#3b3b3b" }}>{resolved.length}</div>
        </div>
      </div>

      {/* Open escalations */}
      {open.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#ef6c00", marginBottom: 12 }}>Open Escalations</div>
          {open.map((esc: any) => {
            const link = ghlLink(esc.contact_id);
            return (
              <div key={esc.id} style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: "4px solid #ef6c00" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#3b3b3b" }}>{esc.contact_name || "Unknown"}</div>
                    <div style={{ fontSize: 12, color: "#8a8478", marginTop: 2 }}>
                      {esc.location_tag || "-"} | {(esc.channel || "").replace("TYPE_", "")} | {new Date(esc.created_at).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", background: "#5b9ea6", color: "white", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                      Open in GHL
                    </a>
                  )}
                </div>

                <div style={{ background: "#faf8f5", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#8a8478", marginBottom: 4 }}>Lead said:</div>
                  <div style={{ fontSize: 13, color: "#3b3b3b" }}>{esc.inbound_text || "-"}</div>
                  {esc.outbound_text && (
                    <>
                      <div style={{ fontSize: 12, color: "#8a8478", marginTop: 8, marginBottom: 4 }}>AI replied:</div>
                      <div style={{ fontSize: 13, color: "#3b3b3b" }}>{esc.outbound_text}</div>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <fetcher.Form method="post" style={{ display: "flex", gap: 8, flex: 1, alignItems: "flex-end" }}>
                    <input type="hidden" name="intent" value="resolve" />
                    <input type="hidden" name="id" value={esc.id} />
                    <div style={{ flex: 1 }}>
                      <input name="notes" placeholder="Resolution notes (optional)" style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 12, fontFamily: "'Montserrat', sans-serif", background: "white", boxSizing: "border-box" }} />
                    </div>
                    <button type="submit" style={{ padding: "8px 16px", background: "#2e7d32", color: "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif", whiteSpace: "nowrap" }}>
                      Mark Resolved
                    </button>
                  </fetcher.Form>
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="dismiss" />
                    <input type="hidden" name="id" value={esc.id} />
                    <button type="submit" style={{ padding: "8px 16px", background: "#f5f5f5", color: "#666", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                      Dismiss
                    </button>
                  </fetcher.Form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open.length === 0 && (
        <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#2e7d32", marginBottom: 4 }}>All clear</div>
          <div style={{ fontSize: 13, color: "#8a8478" }}>No open escalations</div>
        </div>
      )}

      {/* Resolved escalations */}
      {resolved.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 12 }}>Resolved</div>
          {resolved.map((esc: any) => {
            const link = ghlLink(esc.contact_id);
            return (
              <div key={esc.id} style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", opacity: 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#3b3b3b" }}>{esc.contact_name || "Unknown"}</div>
                    <div style={{ fontSize: 12, color: "#8a8478", marginTop: 2 }}>
                      {esc.location_tag || "-"} | {new Date(esc.created_at).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {esc.escalation_notes && ` | ${esc.escalation_notes}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: "#e8f5e9", color: "#2e7d32" }}>
                      {esc.escalation_status}
                    </span>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "#5b9ea6", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>GHL</a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
