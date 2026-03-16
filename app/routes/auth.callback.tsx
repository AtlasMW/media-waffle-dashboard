import { redirect } from "react-router";
import type { Route } from "./+types/auth.callback";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) return redirect("/login");

  const { supabase, headers } = createSupabaseServerClient(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const destination = profile?.role === "admin" ? "/admin" : "/dashboard";
  return redirect(destination, { headers });
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-charcoal-900)]">
      <p className="text-[var(--color-cream-200)]">Signing you in...</p>
    </div>
  );
}
