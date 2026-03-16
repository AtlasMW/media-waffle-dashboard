import { useState } from "react";
import { data, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return redirect("/");
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const mode = formData.get("mode") as string;

  if (!email) return data({ error: "Email is required", success: false, mode }, { status: 400 });

  const { supabase, headers } = createSupabaseServerClient(request);

  if (mode === "password") {
    if (!password) return data({ error: "Password is required", success: false, mode }, { status: 400 });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return data({ error: error.message, success: false, mode }, { status: 400, headers });
    return redirect("/", { headers });
  }

  // Magic link mode
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  });

  if (error) return data({ error: error.message, success: false, mode }, { status: 400, headers });
  return data({ error: null, success: true, mode }, { headers });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="login-page min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-cream-100)]">Media Waffle</h1>
          <p className="text-[var(--color-cream-200)] mt-2">Sign in to your dashboard</p>
        </div>

        <div className="bg-[var(--color-charcoal-800)] rounded-xl p-8 shadow-lg">
          {actionData?.success && actionData?.mode === "magic" || (submitted && mode === "magic") ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[var(--color-cream-100)] mb-2">
                Check your email
              </h2>
              <p className="text-[var(--color-cream-200)]">
                We&apos;ve sent you a magic link. Click it to sign in.
              </p>
            </div>
          ) : (
            <form method="post" onSubmit={() => { if (mode === "magic") setSubmitted(true); }}>
              <input type="hidden" name="mode" value={mode} />
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-cream-200)] mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-charcoal-700)] border border-[var(--color-charcoal-600)] text-[var(--color-cream-100)] placeholder-[var(--color-charcoal-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] mb-4"
              />
              {mode === "password" && (
                <>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[var(--color-cream-200)] mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-charcoal-700)] border border-[var(--color-charcoal-600)] text-[var(--color-cream-100)] placeholder-[var(--color-charcoal-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] mb-4"
                  />
                </>
              )}
              {actionData?.error && (
                <p className="text-red-400 text-sm mb-4">{actionData.error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-charcoal-900)] font-semibold transition-colors"
              >
                {mode === "password" ? "Sign In" : "Send Magic Link"}
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === "password" ? "magic" : "password")}
                className="w-full mt-3 text-sm text-[var(--color-cream-300)] hover:text-[var(--color-cream-100)] transition-colors"
              >
                {mode === "password" ? "Sign in with magic link instead" : "Sign in with password instead"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
