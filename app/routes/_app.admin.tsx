import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/_app.admin";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw redirect("/dashboard");
  return {};
}

export default function AdminLayout() {
  return <Outlet />;
}
