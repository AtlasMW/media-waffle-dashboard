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
      {/* Sidebar */}
      <nav style={{
        width: 260,
        background: "#3b3b3b",
        color: "#f5f0e8",
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}>
        <div style={{ padding: "0 24px 24px", borderBottom: "1px solid rgba(245,240,232,0.1)" }}>
          <img src="/mw-logo.png" alt="Media Waffle" style={{ height: 32, marginBottom: 8 }} onError={(e) => (e.currentTarget.style.display = "none")} />
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Georgia', serif" }}>AI Messaging Hub</div>
          <div style={{ fontSize: 11, color: "#c4a882", marginTop: 4 }}>Powered by Media Waffle</div>
        </div>

        <div style={{ padding: "16px 24px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#8a8478" }}>
          Navigation
        </div>

        <NavLink to="/hub" end style={({ isActive }) => navStyle(isActive)}>
          <span>Overview</span>
        </NavLink>

        {clients.map((ca: any) => {
          const client = ca.msg_clients;
          if (!client) return null;
          return (
            <div key={client.id}>
              <div style={{ padding: "16px 24px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#8a8478" }}>
                {client.name}
              </div>
              <NavLink to={`/hub/${client.slug}/brand`} style={({ isActive }) => navStyle(isActive)}>Brand</NavLink>
              <NavLink to={`/hub/${client.slug}/offers`} style={({ isActive }) => navStyle(isActive)}>Offers</NavLink>
              <NavLink to={`/hub/${client.slug}/faqs`} style={({ isActive }) => navStyle(isActive)}>FAQs</NavLink>
              <NavLink to={`/hub/${client.slug}/locations`} style={({ isActive }) => navStyle(isActive)}>Locations</NavLink>
              <NavLink to={`/hub/${client.slug}/services`} style={({ isActive }) => navStyle(isActive)}>Services</NavLink>
              <NavLink to={`/hub/${client.slug}/conversations`} style={({ isActive }) => navStyle(isActive)}>Conversations</NavLink>
            </div>
          );
        })}

        {isAdmin && (
          <>
            <div style={{ padding: "16px 24px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#8a8478", marginTop: "auto" }}>
              Admin
            </div>
            <NavLink to="/hub/admin/clients" style={({ isActive }) => navStyle(isActive)}>All Clients</NavLink>
            <NavLink to="/hub/admin/onboarding" style={({ isActive }) => navStyle(isActive)}>New Client</NavLink>
          </>
        )}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

function navStyle(isActive: boolean): React.CSSProperties {
  return {
    display: "block",
    padding: "10px 24px",
    color: isActive ? "#f5f0e8" : "#b0a89a",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: isActive ? 600 : 400,
    background: isActive ? "rgba(196,168,130,0.15)" : "transparent",
    borderLeft: isActive ? "3px solid #c4a882" : "3px solid transparent",
    transition: "all 0.15s",
  };
}
