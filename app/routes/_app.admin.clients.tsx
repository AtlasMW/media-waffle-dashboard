import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/_app.admin.clients";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  return { clients: clients ?? [] };
}

export default function AdminClients() {
  const { clients } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-cream-100)]">Clients</h2>
        <Link
          to="/admin/invite"
          className="px-4 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-charcoal-900)] font-semibold transition-colors"
        >
          Add Client
        </Link>
      </div>

      <div className="bg-[var(--color-charcoal-800)] rounded-xl border border-[var(--color-charcoal-600)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-charcoal-600)]">
              <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-cream-200)]">Name</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-cream-200)]">Slug</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-cream-200)]">Created</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client: any) => (
              <tr key={client.id} className="border-b border-[var(--color-charcoal-700)] last:border-0">
                <td className="px-6 py-4">
                  <Link to={`/admin/clients/${client.slug}`} className="text-[var(--color-accent)] hover:underline font-medium">
                    {client.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-[var(--color-cream-200)]">{client.slug}</td>
                <td className="px-6 py-4 text-[var(--color-cream-200)] text-sm">
                  {new Date(client.created_at).toLocaleDateString("en-AU")}
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-[var(--color-cream-200)]">
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
