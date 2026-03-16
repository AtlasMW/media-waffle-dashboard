import { useLoaderData } from "react-router";
import type { Route } from "./+types/_app.admin.clients.$slug";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!client) throw new Response("Client not found", { status: 404 });
  return { client };
}

export default function ClientDashboard() {
  const { client } = useLoaderData<typeof loader>();

  return (
    <div>
      <h2 className="text-2xl font-bold text-[var(--color-cream-100)] mb-2">{client.name}</h2>
      <p className="text-[var(--color-cream-200)] mb-8">/{client.slug}</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Ad Spend" value="Coming soon" />
        <StatCard title="Leads" value="Coming soon" />
        <StatCard title="Bookings" value="Coming soon" />
      </div>

      <div className="mt-8 bg-[var(--color-charcoal-800)] rounded-xl border border-[var(--color-charcoal-600)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-cream-100)] mb-4">Client Details</h3>
        <dl className="space-y-3">
          <Detail label="Google Sheet ID" value={client.google_sheet_id || "Not linked"} />
          <Detail label="GHL Location ID" value={client.ghl_location_id || "Not linked"} />
          <Detail label="Created" value={new Date(client.created_at).toLocaleDateString("en-AU")} />
        </dl>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-6 rounded-xl bg-[var(--color-charcoal-800)] border border-[var(--color-charcoal-600)]">
      <p className="text-sm text-[var(--color-cream-200)]">{title}</p>
      <p className="text-2xl font-bold text-[var(--color-cream-100)] mt-1">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--color-cream-200)]">{label}</dt>
      <dd className="text-[var(--color-cream-100)]">{value}</dd>
    </div>
  );
}
