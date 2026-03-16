import { data, useActionData } from "react-router";
import type { Route } from "./+types/_app.admin.invite";
import { createSupabaseServiceClient } from "~/lib/supabase.server";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const clientName = formData.get("clientName") as string;
  const slug = formData.get("slug") as string;

  if (!email || !clientName || !slug) {
    return data({ error: "All fields are required.", success: false }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  // Create client record
  const { error: clientError } = await supabase
    .from("clients")
    .insert({ name: clientName, slug });

  if (clientError) {
    return data({ error: `Failed to create client: ${clientError.message}`, success: false }, { status: 400 });
  }

  // Invite user via magic link
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { display_name: clientName },
  });

  if (inviteError) {
    return data({ error: `Failed to invite user: ${inviteError.message}`, success: false }, { status: 400 });
  }

  // Update profile with client_slug
  if (inviteData.user) {
    await supabase
      .from("profiles")
      .update({ client_slug: slug, display_name: clientName })
      .eq("id", inviteData.user.id);
  }

  return data({ error: null, success: true });
}

export default function InviteClient() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-[var(--color-cream-100)] mb-8">Invite Client</h2>

      {actionData?.success && (
        <div className="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-700 text-green-300">
          Client invited successfully. They&apos;ll receive an email with a login link.
        </div>
      )}

      {actionData?.error && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-300">
          {actionData.error}
        </div>
      )}

      <form method="post" className="space-y-6">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-[var(--color-cream-200)] mb-2">
            Business Name
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            required
            placeholder="e.g. Living Skin Clinic"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-charcoal-700)] border border-[var(--color-charcoal-600)] text-[var(--color-cream-100)] placeholder-[var(--color-charcoal-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-cream-200)] mb-2">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="e.g. living-skin-clinic"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-charcoal-700)] border border-[var(--color-charcoal-600)] text-[var(--color-cream-100)] placeholder-[var(--color-charcoal-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--color-cream-200)] mb-2">
            Client Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="client@example.com"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-charcoal-700)] border border-[var(--color-charcoal-600)] text-[var(--color-cream-100)] placeholder-[var(--color-charcoal-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-charcoal-900)] font-semibold transition-colors"
        >
          Send Invitation
        </button>
      </form>
    </div>
  );
}
