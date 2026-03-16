import { Outlet, redirect, useLoaderData, Link, Form } from "react-router";
import type { Route } from "./+types/_app";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw redirect("/login", { headers });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, client_slug")
    .eq("id", user.id)
    .single();

  return Response.json({
    user: { id: user.id, email: user.email },
    profile: profile ?? { role: "client", display_name: user.email, client_slug: null },
    env: { SUPABASE_URL: process.env.SUPABASE_URL!, SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY! },
  }, { headers });
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request);
  await supabase.auth.signOut();
  return redirect("/login", { headers });
}

export default function AppLayout() {
  const { profile } = useLoaderData<typeof loader>();
  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen flex bg-[var(--color-charcoal-900)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-charcoal-800)] border-r border-[var(--color-charcoal-600)] flex flex-col">
        <div className="p-6 border-b border-[var(--color-charcoal-600)]">
          <h1 className="text-xl font-bold text-[var(--color-accent)]">Media Waffle</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {isAdmin ? (
            <>
              <NavLink to="/admin">Dashboard</NavLink>
              <NavLink to="/admin/clients">Clients</NavLink>
              <NavLink to="/admin/invite">Invite Client</NavLink>
            </>
          ) : (
            <NavLink to="/dashboard">Dashboard</NavLink>
          )}
        </nav>
        <div className="p-4 border-t border-[var(--color-charcoal-600)]">
          <p className="text-sm text-[var(--color-cream-200)] mb-3 truncate">
            {profile.display_name}
          </p>
          <Form method="post">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg text-sm bg-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-600)] text-[var(--color-cream-200)] transition-colors"
            >
              Sign Out
            </button>
          </Form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-4 py-2 rounded-lg text-[var(--color-cream-200)] hover:bg-[var(--color-charcoal-700)] hover:text-[var(--color-cream-100)] transition-colors"
    >
      {children}
    </Link>
  );
}
