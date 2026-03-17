import { Outlet, useLoaderData, NavLink, useLocation } from "react-router";
import type { Route } from "./+types/_app.hub";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState, useEffect } from "react";

export function shouldRevalidate({ formAction }: any) {
  if (formAction) return true;
  return false;
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  const { data: clientAccess } = await supabase.from("msg_client_users").select("client_id, role, msg_clients(id, name, slug, status, ghl_location_id)").eq("user_id", user.id);

  if (!isAdmin && (!clientAccess || clientAccess.length === 0)) {
    return Response.redirect(new URL("/dashboard", request.url).toString());
  }

  const allClientData: Record<string, any> = {};
  const clientList = (clientAccess || []).map((ca: any) => ca.msg_clients).filter(Boolean);

  for (const client of clientList) {
    const [brand, offers, faqs, locations, services, blocked, suggested, convLogs, trainingExamples] = await Promise.all([
      supabase.from("msg_brand_config").select("*").eq("client_id", client.id).single(),
      supabase.from("msg_offers").select("*").eq("client_id", client.id).order("is_active", { ascending: false }).order("updated_at", { ascending: false }),
      supabase.from("msg_faqs").select("*").eq("client_id", client.id).order("times_used", { ascending: false }),
      supabase.from("msg_locations").select("*").eq("client_id", client.id).order("name"),
      supabase.from("msg_services").select("*").eq("client_id", client.id).order("name"),
      supabase.from("msg_blocked_topics").select("*").eq("client_id", client.id),
      supabase.from("msg_learned_patterns").select("*").eq("client_id", client.id).eq("status", "pending_review"),
      supabase.from("msg_conversation_logs").select("*").eq("client_id", client.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("msg_training_examples").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
    ]);
    allClientData[client.slug] = {
      client,
      brand: brand.data,
      offers: offers.data || [],
      faqs: faqs.data || [],
      locations: locations.data || [],
      services: services.data || [],
      blocked: blocked.data || [],
      suggested: suggested.data || [],
      conversations: { logs: convLogs.data || [], total: convLogs.data?.length || 0 },
      trainingExamples: trainingExamples.data || [],
    };
  }

  return { isAdmin, clients: clientAccess || [], userId: user.id, allClientData };
}

const HUB_CSS = `
.hub-wrap { display: flex; min-height: 100vh; font-family: 'Montserrat', sans-serif; background: #f5f0e8; }
.hub-sidebar {
  width: 240px; background: #fff; border-right: 1px solid #ddd5c4;
  position: fixed; top: 0; left: 0; bottom: 0;
  display: flex; flex-direction: column; z-index: 40;
  transition: transform 0.25s ease;
}
.hub-overlay { display: none; }
.hub-hamburger { display: none; }
.hub-close-btn { display: none; }
.hub-main { margin-left: 240px; flex: 1; min-height: 100vh; padding: 32px; overflow-y: auto; }

@media (max-width: 768px) {
  .hub-sidebar {
    transform: translateX(-100%);
    width: 280px;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15);
  }
  .hub-sidebar.open { transform: translateX(0); }
  .hub-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 35; }
  .hub-overlay.open { display: block; }
  .hub-close-btn { display: block; }
  .hub-hamburger {
    display: flex; align-items: center; justify-content: center;
    position: fixed; top: 12px; right: 12px; z-index: 50;
    width: 40px; height: 40px; border-radius: 8px;
    background: #fff; border: 1px solid #ddd5c4; cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .hub-main { margin-left: 0; padding: 16px; padding-top: 16px; }
}

/* Responsive tables */
.hub-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 768px) {
  .hub-table-wrap table { min-width: 640px; }
}

/* Responsive grids */
.hub-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.hub-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.hub-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.hub-grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
@media (max-width: 768px) {
  .hub-grid-2, .hub-grid-3, .hub-grid-4 { grid-template-columns: 1fr; }
  .hub-grid-cards { grid-template-columns: 1fr; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .hub-grid-4 { grid-template-columns: repeat(2, 1fr); }
}

/* Responsive form rows */
.hub-form-row { display: flex; gap: 8px; align-items: flex-end; }
@media (max-width: 768px) {
  .hub-form-row { flex-direction: column; align-items: stretch; }
  .hub-form-row input, .hub-form-row button { width: 100%; }
}

/* Responsive action buttons */
.hub-actions { display: flex; gap: 8px; flex-shrink: 0; }
@media (max-width: 768px) {
  .hub-card-layout { flex-direction: column !important; }
  .hub-actions { margin-top: 12px; }
}

/* Responsive page header */
.hub-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
@media (max-width: 480px) {
  .hub-page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
}

/* Escalation resolve row */
.hub-resolve-row { display: flex; gap: 8px; align-items: flex-end; }
@media (max-width: 768px) {
  .hub-resolve-row { flex-direction: column; align-items: stretch; }
}
`;

export default function HubLayout() {
  const { isAdmin, clients } = useLoaderData<typeof loader>();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HUB_CSS }} />
      <div className="hub-wrap">
        {/* Hamburger button - mobile only */}
        <button className="hub-hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b3b3b" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Overlay - mobile only */}
        <div className={`hub-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />

        {/* Sidebar */}
        <nav className={`hub-sidebar ${menuOpen ? "open" : ""}`}>
          <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #ddd5c4", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 2.5, textTransform: "uppercase", color: "#3b3b3b" }}>Media Waffle</div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "#c4a882", marginTop: 4 }}>AI Messaging Hub</div>
            </div>
            <button className="hub-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b3b3b" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
            <div style={sectionLabel}>Navigation</div>
            <NavLink prefetch="intent" to="/hub" end style={({ isActive }) => navStyle(isActive)}>
              <NavIcon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
              Overview
            </NavLink>

            {clients.map((ca: any) => {
              const client = ca.msg_clients;
              if (!client) return null;
              return (
                <div key={client.id}>
                  <div style={sectionLabel}>{client.name}</div>
                  <NavLink prefetch="render" to={`/hub/${client.slug}/brand`} style={({ isActive }) => navStyle(isActive)}>
                    <NavIcon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" />
                    Brand Identity
                  </NavLink>
                  <NavLink prefetch="render" to={`/hub/${client.slug}/settings`} style={({ isActive }) => navStyle(isActive)}>
                    <NavIcon d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                    Settings
                  </NavLink>
                  <NavLink prefetch="render" to={`/hub/${client.slug}/offers`} style={({ isActive }) => navStyle(isActive)}>
                    <NavIcon text="$" />
                    Offers & Services
                  </NavLink>
                  <NavLink prefetch="render" to={`/hub/${client.slug}/faqs`} style={({ isActive }) => navStyle(isActive)}>
                    <NavIcon text="?" />
                    FAQs
                  </NavLink>
                  <NavLink prefetch="render" to={`/hub/${client.slug}/locations`} style={({ isActive }) => navStyle(isActive)}>
                    <NavIcon d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                    Locations
                  </NavLink>
                  <NavLink prefetch="render" to={`/hub/${client.slug}/conversations`} style={({ isActive }) => navStyle(isActive)}>
                    <NavIcon d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                    Conversations
                  </NavLink>
                  <NavLink prefetch="render" to={`/hub/${client.slug}/escalations`} style={({ isActive }) => navStyle(isActive)}>
                    <NavIcon d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    Escalations
                  </NavLink>
                  <NavLink prefetch="render" to={`/hub/${client.slug}/training`} style={({ isActive }) => navStyle(isActive)}>
                    <NavIcon d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />
                    AI Training
                  </NavLink>
                </div>
              );
            })}

            {isAdmin && (
              <>
                <div style={sectionLabel}>Admin</div>
                <NavLink prefetch="intent" to="/hub/admin/clients" style={({ isActive }) => navStyle(isActive)}>
                  <NavIcon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  All Clients
                </NavLink>
                <NavLink prefetch="intent" to="/hub/admin/onboarding" style={({ isActive }) => navStyle(isActive)}>
                  <NavIcon d="M12 5v14m-7-7h14" />
                  New Client
                </NavLink>
              </>
            )}
          </div>

          <div style={{ padding: "16px 16px", borderTop: "1px solid #ddd5c4" }}>
            <div style={{ fontSize: 10, color: "#bbb", fontWeight: 500 }}>Powered by Media Waffle</div>
          </div>
        </nav>

        <main className="hub-main">
          <Outlet context={{ allClientData: (useLoaderData<typeof loader>() as any).allClientData }} />
        </main>
      </div>
    </>
  );
}

function NavIcon({ d, text }: { d?: string; text?: string }) {
  if (text) {
    return (
      <span style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 400, fontFamily: "'Montserrat', sans-serif" }}>{text}</span>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: 2,
  textTransform: "uppercase", color: "#aaa", padding: "16px 12px 6px",
};

function navStyle(isActive: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
    color: isActive ? "white" : "#5a5a5a",
    background: isActive ? "#3b3b3b" : "transparent",
    textDecoration: "none", cursor: "pointer",
    transition: "all 0.2s", marginBottom: 2,
  };
}
