import { useRouteLoaderData } from "react-router";

export default function ClientDashboard() {
  const appData = useRouteLoaderData("routes/_app") as any;
  const displayName = appData?.profile?.display_name ?? "there";

  return (
    <div>
      <h2 className="text-2xl font-bold text-[var(--color-cream-100)] mb-2">
        G&apos;day, {displayName}
      </h2>
      <p className="text-[var(--color-cream-200)] mb-8">
        Welcome to your Media Waffle dashboard.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-xl bg-[var(--color-charcoal-800)] border border-[var(--color-charcoal-600)]">
          <p className="text-sm text-[var(--color-cream-200)]">Ad Performance</p>
          <p className="text-2xl font-bold text-[var(--color-cream-100)] mt-1">Coming soon</p>
        </div>
        <div className="p-6 rounded-xl bg-[var(--color-charcoal-800)] border border-[var(--color-charcoal-600)]">
          <p className="text-sm text-[var(--color-cream-200)]">Leads This Month</p>
          <p className="text-2xl font-bold text-[var(--color-cream-100)] mt-1">Coming soon</p>
        </div>
        <div className="p-6 rounded-xl bg-[var(--color-charcoal-800)] border border-[var(--color-charcoal-600)]">
          <p className="text-sm text-[var(--color-cream-200)]">Bookings</p>
          <p className="text-2xl font-bold text-[var(--color-cream-100)] mt-1">Coming soon</p>
        </div>
      </div>

      <div className="mt-8 bg-[var(--color-charcoal-800)] rounded-xl border border-[var(--color-charcoal-600)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-cream-100)] mb-2">Your Reports</h3>
        <p className="text-[var(--color-cream-200)]">
          Monthly performance reports will appear here once your campaigns are live.
        </p>
      </div>
    </div>
  );
}
