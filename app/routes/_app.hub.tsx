import { Outlet, useLoaderData, NavLink } from "react-router";
import type { Route } from "./+types/_app.hub";
import { createSupabaseServerClient } from "../lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());

  // Check if user is admin or has messaging client access
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  // Get messaging clients this user has access to
  const { data: clientAccess } = await supabase.from("msg_client_users").select("client_id, role, msg_clients(id, name, slug, status)").eq("user_id", user.id);

  if (!isAdmin && (!clientAccess || clientAccess.length === 0)) {
    return Response.redirect(new URL("/dashboard", request.url).toString());
  }

  return { isAdmin, clients: clientAccess || [], userId: user.id };
}

export default function HubLayout() {
  const { isAdmin, clients } = useLoaderData<typeof loader>();

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Montserrat', sans-serif",
      background: "#f5f0e8",
    }}>
      {/* Sidebar - matches client dashboard design */}
      <nav style={{
        width: 240,
        background: "#ffffff",
        borderRight: "1px solid #ddd5c4",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}>
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #ddd5c4" }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "#c4a882" }}>AI Messaging Hub</div>
        </div>

        <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", padding: "12px 12px 6px" }}>
            Navigation
          </div>

          <NavLink prefetch="intent" to="/hub" end style={({ isActive }) => navStyle(isActive)}>
            Overview
          </NavLink>

          {clients.map((ca: any) => {
            const client = ca.msg_clients;
            if (!client) return null;
            return (
              <div key={client.id}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", padding: "16px 12px 6px" }}>
                  {client.name}
                </div>
                <NavLink prefetch="render" to={`/hub/${client.slug}/brand`} style={({ isActive }) => navStyle(isActive)}>Brand</NavLink>
                <NavLink prefetch="render" to={`/hub/${client.slug}/offers`} style={({ isActive }) => navStyle(isActive)}>Offers</NavLink>
                <NavLink prefetch="render" to={`/hub/${client.slug}/faqs`} style={({ isActive }) => navStyle(isActive)}>FAQs</NavLink>
                <NavLink prefetch="render" to={`/hub/${client.slug}/locations`} style={({ isActive }) => navStyle(isActive)}>Locations</NavLink>
                <NavLink prefetch="render" to={`/hub/${client.slug}/services`} style={({ isActive }) => navStyle(isActive)}>Services</NavLink>
                <NavLink prefetch="render" to={`/hub/${client.slug}/conversations`} style={({ isActive }) => navStyle(isActive)}>Conversations</NavLink>
              </div>
            );
          })}

          {isAdmin && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", padding: "16px 12px 6px", marginTop: "auto" }}>
                Admin
              </div>
              <NavLink prefetch="intent" to="/hub/admin/clients" style={({ isActive }) => navStyle(isActive)}>All Clients</NavLink>
              <NavLink prefetch="intent" to="/hub/admin/onboarding" style={({ isActive }) => navStyle(isActive)}>New Client</NavLink>
            </>
          )}
        </div>

        <div style={{ padding: "16px 12px", borderTop: "1px solid #ddd5c4" }}>
          <div style={{ fontSize: 11, color: "#999", fontWeight: 500 }}>Messaging Hub</div>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh", padding: 32, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

function navStyle(isActive: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? "white" : "#5a5a5a",
    background: isActive ? "#3b3b3b" : "transparent",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: 2,
  };
}
