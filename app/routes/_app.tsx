import { Outlet, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/_app";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export function shouldRevalidate({ formAction }: any) {
  if (formAction) return true;
  return false;
}

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
  return <Outlet />;
}
