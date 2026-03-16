import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/_app.admin.index";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return { clients: clients ?? [] };
}

export default function AdminHub() {
  const { clients } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-cream-100)]">Admin Dashboard</h2>
        <Link
          to="/admin/invite"
          className="px-4 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-charcoal-900)] font-semibold transition-colors"
        >
          Invite Client
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client: any) => (
          <Link
            key={client.id}
            to={`/admin/clients/${client.slug}`}
            className="block p-6 rounded-xl bg-[var(--color-charcoal-800)] border border-[var(--color-charcoal-600)] hover:border-[var(--color-accent)] transition-colors"
          >
            <h3 className="text-lg font-semibold text-[var(--color-cream-100)]">{client.name}</h3>
            <p className="text-sm text-[var(--color-cream-200)] mt-1">{client.slug}</p>
          </Link>
        ))}
        {clients.length === 0 && (
          <p className="text-[var(--color-cream-200)] col-span-full">
            No clients yet. Invite your first client to get started.
          </p>
        )}
      </div>
    </div>
  );
}
