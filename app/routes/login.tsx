import { useState, useEffect } from "react";
import { data, redirect, useActionData, useNavigate, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/login";
import { createSupabaseServerClient } from "~/lib/supabase.server";
import { createBrowserClient } from "@supabase/ssr";

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
  const [hashStatus, setHashStatus] = useState<"idle" | "processing" | "error">("idle");
  const [hashError, setHashError] = useState<string | null>(null);
  const navigate = useNavigate();
  const rootData = useRouteLoaderData("root") as { env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string } } | undefined;

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !rootData?.env) return;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const error = params.get("error");
    const errorDesc = params.get("error_description");

    if (error) {
      setHashStatus("error");
      setHashError(errorDesc?.replace(/\+/g, " ") || error);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    if (accessToken) {
      setHashStatus("processing");
      const refreshToken = params.get("refresh_token") || "";
      const supabase = createBrowserClient(rootData.env.SUPABASE_URL, rootData.env.SUPABASE_ANON_KEY);
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: sessionError }) => {
        if (sessionError) {
          setHashStatus("error");
          setHashError(sessionError.message);
        } else {
          window.location.href = "/";
        }
      });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [rootData, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f0e8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <style>{`
          @font-face {
            font-family: 'TT Ramillas';
            src: url('/fonts/tt-ramillas-bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
            font-display: swap;
          }
        `}</style>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'TT Ramillas', Georgia, serif",
            fontWeight: 700,
            fontSize: '36px',
            color: '#3b3b3b',
            letterSpacing: '2px',
            lineHeight: 1.2,
            marginBottom: '12px',
          }}>
            Media Waffle
          </div>
          <p style={{
            fontSize: '13px',
            color: '#8a8478',
            letterSpacing: '1px',
            fontFamily: "'Montserrat', sans-serif",
          }}>
            Client Dashboard
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(59,59,59,0.08)',
        }}>
          {hashStatus === "processing" ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #ddd5c4',
                borderTopColor: '#3b3b3b',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ color: '#3b3b3b', fontSize: '15px' }}>Signing you in...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : hashStatus !== "processing" && (actionData?.success && actionData?.mode === "magic" || (submitted && mode === "magic")) ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#3b3b3b',
                marginBottom: '8px',
                fontFamily: "'Georgia', serif",
              }}>
                Check your email
              </h2>
              <p style={{ color: '#8a8478', fontSize: '14px', lineHeight: 1.6 }}>
                We've sent you a login link. Click it to access your dashboard.
              </p>
            </div>
          ) : (
            <form method="post" onSubmit={() => { if (mode === "magic") setSubmitted(true); }}>
              <input type="hidden" name="mode" value={mode} />

              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#3b3b3b',
                marginBottom: '24px',
                textAlign: 'center',
                fontFamily: "'Georgia', serif",
              }}>
                Sign In
              </h2>

              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#3b3b3b',
                marginBottom: '6px',
              }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #ddd5c4',
                  background: '#faf8f4',
                  color: '#3b3b3b',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              />

              {mode === "password" && (
                <>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#3b3b3b',
                    marginBottom: '6px',
                  }}>
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #ddd5c4',
                      background: '#faf8f4',
                      color: '#3b3b3b',
                      fontSize: '15px',
                      outline: 'none',
                      marginBottom: '16px',
                      boxSizing: 'border-box',
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  />
                </>
              )}

              {(hashError || actionData?.error) && (
                <p style={{
                  color: '#c44',
                  fontSize: '13px',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}>
                  {hashError || actionData?.error}
                </p>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#3b3b3b',
                  color: '#f5f0e8',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Montserrat', sans-serif",
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#555')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#3b3b3b')}
              >
                {mode === "password" ? "Sign In" : "Send Login Link"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#b0a89a',
          marginTop: '24px',
        }}>
          Powered by Media Waffle
        </p>
      </div>
    </div>
  );
}
