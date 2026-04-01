import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, redirect, useActionData, useNavigate, useRouteLoaderData, data, useFetcher, useLoaderData, Link, useLocation, NavLink, useOutletContext, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createServerClient, serializeCookieHeader, parseCookieHeader, createBrowserClient } from "@supabase/ssr";
import { useState, useEffect, useRef } from "react";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx("link", {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32.png"
      }), /* @__PURE__ */ jsx("link", {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/favicon.png"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {}), /* @__PURE__ */ jsx("script", {
        src: "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
      }), /* @__PURE__ */ jsx("script", {
        src: "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
      }), /* @__PURE__ */ jsx("script", {
        src: "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
      })]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
function loader$d() {
  return {
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    }
  };
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links,
  loader: loader$d
}, Symbol.toStringTag, { value: "Module" }));
function createSupabaseServerClient(request) {
  const headers = new Headers();
  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options)
            );
          });
        }
      }
    }
  );
  return { supabase, headers };
}
function createSupabaseServiceClient() {
  return createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
        }
      }
    }
  );
}
async function loader$c({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const {
    data: profile
  } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") return redirect("/admin");
  return redirect("/dashboard");
}
const home = UNSAFE_withComponentProps(function Home() {
  return null;
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  loader: loader$c
}, Symbol.toStringTag, { value: "Module" }));
async function loader$b({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (user) return redirect("/");
  return {};
}
async function action$d({
  request
}) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const mode = formData.get("mode");
  if (!email) return data({
    error: "Email is required",
    success: false,
    mode
  }, {
    status: 400
  });
  const {
    supabase,
    headers
  } = createSupabaseServerClient(request);
  if (mode === "password") {
    if (!password) return data({
      error: "Password is required",
      success: false,
      mode
    }, {
      status: 400
    });
    const {
      error: error2
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error2) return data({
      error: error2.message,
      success: false,
      mode
    }, {
      status: 400,
      headers
    });
    return redirect("/", {
      headers
    });
  }
  const {
    error
  } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`
    }
  });
  if (error) return data({
    error: error.message,
    success: false,
    mode
  }, {
    status: 400,
    headers
  });
  return data({
    error: null,
    success: true,
    mode
  }, {
    headers
  });
}
const login = UNSAFE_withComponentProps(function Login() {
  const actionData = useActionData();
  const [mode, setMode] = useState("password");
  const [submitted, setSubmitted] = useState(false);
  const [hashStatus, setHashStatus] = useState("idle");
  const [hashError, setHashError] = useState(null);
  const navigate = useNavigate();
  const rootData = useRouteLoaderData("root");
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
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({
        error: sessionError
      }) => {
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
  return /* @__PURE__ */ jsx("div", {
    style: {
      minHeight: "100vh",
      background: "#f5f0e8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Montserrat', sans-serif"
    },
    children: /* @__PURE__ */ jsxs("div", {
      style: {
        width: "100%",
        maxWidth: "420px"
      },
      children: [/* @__PURE__ */ jsx("style", {
        children: `
          @font-face {
            font-family: 'TT Ramillas';
            src: url('/fonts/tt-ramillas-bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
            font-display: swap;
          }
        `
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          textAlign: "center",
          marginBottom: "32px"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontFamily: "'TT Ramillas', Georgia, serif",
            fontWeight: 700,
            fontSize: "36px",
            color: "#3b3b3b",
            letterSpacing: "2px",
            lineHeight: 1.2,
            marginBottom: "6px"
          },
          children: "Media Waffle"
        }), /* @__PURE__ */ jsx("p", {
          style: {
            fontSize: "15px",
            color: "#8a8478",
            letterSpacing: "1px",
            fontFamily: "'Montserrat', sans-serif"
          },
          children: "Client Dashboard"
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          background: "#ffffff",
          borderRadius: "16px",
          padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(59,59,59,0.08)"
        },
        children: hashStatus === "processing" ? /* @__PURE__ */ jsxs("div", {
          style: {
            textAlign: "center"
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              width: "40px",
              height: "40px",
              border: "3px solid #ddd5c4",
              borderTopColor: "#3b3b3b",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px"
            }
          }), /* @__PURE__ */ jsx("p", {
            style: {
              color: "#3b3b3b",
              fontSize: "15px"
            },
            children: "Signing you in..."
          }), /* @__PURE__ */ jsx("style", {
            children: `@keyframes spin { to { transform: rotate(360deg); } }`
          })]
        }) : hashStatus !== "processing" && (actionData?.success && actionData?.mode === "magic" || submitted && mode === "magic") ? /* @__PURE__ */ jsxs("div", {
          style: {
            textAlign: "center"
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontSize: "40px",
              marginBottom: "12px"
            },
            children: "✉️"
          }), /* @__PURE__ */ jsx("h2", {
            style: {
              fontSize: "20px",
              fontWeight: 700,
              color: "#3b3b3b",
              marginBottom: "8px",
              fontFamily: "'Georgia', serif"
            },
            children: "Check your email"
          }), /* @__PURE__ */ jsx("p", {
            style: {
              color: "#8a8478",
              fontSize: "14px",
              lineHeight: 1.6
            },
            children: "We've sent you a login link. Click it to access your dashboard."
          })]
        }) : /* @__PURE__ */ jsxs("form", {
          method: "post",
          onSubmit: () => {
            if (mode === "magic") setSubmitted(true);
          },
          children: [/* @__PURE__ */ jsx("input", {
            type: "hidden",
            name: "mode",
            value: mode
          }), /* @__PURE__ */ jsx("h2", {
            style: {
              fontSize: "22px",
              fontWeight: 700,
              color: "#3b3b3b",
              marginBottom: "24px",
              textAlign: "left",
              fontFamily: "'Georgia', serif"
            },
            children: "Sign In"
          }), /* @__PURE__ */ jsx("label", {
            style: {
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#3b3b3b",
              marginBottom: "6px"
            },
            children: "Email"
          }), /* @__PURE__ */ jsx("input", {
            name: "email",
            type: "email",
            required: true,
            placeholder: "your@email.com",
            style: {
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid #ddd5c4",
              background: "#faf8f4",
              color: "#3b3b3b",
              fontSize: "15px",
              outline: "none",
              marginBottom: "16px",
              boxSizing: "border-box",
              fontFamily: "'Montserrat', sans-serif"
            }
          }), mode === "password" && /* @__PURE__ */ jsxs(Fragment, {
            children: [/* @__PURE__ */ jsx("label", {
              style: {
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#3b3b3b",
                marginBottom: "6px"
              },
              children: "Password"
            }), /* @__PURE__ */ jsx("input", {
              name: "password",
              type: "password",
              required: true,
              placeholder: "Enter your password",
              style: {
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #ddd5c4",
                background: "#faf8f4",
                color: "#3b3b3b",
                fontSize: "15px",
                outline: "none",
                marginBottom: "16px",
                boxSizing: "border-box",
                fontFamily: "'Montserrat', sans-serif"
              }
            })]
          }), (hashError || actionData?.error) && /* @__PURE__ */ jsx("p", {
            style: {
              color: "#c44",
              fontSize: "13px",
              marginBottom: "16px",
              textAlign: "center"
            },
            children: hashError || actionData?.error
          }), /* @__PURE__ */ jsx("button", {
            type: "submit",
            style: {
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              background: "#3b3b3b",
              color: "#f5f0e8",
              fontSize: "15px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif",
              transition: "background 0.2s"
            },
            onMouseOver: (e) => e.currentTarget.style.background = "#555",
            onMouseOut: (e) => e.currentTarget.style.background = "#3b3b3b",
            children: mode === "password" ? "Sign In" : "Send Login Link"
          }), /* @__PURE__ */ jsx("div", {
            style: {
              height: "16px"
            }
          })]
        })
      }), /* @__PURE__ */ jsx("p", {
        style: {
          textAlign: "center",
          fontSize: "12px",
          color: "#b0a89a",
          marginTop: "24px"
        },
        children: "Powered by Media Waffle"
      })]
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$d,
  default: login,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
async function loader$a({
  request
}) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return redirect("/login");
  const {
    supabase,
    headers
  } = createSupabaseServerClient(request);
  const {
    error
  } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirect("/login");
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const {
    data: profile
  } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const destination = profile?.role === "admin" ? "/admin" : "/dashboard";
  return redirect(destination, {
    headers
  });
}
const auth_callback = UNSAFE_withComponentProps(function AuthCallback() {
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center bg-[var(--color-charcoal-900)]",
    children: /* @__PURE__ */ jsx("p", {
      className: "text-[var(--color-cream-200)]",
      children: "Signing you in..."
    })
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: auth_callback,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
async function action$c({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return Response.json({
    error: "Not authenticated"
  }, {
    status: 401
  });
  const {
    data: profile
  } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return Response.json({
    error: "Not authorised"
  }, {
    status: 403
  });
  const formData = await request.formData();
  const email = formData.get("email");
  const clientSlug = formData.get("clientSlug");
  const displayName = formData.get("displayName");
  if (!email || !clientSlug || !displayName) {
    return Response.json({
      error: "Missing required fields"
    }, {
      status: 400
    });
  }
  const serviceClient = createSupabaseServiceClient();
  const origin = new URL(request.url).origin;
  const {
    data: existingUsers
  } = await serviceClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);
  if (!existingUser) {
    const tempPassword = crypto.randomUUID();
    const {
      data: newUser,
      error: createError
    } = await serviceClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName
      }
    });
    if (createError) return Response.json({
      error: createError.message
    }, {
      status: 500
    });
    if (newUser?.user) {
      await serviceClient.from("profiles").upsert({
        id: newUser.user.id,
        role: "client",
        display_name: displayName,
        client_slug: clientSlug
      });
    }
  } else {
    await serviceClient.from("profiles").upsert({
      id: existingUser.id,
      role: "client",
      display_name: displayName,
      client_slug: clientSlug
    });
  }
  const {
    data: linkData,
    error: linkError
  } = await serviceClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${origin}/auth/callback`
    }
  });
  if (linkError) return Response.json({
    error: linkError.message
  }, {
    status: 500
  });
  const actionLink = linkData?.properties?.action_link;
  if (!actionLink) return Response.json({
    error: "Failed to generate link"
  }, {
    status: 500
  });
  return Response.json({
    link: actionLink
  });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$c
}, Symbol.toStringTag, { value: "Module" }));
function shouldRevalidate$1({
  formAction
}) {
  if (formAction) return true;
  return false;
}
async function loader$9({
  request
}) {
  const {
    supabase,
    headers
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login", {
    headers
  });
  const {
    data: profile
  } = await supabase.from("profiles").select("role, display_name, client_slug").eq("id", user.id).single();
  return Response.json({
    user: {
      id: user.id,
      email: user.email
    },
    profile: profile ?? {
      role: "client",
      display_name: user.email,
      client_slug: null
    },
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    }
  }, {
    headers
  });
}
async function action$b({
  request
}) {
  const {
    supabase,
    headers
  } = createSupabaseServerClient(request);
  await supabase.auth.signOut();
  return redirect("/login", {
    headers
  });
}
const _app = UNSAFE_withComponentProps(function AppLayout() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$b,
  default: _app,
  loader: loader$9,
  shouldRevalidate: shouldRevalidate$1
}, Symbol.toStringTag, { value: "Module" }));
async function loader$8({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const {
    data: profile
  } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw redirect("/dashboard");
  return {};
}
const _app_admin = UNSAFE_withComponentProps(function AdminLayout() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _app_admin,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
async function loader$7({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const {
    data: profile
  } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return redirect("/dashboard");
  return null;
}
async function action$a({
  request
}) {
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "create_client_account") {
    const email = (form.get("email") || "").trim();
    const password = form.get("password") || "";
    const clientSlug = form.get("clientSlug") || "";
    if (!email || !password || !clientSlug) {
      return {
        error: "Email, password, and client are required"
      };
    }
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    const createRes = await fetch(`${SB_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SB_KEY}`,
        "apikey": SB_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true
      })
    });
    const userData = await createRes.json();
    if (!userData.id) {
      return {
        error: userData.msg || userData.message || "Failed to create account"
      };
    }
    await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${userData.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_KEY}`,
        "apikey": SB_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "client",
        client_slug: clientSlug
      })
    });
    const clientRes = await fetch(`${SB_URL}/rest/v1/msg_clients?slug=eq.${clientSlug}&select=id`, {
      headers: {
        "Authorization": `Bearer ${SB_KEY}`,
        "apikey": SB_KEY
      }
    });
    const clients = await clientRes.json();
    if (clients && clients.length > 0) {
      await fetch(`${SB_URL}/rest/v1/msg_client_users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SB_KEY}`,
          "apikey": SB_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: clients[0].id,
          user_id: userData.id,
          role: "owner"
        })
      });
    }
    const origin = new URL(request.url).origin;
    return {
      created: true,
      email,
      clientSlug,
      reportingLink: `${origin}/dashboard/${clientSlug}`,
      messagingLink: `${origin}/hub/${clientSlug}/brand`
    };
  }
  return {};
}
const CLIENTS = [{
  slug: "vernalys",
  name: "Vernalys Skin & Laser Clinic",
  status: "active",
  startDate: "2025-07",
  fee: 950,
  hasReporting: true,
  hasMessaging: false
}, {
  slug: "cronulla",
  name: "Cronulla Skin Sanctuary",
  status: "active",
  startDate: "2026-01",
  fee: 1500,
  hasReporting: true,
  hasMessaging: false
}, {
  slug: "eleve",
  name: "Élevé Cosmetics",
  status: "active",
  startDate: "2025-07",
  fee: 1e3,
  hasReporting: true,
  hasMessaging: false
}, {
  slug: "rejuvia",
  name: "Rejuvia Beauty & Aesthetics",
  status: "active",
  startDate: "2025-10",
  fee: 1500,
  hasReporting: true,
  hasMessaging: false
}, {
  slug: "hairplus",
  name: "The Hair Plus Clinic",
  status: "active",
  startDate: "2026-01",
  fee: 990,
  hasReporting: true,
  hasMessaging: false
}, {
  slug: "oceanelle",
  name: "Oceanelle Medispa",
  status: "active",
  startDate: "2026-03",
  fee: 990,
  hasReporting: true,
  hasMessaging: false
}, {
  slug: "livingskin",
  name: "Living Skin Clinic",
  status: "active",
  startDate: "2025-11",
  fee: 950,
  hasReporting: true,
  hasMessaging: false
}, {
  slug: "mbluxury",
  name: "MB Luxury Spa",
  status: "active",
  startDate: "2025-09",
  fee: 1e3,
  hasReporting: true,
  hasMessaging: true
}, {
  slug: "wildflower",
  name: "Wildflower Skin Clinic",
  status: "active",
  startDate: "2024-03",
  fee: 1200,
  hasReporting: true,
  hasMessaging: false
}];
function fmtC(v) {
  return "$" + Number(v).toLocaleString("en-AU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
function fmtCd(v) {
  return "$" + Number(v).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function getLastMonth(data2) {
  if (!data2 || !data2.meta || !data2.meta.monthly) return null;
  const months = Object.keys(data2.meta.monthly).sort();
  const now = /* @__PURE__ */ new Date();
  const currentKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const completed = months.filter((m) => m < currentKey);
  return completed.length ? completed[completed.length - 1] : months[months.length - 1];
}
function getMonthName(key) {
  const [, m] = key.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[parseInt(m) - 1] + " " + key.split("-")[0];
}
const _app_admin_index = UNSAFE_withComponentProps(function AdminHub() {
  const [allData, setAllData] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [setupSlug, setSetupSlug] = useState(null);
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const setupFetcher = useFetcher();
  const templateRef = useRef(null);
  useEffect(() => {
    Promise.all(CLIENTS.map((c) => Promise.all([fetch(`/data/${c.slug}/meta.json`).then((r) => r.ok ? r.json() : null), fetch(`/data/${c.slug}/leads.json`).then((r) => r.ok ? r.json() : null)]).then(([meta, leads]) => meta && leads ? {
      meta,
      leads
    } : null))).then(setAllData);
  }, []);
  function showToast(msg) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }
  function copyLink(slug, e) {
    e.stopPropagation();
    const url = window.location.origin + "/dashboard?client=" + slug;
    navigator.clipboard.writeText(url).then(() => showToast("Report link copied")).catch(() => showToast("Report link copied"));
  }
  function openDashboard(slug) {
    window.location.href = "/dashboard?client=" + slug;
  }
  const [setupKey, setSetupKey] = useState(0);
  function openSetupModal(slug) {
    const client = CLIENTS.find((c) => c.slug === slug);
    setSetupSlug(slug);
    setSetupName(client?.name || "");
    setSetupEmail("");
    setSetupPassword("");
    setSetupKey((k) => k + 1);
  }
  function copyToClipboard(text, label2) {
    navigator.clipboard.writeText(text).then(() => showToast(label2 + " copied")).catch(() => showToast(label2 + " copied"));
  }
  function copyTemplate() {
    if (templateRef.current) {
      navigator.clipboard.writeText(templateRef.current.value).then(() => showToast("Template copied to clipboard")).catch(() => {
        templateRef.current?.select();
        document.execCommand("copy");
        showToast("Template copied to clipboard");
      });
    }
  }
  const now = /* @__PURE__ */ new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateStr = now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear();
  let totalSpend = 0, totalLeads = 0, totalRevenue = 0;
  let latestMonth = null;
  CLIENTS.forEach((_, i) => {
    const data2 = allData[i];
    if (!data2) return;
    const lm = getLastMonth(data2);
    if (!lm) return;
    if (!latestMonth || lm > latestMonth) latestMonth = lm;
    const mm = data2.meta.monthly[lm];
    const lm2 = data2.leads.monthly[lm];
    if (mm) {
      totalSpend += mm.spend;
      totalLeads += mm.leads;
    }
    if (lm2) {
      totalRevenue += lm2.moneyCollected || 0;
    }
  });
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx("style", {
      dangerouslySetInnerHTML: {
        __html: `
:root {
  --bg: #f5f0e8;
  --card: #ffffff;
  --dark: #3b3b3b;
  --dark-light: #5a5a5a;
  --beige: #ddd5c4;
  --beige-light: #eee8dc;
  --accent: #c4a882;
  --green: #6ba378;
  --green-light: #e8f5eb;
  --coral: #c47a6c;
  --teal: #5b9ea6;
  --radius: 12px;
  --shadow: 0 1px 3px rgba(59,59,59,0.06), 0 1px 2px rgba(59,59,59,0.04);
  --shadow-hover: 0 8px 24px rgba(59,59,59,0.12);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Montserrat', sans-serif; background: var(--bg); color: var(--dark); min-height: 100vh; }
.header { background: var(--card); border-bottom: 1px solid var(--beige); padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; position: fixed; top: 0; left: 0; right: 0; z-index: 10; }
.header-left { display: flex; align-items: center; gap: 16px; }
.logo-text { font-weight: 700; font-size: 15px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dark); }
.logo-divider { width: 1px; height: 24px; background: var(--beige); }
.header-title { font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: var(--dark); }
.header-right { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--dark-light); }
.header-date { padding: 8px 16px; background: var(--beige-light); border-radius: 8px; font-weight: 500; }
.container { max-width: 1200px; margin: 0 auto; padding: 100px 24px 40px; }
.stats-bar { display: flex; gap: 16px; margin-bottom: 32px; }
.stat-card { flex: 1; background: var(--card); border-radius: var(--radius); padding: 20px 24px; box-shadow: var(--shadow); }
.stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--dark); }
.stat-sub { font-size: 12px; color: var(--dark-light); margin-top: 4px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.section-title { font-family: Georgia, serif; font-size: 18px; font-weight: 700; }
.section-count { font-size: 13px; color: #999; font-weight: 500; }
.client-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 1200px) { .client-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .client-grid { grid-template-columns: 1fr; } }
.client-tile { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; transition: all 0.25s ease; cursor: pointer; position: relative; }
.client-tile:hover { box-shadow: var(--shadow-hover); transform: translateY(-2px); }
.tile-accent { height: 4px; background: var(--dark); }
.tile-body { padding: 24px; }
.tile-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.tile-name { font-family: Georgia, serif; font-size: 17px; font-weight: 700; color: var(--dark); line-height: 1.3; }
.tile-status { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
.tile-status.active { background: var(--green-light); color: var(--green); }
.tile-status.paused { background: #fef3e5; color: var(--coral); }
.tile-metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.tile-metric-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #aaa; margin-bottom: 2px; }
.tile-metric-value { font-size: 16px; font-weight: 700; color: var(--dark); }
.tile-actions { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid var(--beige-light); flex-wrap: nowrap; }
.btn { white-space: nowrap; }
.btn { flex: 1; padding: 10px 16px; border-radius: 8px; font-family: inherit; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; text-align: center; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary { background: var(--dark); color: white; }
.btn-primary:hover { background: #2a2a2a; }
.btn-secondary { background: var(--beige-light); color: var(--dark); }
.btn-secondary:hover { background: var(--beige); }
.btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--dark); color: white; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.2); transition: transform 0.3s ease; z-index: 100; pointer-events: none; }
.toast.show { transform: translateX(-50%) translateY(0); }
.modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(59,59,59,0.5); z-index: 200; align-items: center; justify-content: center; padding: 24px; }
.modal-overlay.open { display: flex; }
.modal { background: var(--card); border-radius: var(--radius); box-shadow: 0 16px 48px rgba(0,0,0,0.2); width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--beige-light); }
.modal-body { padding: 24px; }
@media (max-width: 768px) {
  .header { padding: 20px 16px 16px; flex-direction: column; align-items: center; gap: 4px; position: fixed; top: 0; left: 0; right: 0; z-index: 10; }
  .container { padding: 130px 16px 24px; }
  .header-left { flex-direction: column; align-items: center; gap: 4px; }
  .logo-text { font-size: 18px; letter-spacing: 3px; }
  .logo-divider { display: none; }
  .header-title { font-size: 14px; font-weight: 600; color: var(--dark-light); }
  .header-right { width: auto; }
  .header-date { font-size: 11px; padding: 6px 12px; }
  .stats-bar { flex-wrap: wrap; }
  .stat-card { min-width: calc(50% - 8px); }
  .client-grid { grid-template-columns: 1fr; }
}
      `
      }
    }), /* @__PURE__ */ jsxs("div", {
      className: "header",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "header-left",
        children: [/* @__PURE__ */ jsx("div", {
          className: "logo-text",
          children: "MEDIA WAFFLE"
        }), /* @__PURE__ */ jsx("div", {
          className: "logo-divider"
        }), /* @__PURE__ */ jsx("div", {
          className: "header-title",
          children: "Client Hub"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "header-right",
        children: /* @__PURE__ */ jsx("div", {
          className: "header-date",
          children: dateStr
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "container",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "stats-bar",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "stat-card",
          children: [/* @__PURE__ */ jsx("div", {
            className: "stat-label",
            children: "Active Clients"
          }), /* @__PURE__ */ jsx("div", {
            className: "stat-value",
            children: CLIENTS.length
          }), /* @__PURE__ */ jsx("div", {
            className: "stat-sub",
            children: "Managed accounts"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "stat-card",
          children: [/* @__PURE__ */ jsx("div", {
            className: "stat-label",
            children: "Total Ad Spend"
          }), /* @__PURE__ */ jsx("div", {
            className: "stat-value",
            children: fmtC(totalSpend)
          }), /* @__PURE__ */ jsx("div", {
            className: "stat-sub",
            children: latestMonth ? getMonthName(latestMonth) : "--"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "stat-card",
          children: [/* @__PURE__ */ jsx("div", {
            className: "stat-label",
            children: "Total Leads"
          }), /* @__PURE__ */ jsx("div", {
            className: "stat-value",
            children: totalLeads
          }), /* @__PURE__ */ jsx("div", {
            className: "stat-sub",
            children: latestMonth ? getMonthName(latestMonth) : "--"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "stat-card",
          children: [/* @__PURE__ */ jsx("div", {
            className: "stat-label",
            children: "Total Revenue"
          }), /* @__PURE__ */ jsx("div", {
            className: "stat-value",
            children: fmtC(totalRevenue)
          }), /* @__PURE__ */ jsx("div", {
            className: "stat-sub",
            children: latestMonth ? getMonthName(latestMonth) : "--"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "section-header",
        children: [/* @__PURE__ */ jsx("div", {
          className: "section-title",
          children: "Active Clients"
        }), /* @__PURE__ */ jsxs("div", {
          className: "section-count",
          children: [CLIENTS.length, " clients"]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "client-grid",
        children: CLIENTS.map((c, i) => {
          const data2 = allData[i];
          const lm = data2 ? getLastMonth(data2) : null;
          const mm = lm && data2.meta.monthly[lm] ? data2.meta.monthly[lm] : null;
          const spend = mm ? fmtC(mm.spend) : "--";
          const leads = mm ? mm.leads : "--";
          const cpl = mm ? fmtCd(mm.cpl) : "--";
          const period = lm ? getMonthName(lm) : "--";
          return /* @__PURE__ */ jsxs("div", {
            className: "client-tile",
            onClick: () => c.hasReporting ? openDashboard(c.slug) : window.location.href = "/hub/" + c.slug + "/brand",
            children: [/* @__PURE__ */ jsx("div", {
              className: "tile-accent"
            }), /* @__PURE__ */ jsxs("div", {
              className: "tile-body",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "tile-header",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "tile-name",
                  children: c.name
                }), /* @__PURE__ */ jsx("div", {
                  className: `tile-status ${c.status}`,
                  children: c.status
                })]
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: "11px",
                  color: "#aaa",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px"
                },
                children: period
              }), /* @__PURE__ */ jsxs("div", {
                className: "tile-metrics",
                children: [/* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsx("div", {
                    className: "tile-metric-label",
                    children: "Ad Spend"
                  }), /* @__PURE__ */ jsx("div", {
                    className: "tile-metric-value",
                    children: spend
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsx("div", {
                    className: "tile-metric-label",
                    children: "Leads"
                  }), /* @__PURE__ */ jsx("div", {
                    className: "tile-metric-value",
                    children: leads
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsx("div", {
                    className: "tile-metric-label",
                    children: "CPL"
                  }), /* @__PURE__ */ jsx("div", {
                    className: "tile-metric-value",
                    children: cpl
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  paddingTop: "16px",
                  borderTop: "1px solid var(--beige-light)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                },
                children: [/* @__PURE__ */ jsxs("a", {
                  className: "btn btn-primary",
                  href: c.hasReporting ? "/dashboard/" + c.slug : "#",
                  onClick: (e) => {
                    e.stopPropagation();
                    if (!c.hasReporting) e.preventDefault();
                  },
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "10px 16px",
                    opacity: c.hasReporting ? 1 : 0.35,
                    cursor: c.hasReporting ? "pointer" : "default"
                  },
                  children: [/* @__PURE__ */ jsxs("svg", {
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    style: {
                      width: "14px",
                      height: "14px",
                      flexShrink: 0
                    },
                    children: [/* @__PURE__ */ jsx("path", {
                      d: "M12 20V10"
                    }), /* @__PURE__ */ jsx("path", {
                      d: "M18 20V4"
                    }), /* @__PURE__ */ jsx("path", {
                      d: "M6 20v-4"
                    })]
                  }), "Reporting"]
                }), /* @__PURE__ */ jsxs("a", {
                  className: "btn btn-primary",
                  href: c.hasMessaging ? "/hub/" + (c.slug === "mbluxury" ? "mb-luxury" : c.slug) + "/brand" : "#",
                  onClick: (e) => {
                    e.stopPropagation();
                    if (!c.hasMessaging) e.preventDefault();
                  },
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "10px 16px",
                    background: c.hasMessaging ? "#5b9ea6" : "#888",
                    opacity: c.hasMessaging ? 1 : 0.35,
                    cursor: c.hasMessaging ? "pointer" : "default"
                  },
                  children: [/* @__PURE__ */ jsx("svg", {
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    style: {
                      width: "14px",
                      height: "14px",
                      flexShrink: 0
                    },
                    children: /* @__PURE__ */ jsx("path", {
                      d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                    })
                  }), "AI Messaging"]
                }), /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    gap: "8px"
                  },
                  children: [/* @__PURE__ */ jsxs("button", {
                    className: "btn btn-secondary",
                    onClick: (e) => copyLink(c.slug, e),
                    style: {
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 16px"
                    },
                    children: [/* @__PURE__ */ jsxs("svg", {
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      style: {
                        width: "14px",
                        height: "14px",
                        flexShrink: 0
                      },
                      children: [/* @__PURE__ */ jsx("rect", {
                        x: "9",
                        y: "9",
                        width: "13",
                        height: "13",
                        rx: "2"
                      }), /* @__PURE__ */ jsx("path", {
                        d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                      })]
                    }), "Copy Link"]
                  }), /* @__PURE__ */ jsxs("button", {
                    className: "btn btn-secondary",
                    onClick: (e) => {
                      e.stopPropagation();
                      openSetupModal(c.slug);
                    },
                    style: {
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      background: "var(--green-light)",
                      color: "var(--green)"
                    },
                    children: [/* @__PURE__ */ jsxs("svg", {
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      style: {
                        width: "14px",
                        height: "14px",
                        flexShrink: 0
                      },
                      children: [/* @__PURE__ */ jsx("path", {
                        d: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                      }), /* @__PURE__ */ jsx("circle", {
                        cx: "8.5",
                        cy: "7",
                        r: "4"
                      }), /* @__PURE__ */ jsx("line", {
                        x1: "20",
                        y1: "8",
                        x2: "20",
                        y2: "14"
                      }), /* @__PURE__ */ jsx("line", {
                        x1: "23",
                        y1: "11",
                        x2: "17",
                        y2: "11"
                      })]
                    }), "Setup Access"]
                  })]
                })]
              })]
            })]
          }, c.slug);
        })
      }), /* @__PURE__ */ jsx("div", {
        style: {
          marginTop: "40px",
          textAlign: "center"
        },
        children: /* @__PURE__ */ jsxs("button", {
          className: "btn btn-secondary",
          onClick: () => setModalOpen(true),
          style: {
            padding: "14px 32px",
            fontSize: "14px",
            border: "2px dashed var(--beige)",
            background: "transparent",
            borderRadius: "var(--radius)",
            width: "100%",
            maxWidth: "340px"
          },
          children: [/* @__PURE__ */ jsxs("svg", {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            style: {
              width: "18px",
              height: "18px"
            },
            children: [/* @__PURE__ */ jsx("line", {
              x1: "12",
              y1: "5",
              x2: "12",
              y2: "19"
            }), /* @__PURE__ */ jsx("line", {
              x1: "5",
              y1: "12",
              x2: "19",
              y2: "12"
            })]
          }), "Add New Client"]
        })
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: `modal-overlay${modalOpen ? " open" : ""}`,
      onClick: (e) => {
        if (e.target === e.currentTarget) setModalOpen(false);
      },
      children: /* @__PURE__ */ jsxs("div", {
        className: "modal",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "modal-header",
          children: [/* @__PURE__ */ jsx("h2", {
            style: {
              fontFamily: "Georgia,serif",
              fontSize: "20px"
            },
            children: "New Client Dashboard Setup"
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setModalOpen(false),
            style: {
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px"
            },
            children: /* @__PURE__ */ jsxs("svg", {
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "var(--dark)",
              strokeWidth: "2",
              style: {
                width: "20px",
                height: "20px"
              },
              children: [/* @__PURE__ */ jsx("line", {
                x1: "18",
                y1: "6",
                x2: "6",
                y2: "18"
              }), /* @__PURE__ */ jsx("line", {
                x1: "6",
                y1: "6",
                x2: "18",
                y2: "18"
              })]
            })
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "modal-body",
          children: [/* @__PURE__ */ jsx("p", {
            style: {
              color: "var(--dark-light)",
              marginBottom: "20px",
              fontSize: "13px",
              lineHeight: "1.6"
            },
            children: "Copy the template below, fill in the details, and send it to Atlas to set up a new client dashboard."
          }), /* @__PURE__ */ jsx("textarea", {
            ref: templateRef,
            readOnly: true,
            style: {
              width: "100%",
              minHeight: "380px",
              padding: "16px",
              fontFamily: "'Montserrat',sans-serif",
              fontSize: "12px",
              lineHeight: "1.8",
              border: "1px solid var(--beige)",
              borderRadius: "8px",
              background: "var(--beige-light)",
              color: "var(--dark)",
              resize: "vertical"
            },
            defaultValue: `NEW CLIENT DASHBOARD REQUEST

Client name:
Dashboard slug (short lowercase identifier, e.g. "vernalys"):
Meta Ad Account ID (format: act_XXXXXXXXXX):
Google Sheet ID (the long string from the sheet URL):
Lead Data tab name (e.g. "Lead Data 2025" or "Lead Data 2026"):
First month of ad data (e.g. July 2025):
Ad account currency (AUD or USD):
Agency fee per month ($):
Fee start date (if different from first month):
Any fee changes over time (e.g. "$800 for first 3 months, then $1,000"):

OPTIONAL
Offer/campaign names:
GHL Location ID (if not already configured):
GHL API Key (if not already configured):
LTV per client ($):
Any notes:`
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: "10px",
              marginTop: "16px"
            },
            children: [/* @__PURE__ */ jsxs("button", {
              className: "btn btn-primary",
              onClick: copyTemplate,
              style: {
                flex: 1,
                padding: "12px"
              },
              children: [/* @__PURE__ */ jsxs("svg", {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                children: [/* @__PURE__ */ jsx("rect", {
                  x: "9",
                  y: "9",
                  width: "13",
                  height: "13",
                  rx: "2"
                }), /* @__PURE__ */ jsx("path", {
                  d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                })]
              }), "Copy Template"]
            }), /* @__PURE__ */ jsx("button", {
              className: "btn btn-secondary",
              onClick: () => setModalOpen(false),
              style: {
                flex: 1,
                padding: "12px"
              },
              children: "Close"
            })]
          })]
        })]
      })
    }), setupSlug && /* @__PURE__ */ jsx("div", {
      children: /* @__PURE__ */ jsx("div", {
        className: "modal-overlay open",
        onClick: (e) => {
          if (e.target === e.currentTarget) setSetupSlug(null);
        },
        children: /* @__PURE__ */ jsxs("div", {
          className: "modal",
          style: {
            maxWidth: "520px"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            className: "modal-header",
            children: [/* @__PURE__ */ jsx("h2", {
              style: {
                fontFamily: "'Montserrat',sans-serif",
                fontSize: "18px",
                fontWeight: 700
              },
              children: "Client Access Setup"
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => setSetupSlug(null),
              style: {
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px"
              },
              children: /* @__PURE__ */ jsxs("svg", {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "var(--dark)",
                strokeWidth: "2",
                style: {
                  width: "20px",
                  height: "20px"
                },
                children: [/* @__PURE__ */ jsx("line", {
                  x1: "18",
                  y1: "6",
                  x2: "6",
                  y2: "18"
                }), /* @__PURE__ */ jsx("line", {
                  x1: "6",
                  y1: "6",
                  x2: "18",
                  y2: "18"
                })]
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "modal-body",
            children: [/* @__PURE__ */ jsx("p", {
              style: {
                color: "var(--dark-light)",
                marginBottom: "20px",
                fontSize: "14px",
                fontWeight: 600
              },
              children: setupName
            }), setupFetcher.data?.created ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs("div", {
                style: {
                  background: "var(--green-light)",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "20px"
                },
                children: [/* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--green)",
                    marginBottom: "4px"
                  },
                  children: "Account created successfully"
                }), /* @__PURE__ */ jsxs("div", {
                  style: {
                    fontSize: "12px",
                    color: "var(--dark-light)"
                  },
                  children: ["Email: ", setupFetcher.data.email]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  marginBottom: "16px"
                },
                children: [/* @__PURE__ */ jsx("label", {
                  style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "6px"
                  },
                  children: "Reporting Dashboard Link"
                }), /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    gap: "8px",
                    alignItems: "center"
                  },
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      flex: 1,
                      background: "var(--beige-light)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "12px",
                      color: "var(--dark)",
                      wordBreak: "break-all"
                    },
                    children: setupFetcher.data.reportingLink
                  }), /* @__PURE__ */ jsx("button", {
                    className: "btn btn-secondary",
                    onClick: () => copyToClipboard(setupFetcher.data.reportingLink, "Reporting link"),
                    style: {
                      padding: "10px 14px",
                      flexShrink: 0
                    },
                    children: "Copy"
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  marginBottom: "20px"
                },
                children: [/* @__PURE__ */ jsx("label", {
                  style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "6px"
                  },
                  children: "AI Messaging Hub Link"
                }), /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    gap: "8px",
                    alignItems: "center"
                  },
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      flex: 1,
                      background: "var(--beige-light)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "12px",
                      color: "var(--dark)",
                      wordBreak: "break-all"
                    },
                    children: setupFetcher.data.messagingLink
                  }), /* @__PURE__ */ jsx("button", {
                    className: "btn btn-secondary",
                    onClick: () => copyToClipboard(setupFetcher.data.messagingLink, "Messaging link"),
                    style: {
                      padding: "10px 14px",
                      flexShrink: 0
                    },
                    children: "Copy"
                  })]
                })]
              }), /* @__PURE__ */ jsx("button", {
                className: "btn btn-secondary",
                onClick: () => setSetupSlug(null),
                style: {
                  width: "100%",
                  padding: "12px"
                },
                children: "Done"
              })]
            }) : /* @__PURE__ */ jsxs(setupFetcher.Form, {
              method: "post",
              children: [/* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "intent",
                value: "create_client_account"
              }), /* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "clientSlug",
                value: setupSlug
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  marginBottom: "14px"
                },
                children: [/* @__PURE__ */ jsx("label", {
                  style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "6px"
                  },
                  children: "Client Email"
                }), /* @__PURE__ */ jsx("input", {
                  type: "email",
                  name: "email",
                  value: setupEmail,
                  onChange: (e) => setSetupEmail(e.target.value),
                  placeholder: "client@example.com",
                  required: true,
                  style: {
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--beige)",
                    borderRadius: "8px",
                    fontFamily: "inherit",
                    fontSize: "14px",
                    color: "var(--dark)",
                    outline: "none"
                  }
                })]
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  marginBottom: "20px"
                },
                children: [/* @__PURE__ */ jsx("label", {
                  style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "6px"
                  },
                  children: "Password"
                }), /* @__PURE__ */ jsx("input", {
                  type: "text",
                  name: "password",
                  value: setupPassword,
                  onChange: (e) => setSetupPassword(e.target.value),
                  placeholder: "Set a password for the client",
                  required: true,
                  style: {
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--beige)",
                    borderRadius: "8px",
                    fontFamily: "inherit",
                    fontSize: "14px",
                    color: "var(--dark)",
                    outline: "none"
                  }
                }), /* @__PURE__ */ jsx("p", {
                  style: {
                    fontSize: "11px",
                    color: "#999",
                    marginTop: "6px"
                  },
                  children: "You set the password. Share it with the client along with their dashboard link."
                })]
              }), setupFetcher.data?.error && /* @__PURE__ */ jsx("div", {
                style: {
                  background: "#ffebee",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#c62828"
                },
                children: setupFetcher.data.error
              }), /* @__PURE__ */ jsx("button", {
                type: "submit",
                className: "btn btn-primary",
                disabled: setupFetcher.state === "submitting" || !setupEmail || !setupPassword,
                style: {
                  width: "100%",
                  padding: "12px",
                  opacity: setupFetcher.state === "submitting" || !setupEmail || !setupPassword ? 0.6 : 1
                },
                children: setupFetcher.state === "submitting" ? "Creating Account..." : "Create Account and Get Links"
              })]
            })]
          })]
        })
      })
    }, setupKey), /* @__PURE__ */ jsx("div", {
      className: `toast${toastVisible ? " show" : ""}`,
      children: toastMsg
    })]
  });
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$a,
  default: _app_admin_index,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function loader$6({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: clients
  } = await supabase.from("clients").select("*").order("name");
  return {
    clients: clients ?? []
  };
}
const _app_admin_clients = UNSAFE_withComponentProps(function AdminClients() {
  const {
    clients
  } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      className: "flex items-center justify-between mb-8",
      children: [/* @__PURE__ */ jsx("h2", {
        className: "text-2xl font-bold text-[var(--color-cream-100)]",
        children: "Clients"
      }), /* @__PURE__ */ jsx(Link, {
        to: "/admin/invite",
        className: "px-4 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-charcoal-900)] font-semibold transition-colors",
        children: "Add Client"
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "bg-[var(--color-charcoal-800)] rounded-xl border border-[var(--color-charcoal-600)] overflow-hidden",
      children: /* @__PURE__ */ jsxs("table", {
        className: "w-full",
        children: [/* @__PURE__ */ jsx("thead", {
          children: /* @__PURE__ */ jsxs("tr", {
            className: "border-b border-[var(--color-charcoal-600)]",
            children: [/* @__PURE__ */ jsx("th", {
              className: "text-left px-6 py-4 text-sm font-medium text-[var(--color-cream-200)]",
              children: "Name"
            }), /* @__PURE__ */ jsx("th", {
              className: "text-left px-6 py-4 text-sm font-medium text-[var(--color-cream-200)]",
              children: "Slug"
            }), /* @__PURE__ */ jsx("th", {
              className: "text-left px-6 py-4 text-sm font-medium text-[var(--color-cream-200)]",
              children: "Created"
            })]
          })
        }), /* @__PURE__ */ jsxs("tbody", {
          children: [clients.map((client) => /* @__PURE__ */ jsxs("tr", {
            className: "border-b border-[var(--color-charcoal-700)] last:border-0",
            children: [/* @__PURE__ */ jsx("td", {
              className: "px-6 py-4",
              children: /* @__PURE__ */ jsx(Link, {
                to: `/admin/clients/${client.slug}`,
                className: "text-[var(--color-accent)] hover:underline font-medium",
                children: client.name
              })
            }), /* @__PURE__ */ jsx("td", {
              className: "px-6 py-4 text-[var(--color-cream-200)]",
              children: client.slug
            }), /* @__PURE__ */ jsx("td", {
              className: "px-6 py-4 text-[var(--color-cream-200)] text-sm",
              children: new Date(client.created_at).toLocaleDateString("en-AU")
            })]
          }, client.id)), clients.length === 0 && /* @__PURE__ */ jsx("tr", {
            children: /* @__PURE__ */ jsx("td", {
              colSpan: 3,
              className: "px-6 py-8 text-center text-[var(--color-cream-200)]",
              children: "No clients yet."
            })
          })]
        })]
      })
    })]
  });
});
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _app_admin_clients,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
async function loader$5({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: client
  } = await supabase.from("clients").select("*").eq("slug", params.slug).single();
  if (!client) throw new Response("Client not found", {
    status: 404
  });
  return {
    client
  };
}
const _app_admin_clients_$slug = UNSAFE_withComponentProps(function ClientDashboard() {
  const {
    client
  } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsx("h2", {
      className: "text-2xl font-bold text-[var(--color-cream-100)] mb-2",
      children: client.name
    }), /* @__PURE__ */ jsxs("p", {
      className: "text-[var(--color-cream-200)] mb-8",
      children: ["/", client.slug]
    }), /* @__PURE__ */ jsxs("div", {
      className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
      children: [/* @__PURE__ */ jsx(StatCard, {
        title: "Ad Spend",
        value: "Coming soon"
      }), /* @__PURE__ */ jsx(StatCard, {
        title: "Leads",
        value: "Coming soon"
      }), /* @__PURE__ */ jsx(StatCard, {
        title: "Bookings",
        value: "Coming soon"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "mt-8 bg-[var(--color-charcoal-800)] rounded-xl border border-[var(--color-charcoal-600)] p-6",
      children: [/* @__PURE__ */ jsx("h3", {
        className: "text-lg font-semibold text-[var(--color-cream-100)] mb-4",
        children: "Client Details"
      }), /* @__PURE__ */ jsxs("dl", {
        className: "space-y-3",
        children: [/* @__PURE__ */ jsx(Detail, {
          label: "Google Sheet ID",
          value: client.google_sheet_id || "Not linked"
        }), /* @__PURE__ */ jsx(Detail, {
          label: "GHL Location ID",
          value: client.ghl_location_id || "Not linked"
        }), /* @__PURE__ */ jsx(Detail, {
          label: "Created",
          value: new Date(client.created_at).toLocaleDateString("en-AU")
        })]
      })]
    })]
  });
});
function StatCard({
  title,
  value
}) {
  return /* @__PURE__ */ jsxs("div", {
    className: "p-6 rounded-xl bg-[var(--color-charcoal-800)] border border-[var(--color-charcoal-600)]",
    children: [/* @__PURE__ */ jsx("p", {
      className: "text-sm text-[var(--color-cream-200)]",
      children: title
    }), /* @__PURE__ */ jsx("p", {
      className: "text-2xl font-bold text-[var(--color-cream-100)] mt-1",
      children: value
    })]
  });
}
function Detail({
  label: label2,
  value
}) {
  return /* @__PURE__ */ jsxs("div", {
    className: "flex justify-between",
    children: [/* @__PURE__ */ jsx("dt", {
      className: "text-[var(--color-cream-200)]",
      children: label2
    }), /* @__PURE__ */ jsx("dd", {
      className: "text-[var(--color-cream-100)]",
      children: value
    })]
  });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _app_admin_clients_$slug,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function action$9({
  request
}) {
  const formData = await request.formData();
  const email = formData.get("email");
  const clientName = formData.get("clientName");
  const slug = formData.get("slug");
  if (!email || !clientName || !slug) {
    return data({
      error: "All fields are required.",
      success: false
    }, {
      status: 400
    });
  }
  const supabase = createSupabaseServiceClient();
  const {
    error: clientError
  } = await supabase.from("clients").insert({
    name: clientName,
    slug
  });
  if (clientError) {
    return data({
      error: `Failed to create client: ${clientError.message}`,
      success: false
    }, {
      status: 400
    });
  }
  const {
    data: inviteData,
    error: inviteError
  } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      display_name: clientName
    }
  });
  if (inviteError) {
    return data({
      error: `Failed to invite user: ${inviteError.message}`,
      success: false
    }, {
      status: 400
    });
  }
  if (inviteData.user) {
    await supabase.from("profiles").update({
      client_slug: slug,
      display_name: clientName
    }).eq("id", inviteData.user.id);
  }
  return data({
    error: null,
    success: true
  });
}
const _app_admin_invite = UNSAFE_withComponentProps(function InviteClient() {
  const actionData = useActionData();
  return /* @__PURE__ */ jsxs("div", {
    className: "max-w-lg",
    children: [/* @__PURE__ */ jsx("h2", {
      className: "text-2xl font-bold text-[var(--color-cream-100)] mb-8",
      children: "Invite Client"
    }), actionData?.success && /* @__PURE__ */ jsx("div", {
      className: "mb-6 p-4 rounded-lg bg-green-900/30 border border-green-700 text-green-300",
      children: "Client invited successfully. They'll receive an email with a login link."
    }), actionData?.error && /* @__PURE__ */ jsx("div", {
      className: "mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-300",
      children: actionData.error
    }), /* @__PURE__ */ jsxs("form", {
      method: "post",
      className: "space-y-6",
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("label", {
          htmlFor: "clientName",
          className: "block text-sm font-medium text-[var(--color-cream-200)] mb-2",
          children: "Business Name"
        }), /* @__PURE__ */ jsx("input", {
          id: "clientName",
          name: "clientName",
          type: "text",
          required: true,
          placeholder: "e.g. Living Skin Clinic",
          className: "w-full px-4 py-3 rounded-lg bg-[var(--color-charcoal-700)] border border-[var(--color-charcoal-600)] text-[var(--color-cream-100)] placeholder-[var(--color-charcoal-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("label", {
          htmlFor: "slug",
          className: "block text-sm font-medium text-[var(--color-cream-200)] mb-2",
          children: "Slug"
        }), /* @__PURE__ */ jsx("input", {
          id: "slug",
          name: "slug",
          type: "text",
          required: true,
          placeholder: "e.g. living-skin-clinic",
          className: "w-full px-4 py-3 rounded-lg bg-[var(--color-charcoal-700)] border border-[var(--color-charcoal-600)] text-[var(--color-cream-100)] placeholder-[var(--color-charcoal-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("label", {
          htmlFor: "email",
          className: "block text-sm font-medium text-[var(--color-cream-200)] mb-2",
          children: "Client Email"
        }), /* @__PURE__ */ jsx("input", {
          id: "email",
          name: "email",
          type: "email",
          required: true,
          placeholder: "client@example.com",
          className: "w-full px-4 py-3 rounded-lg bg-[var(--color-charcoal-700)] border border-[var(--color-charcoal-600)] text-[var(--color-cream-100)] placeholder-[var(--color-charcoal-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        })]
      }), /* @__PURE__ */ jsx("button", {
        type: "submit",
        className: "w-full py-3 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-charcoal-900)] font-semibold transition-colors",
        children: "Send Invitation"
      })]
    })]
  });
});
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9,
  default: _app_admin_invite
}, Symbol.toStringTag, { value: "Module" }));
async function loader$4({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());
  const {
    data: profile
  } = await supabase.from("profiles").select("role, client_slug").eq("id", user.id).single();
  if (profile?.role === "admin") return {
    allowed: true,
    slug: params.slug || profile?.client_slug
  };
  const requestedSlug = params.slug || new URL(request.url).searchParams.get("client");
  if (requestedSlug && profile?.client_slug && requestedSlug !== profile.client_slug) {
    return Response.redirect(new URL(`/dashboard/${profile.client_slug}`, request.url).toString());
  }
  return {
    allowed: true,
    slug: profile?.client_slug || requestedSlug
  };
}
const CSS = `
:root {
  --bg: #f5f0e8; --card: #ffffff; --dark: #3b3b3b; --dark-light: #5a5a5a;
  --beige: #ddd5c4; --beige-light: #eee8dc; --accent: #c4a882; --accent-light: #e8d5b8;
  --teal: #5b9ea6; --teal-light: #e8f4f5; --coral: #c47a6c; --coral-light: #f5e8e5;
  --green: #6ba378; --green-light: #e8f5eb; --fb-blue: #1877F2; --ig-purple: #ba1fe4;
  --sidebar-w: 240px; --radius: 12px;
  --shadow: 0 1px 3px rgba(59,59,59,0.06), 0 1px 2px rgba(59,59,59,0.04);
  --shadow-hover: 0 4px 12px rgba(59,59,59,0.1);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Montserrat', sans-serif; background: var(--bg); color: var(--dark); min-height: 100vh; display: flex; }
.sidebar { width: var(--sidebar-w); background: var(--card); border-right: 1px solid var(--beige); position: fixed; top: 0; left: 0; bottom: 0; display: flex; flex-direction: column; z-index: 40; }
.sidebar-logo { padding: 24px 24px 20px; border-bottom: 1px solid var(--beige); }
.logo-text { font-weight: 700; font-size: 15px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dark); }
.logo-sub { font-size: 10px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); margin-top: 4px; }
.sidebar-nav { padding: 16px 12px; flex: 1; }
.nav-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #aaa; padding: 12px 12px 6px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--dark-light); cursor: pointer; transition: all 0.2s; margin-bottom: 2px; }
.nav-item:hover { background: var(--beige-light); color: var(--dark); }
.nav-item.active { background: var(--dark); color: white; }
.nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
.nav-item.active svg path, .nav-item.active svg rect, .nav-item.active svg circle, .nav-item.active svg polyline, .nav-item.active svg line { stroke: white; }
.sidebar-footer { padding: 16px 12px; border-top: 1px solid var(--beige); }
.sidebar-client { font-size: 11px; color: #999; font-weight: 500; }
.sidebar-updated { font-size: 10px; color: #bbb; margin-top: 4px; }
.main { margin-left: var(--sidebar-w); flex: 1; min-height: 100vh; }
.topbar { padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; background: var(--card); border-bottom: 1px solid var(--beige); position: sticky; top: 0; z-index: 30; }
.topbar-left h1 { font-family: Georgia, serif; font-size: 22px; font-weight: 700; }
.topbar-left p { font-size: 13px; color: #999; margin-top: 2px; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.date-selector { display: flex; align-items: center; background: var(--beige-light); border-radius: 8px; overflow: visible; position: relative; }
.date-btn { padding: 8px 16px; font-family: inherit; font-size: 12px; font-weight: 600; border: none; background: none; color: var(--dark-light); cursor: pointer; transition: all 0.2s; }
.date-btn.active { background: var(--dark); color: white; }
.date-btn:hover:not(.active) { background: var(--beige); }
.custom-range-wrap { position: relative; }
.custom-range-popup { display: none; position: absolute; top: calc(100% + 8px); right: 0; background: var(--card); border-radius: 10px; box-shadow: var(--shadow-hover); padding: 16px; z-index: 100; min-width: 260px; }
.custom-range-popup.open { display: block; }
.custom-range-popup label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
.custom-range-popup input[type="date"] { width: 100%; padding: 8px 10px; border: 1px solid var(--beige); border-radius: 6px; font-family: 'Montserrat', sans-serif; font-size: 13px; color: var(--dark); margin-bottom: 12px; outline: none; cursor: pointer; }
.custom-range-popup input[type="date"]:focus { border-color: var(--accent); }
.custom-range-popup .apply-btn { width: 100%; padding: 8px; background: var(--dark); color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.custom-range-popup .apply-btn:hover { opacity: 0.85; }
.month-selector { display: flex; align-items: center; gap: 4px; }
.month-selector select { padding: 8px 12px; border: 1px solid var(--beige); border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--dark); background: var(--card); cursor: pointer; outline: none; }
.month-nav-btn { width: 32px; height: 32px; border: 1px solid var(--beige); border-radius: 6px; background: var(--card); color: var(--dark); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.2s; }
.month-nav-btn:hover { background: var(--beige-light); border-color: var(--dark); }
.month-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.month-nav-btn:disabled:hover { background: var(--card); border-color: var(--beige); }
.export-btn { padding: 8px 16px; border: 1px solid var(--beige); border-radius: 8px; font-family: inherit; font-size: 12px; font-weight: 600; color: var(--dark); background: var(--card); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
.export-btn:hover { border-color: var(--dark); background: var(--beige-light); }
.content { padding: 24px 32px 48px; }
.kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: var(--card); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); transition: box-shadow 0.2s; }
.kpi-card:hover { box-shadow: var(--shadow-hover); }
.kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 14px; font-weight: 700; }
.kpi-icon.spend { background: var(--accent-light); color: var(--accent); }
.kpi-icon.leads { background: #e8e6e3; color: var(--dark); }
.kpi-icon.responded { background: var(--teal-light); color: var(--teal); }
.kpi-icon.booked { background: #f0eaff; color: #7c6fbd; }
.kpi-icon.revenue { background: #e8f5eb; color: #6ba378; }
.kpi-icon.cpl { background: var(--green-light); color: var(--green); }
.kpi-icon.ctr { background: var(--coral-light); color: var(--coral); }
.kpi-icon.impressions { background: #f0eaff; color: #7c6fbd; }
.kpi-icon.msg { background: #e8f0ff; color: var(--fb-blue); }
.kpi-icon.conv { background: #fce8ff; color: var(--ig-purple); }
.kpi-label { font-size: 11px; font-weight: 600; color: #999; letter-spacing: 0.5px; text-transform: uppercase; }
.kpi-value { font-size: 24px; font-weight: 700; margin-top: 4px; color: var(--dark); }
.kpi-trend { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; margin-top: 6px; padding: 2px 8px; border-radius: 4px; }
.kpi-trend.up { color: var(--green); background: var(--green-light); }
.kpi-trend.down { color: var(--coral); background: var(--coral-light); }
.kpi-trend.neutral { color: #999; background: var(--beige-light); }
.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.chart-row.triple { grid-template-columns: 1fr 1fr 1fr; }
.chart-row.full { grid-template-columns: 1fr; }
.chart-card { background: var(--card); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); }
.chart-card h3 { font-family: Georgia, serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.chart-card .chart-sub { font-size: 12px; color: #999; margin-bottom: 16px; }
.chart-container { position: relative; height: 280px; }
.chart-container.short { height: 220px; }
.ad-table { width: 100%; border-collapse: collapse; }
.ad-table th { text-align: left; font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; border-bottom: 1px solid var(--beige); }
.ad-table td { padding: 14px 12px; border-bottom: 1px solid var(--beige-light); font-size: 13px; vertical-align: middle; }
.ad-table tr:last-child td { border-bottom: none; }
.ad-table tr:hover { background: var(--beige-light); }
.ad-rank { width: 28px; height: 28px; border-radius: 6px; background: var(--beige-light); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
.ad-rank.top { background: var(--accent-light); color: var(--accent); }
.ad-name { font-weight: 600; font-size: 13px; }
.ad-adset { font-size: 11px; color: #999; margin-top: 2px; }
.ad-metric { font-weight: 600; }
.ad-metric.best { color: var(--green); }
.lead-table { width: 100%; border-collapse: collapse; }
.lead-table th { text-align: left; font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; border-bottom: 1px solid var(--beige); }
.lead-table td { padding: 12px; border-bottom: 1px solid var(--beige-light); font-size: 13px; }
.lead-table tr:hover { background: var(--beige-light); }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.status-badge.confirmed, .status-badge.appointmentsuccessful { background: var(--green-light); color: var(--green); }
.status-badge.noshow { background: var(--coral-light); color: var(--coral); }
.status-badge.cancelled { background: #ffeaea; color: #c0392b; }
.status-badge.followup, .status-badge.infollowup { background: var(--accent-light); color: var(--accent); }
.status-badge.nocontact { background: var(--beige-light); color: #999; }
.status-badge.yes { background: var(--green-light); color: var(--green); }
.status-badge.appointmentbooked { background: var(--teal-light); color: var(--teal); }
.tab-content { display: none; }
.tab-content.active { display: block; }
.offer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.offer-card { background: var(--beige-light); border-radius: 10px; padding: 20px; }
.offer-card h4 { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
.offer-stat { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
.offer-stat .label { color: #999; font-weight: 500; }
.offer-stat .value { font-weight: 700; }
.range-label { font-size: 12px; color: #999; font-weight: 500; margin-bottom: 4px; text-align: center; }
.mobile-tabs { display: none; background: var(--card); border-bottom: 1px solid var(--beige); padding: 8px 12px; gap: 4px; position: sticky; top: 0; z-index: 35; }
.mobile-tab { flex: 1; padding: 10px 8px; border: none; background: var(--beige-light); border-radius: 8px; font-family: inherit; font-size: 12px; font-weight: 600; color: var(--dark-light); cursor: pointer; transition: all 0.2s; }
.mobile-tab.active { background: var(--dark); color: white; }
@media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 1400px) and (min-width: 1201px) { .kpi-grid { grid-template-columns: repeat(5, 1fr); } }
@media (max-width: 900px) {
  .sidebar { display: none; }
  .main { margin-left: 0; }
  .mobile-tabs { display: flex; }
  .topbar { position: static; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-row, .chart-row.triple { grid-template-columns: 1fr; }
  .content { padding: 16px; }
  .topbar { padding: 16px; flex-direction: column; align-items: stretch; gap: 12px; }
  .topbar-left { text-align: center; }
  .topbar-left h1 { font-size: 18px; }
  .topbar-right { flex-wrap: wrap; justify-content: center; gap: 8px; }
  .month-selector { justify-content: center; }
  .date-selector { justify-content: center; }
  .export-btn { justify-content: center; width: 100%; }
  .ad-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .lead-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .offer-grid { grid-template-columns: 1fr; }
  .custom-range-popup { right: auto; left: 50%; transform: translateX(-50%); }
}
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .kpi-card { padding: 14px; }
  .kpi-value { font-size: 18px; }
  .kpi-label { font-size: 10px; }
  .kpi-icon { width: 28px; height: 28px; font-size: 11px; margin-bottom: 8px; }
  .content { padding: 10px; }
  .topbar { padding: 12px; }
  .topbar-left h1 { font-size: 16px; }
  .topbar-left p { font-size: 11px; }
  .chart-card { padding: 14px; }
  .chart-card h3 { font-size: 13px; }
  .chart-card .chart-sub { font-size: 11px; margin-bottom: 10px; }
  .chart-container { height: 200px; }
  .chart-container.short { height: 170px; }
  .chart-row { gap: 10px; margin-bottom: 10px; }
  .date-btn { padding: 6px 10px; font-size: 11px; }
  .month-selector select { font-size: 12px; padding: 6px 8px; }
  .month-nav-btn { width: 28px; height: 28px; font-size: 12px; }
  .ad-table, .ad-table thead, .ad-table tbody, .ad-table th, .ad-table td, .ad-table tr { display: block; }
  .ad-table thead { display: none; }
  .ad-table tr { background: var(--card); border: 1px solid var(--beige-light); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .ad-table td { padding: 4px 0; border: none; font-size: 12px; display: flex; justify-content: space-between; }
  .ad-table td:before { font-weight: 600; color: #999; font-size: 11px; text-transform: uppercase; }
  .ad-rank { display: inline-flex; }
  .ad-name { font-size: 12px; }
  .ad-adset { font-size: 10px; }
  .lead-table, .lead-table thead, .lead-table tbody, .lead-table th, .lead-table td, .lead-table tr { display: block; }
  .lead-table thead { display: none; }
  .lead-table tr { background: var(--card); border: 1px solid var(--beige-light); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .lead-table td { padding: 3px 0; border: none; font-size: 12px; }
  .offer-grid { gap: 10px; }
  .offer-card { padding: 14px; }
  .offer-card h4 { font-size: 13px; margin-bottom: 8px; }
  .offer-stat { font-size: 12px; padding: 4px 0; }
  .period-summary-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
  .period-summary-grid div div:last-child { font-size: 22px !important; }
}
`;
const DASHBOARD_SCRIPT = `
(function() {
let metaData=null, leadsData=null, currentTab='overview', currentMonth=null, currentRange='monthly', charts={}, customStart=null, customEnd=null;
const C = { dark:'#3b3b3b', accent:'#c4a882', teal:'#5b9ea6', coral:'#c47a6c', green:'#6ba378', purple:'#7c6fbd', beige:'#ddd5c4', beigeLight:'#eee8dc', fbBlue:'#1877F2', igPurple:'#ba1fe4' };
Chart.defaults.font.family = "'Montserrat', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = '#999';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
Chart.defaults.plugins.legend.labels.padding = 16;

window._dashboardSwitchTab = function(tab, el) { switchTab(tab, el); };
window._dashboardSetMobileTab = function(el) { setMobileTab(el); };
window._dashboardNavMonth = function(dir) { navMonth(dir); };
window._dashboardChangeMonth = function() { changeMonth(); };
window._dashboardSetRange = function(r, el) { setRange(r, el); };
window._dashboardToggleCustomRange = function(el) { toggleCustomRange(el); };
window._dashboardApplyCustomRange = function() { applyCustomRange(); };
window._dashboardExportPDF = function() { exportPDF(); };

async function loadData() {
  var client = new URLSearchParams(window.location.search).get('client');
  if (!client) client = window.__CLIENT_SLUG__ || null;
  if (!client) { window.location.href = '/admin'; return; }
  const [mr, lr] = await Promise.all([fetch('/data/' + client + '/meta.json'), fetch('/data/' + client + '/leads.json')]);
  metaData = await mr.json(); leadsData = await lr.json();
  document.getElementById('client-name').textContent = metaData.client;
  document.getElementById('sidebar-client').textContent = metaData.client;
  document.getElementById('sidebar-updated').textContent = 'Last updated: ' + fmtDate(metaData.lastUpdated.slice(0,10));
  populateMonths(); render();
}

function populateMonths() {
  const sel = document.getElementById('month-selector');
  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0,7);
  const months = Object.keys(metaData.monthly).filter(function(m){ return m < currentMonthKey; }).sort().reverse();
  sel.innerHTML = months.map(function(m) { var p=m.split('-').map(Number); var d=new Date(p[0],p[1]-1,1); return '<option value="'+m+'">'+d.toLocaleDateString('en-AU',{month:'long',year:'numeric'})+'</option>'; }).join('');
  currentMonth = months[0] || Object.keys(metaData.monthly).sort().reverse()[0];
  updateMonthNav();
}

function changeMonth() { currentMonth = document.getElementById('month-selector').value; updateMonthNav(); render(); }
function navMonth(dir) {
  var sel = document.getElementById('month-selector');
  var opts = Array.from(sel.options).map(function(o){return o.value;});
  var idx = opts.indexOf(sel.value);
  var newIdx = idx - dir;
  if (newIdx >= 0 && newIdx < opts.length) { sel.value = opts[newIdx]; changeMonth(); }
}
function updateMonthNav() {
  var sel = document.getElementById('month-selector');
  var opts = Array.from(sel.options).map(function(o){return o.value;});
  var idx = opts.indexOf(sel.value);
  document.getElementById('month-prev').disabled = (idx >= opts.length - 1);
  document.getElementById('month-next').disabled = (idx <= 0);
}
function setRange(r, el) {
  currentRange=r;
  document.querySelectorAll('.date-btn').forEach(function(b){b.classList.remove('active');});
  el.classList.add('active');
  document.getElementById('month-selector-wrap').style.display = r==='monthly' ? 'flex' : 'none';
  if (r !== 'custom') document.getElementById('custom-range-popup').classList.remove('open');
  render();
}
function toggleCustomRange(el) {
  var popup = document.getElementById('custom-range-popup');
  var isOpen = popup.classList.contains('open');
  if (isOpen) { popup.classList.remove('open'); return; }
  var daily = metaData ? metaData.daily || [] : [];
  var ceiling = getDataCeiling();
  if (daily.length && ceiling && !document.getElementById('custom-start').value) {
    var s = parseLocalDate(ceiling); s.setDate(s.getDate()-29);
    document.getElementById('custom-start').value = s.toISOString().slice(0,10);
    document.getElementById('custom-end').value = ceiling;
    document.getElementById('custom-start').max = ceiling;
    document.getElementById('custom-end').max = ceiling;
    document.getElementById('custom-start').min = daily[0].date;
    document.getElementById('custom-end').min = daily[0].date;
  }
  popup.classList.add('open');
}
function applyCustomRange() {
  var s = document.getElementById('custom-start').value;
  var e = document.getElementById('custom-end').value;
  if (!s || !e) return;
  if (s > e) { alert('Start date must be before end date'); return; }
  customStart = s; customEnd = e;
  currentRange = 'custom';
  document.querySelectorAll('.date-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('custom-range-btn').classList.add('active');
  document.getElementById('month-selector-wrap').style.display = 'none';
  document.getElementById('custom-range-popup').classList.remove('open');
  render();
}
function switchTab(tab, el) { currentTab=tab; document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');}); document.querySelectorAll('.tab-content').forEach(function(t){t.classList.remove('active');}); if(el)el.classList.add('active'); document.getElementById('tab-'+tab).classList.add('active'); render(); }
function setMobileTab(el) { document.querySelectorAll('.mobile-tab').forEach(function(t){t.classList.remove('active');}); el.classList.add('active'); }

function fmtC(n) { return '$'+n.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtCw(n) { return '$'+Math.round(n).toLocaleString('en-AU'); }
function fmtP(n) { return n.toFixed(2)+'%'; }
function getMonthLabel(mk) { var p=mk.split('-').map(Number); return new Date(p[0],p[1]-1,1).toLocaleDateString('en-AU',{month:'long',year:'numeric'}); }
function fmtPw(n) { return Math.round(n)+'%'; }
function fmtN(n) { if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return (n/1000).toFixed(1)+'K'; return n.toString(); }
function parseLocalDate(s) { if(!s) return new Date(NaN); if(s.indexOf('-')>-1){ var p=s.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]||1); } var d=new Date(s); if(!isNaN(d.getTime())) return d; return new Date(NaN); }
function toISO(s) { var d=parseLocalDate(s); if(isNaN(d.getTime())) return ''; return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function fmtDate(d) { if(!d) return '--'; if(typeof d==='string') d=parseLocalDate(d); if(isNaN(d.getTime())) return '--'; var dd=String(d.getDate()).padStart(2,'0'); var mm=String(d.getMonth()+1).padStart(2,'0'); return dd+'/'+mm+'/'+d.getFullYear(); }
function fmtDateLong(d) { if(!d) return '--'; if(typeof d==='string') d=parseLocalDate(d); if(isNaN(d.getTime())) return '--'; var months=['January','February','March','April','May','June','July','August','September','October','November','December']; return d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear(); }
function fmtDateShort(d) { if(typeof d==='string') d=parseLocalDate(d); var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return d.getDate()+' '+months[d.getMonth()]; }
function fmtBucketLabel(startDate, endDate) { var s=typeof startDate==='string'?parseLocalDate(startDate):startDate; var e=typeof endDate==='string'?parseLocalDate(endDate):endDate; var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; if(s.getMonth()===e.getMonth()) return s.getDate()+'-'+e.getDate()+' '+months[s.getMonth()]; return s.getDate()+' '+months[s.getMonth()]+' - '+e.getDate()+' '+months[e.getMonth()]; }
function prevMonth(m) { var p = m.split('-').map(Number); var d=new Date(p[0], p[1]-2, 1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

function trend(cur,prev,invert) {
  if(!prev&&prev!==0) return '<span class="kpi-trend neutral">--</span>';
  var ch=((cur-prev)/Math.abs(prev||1)*100).toFixed(1);
  var dir=ch>0?'up':ch<0?'down':'neutral';
  if(invert) dir=ch>0?'down':ch<0?'up':'neutral';
  var ar=ch>0?'&#8599;':ch<0?'&#8600;':'&#8594;';
  return '<span class="kpi-trend '+dir+'">'+ar+' '+Math.abs(ch)+'%</span>';
}

function kpi(icon,label,value,trendHtml) {
  return '<div class="kpi-card"><div class="kpi-icon '+icon+'"></div><div class="kpi-label">'+label+'</div><div class="kpi-value">'+value+'</div>'+(trendHtml||'')+'</div>';
}

function destroyCharts() { Object.values(charts).forEach(function(c){c.destroy();}); charts={}; }

function getLastCompletedMonthEnd() {
  var now = new Date();
  var endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  return endOfLastMonth.getFullYear()+'-'+String(endOfLastMonth.getMonth()+1).padStart(2,'0')+'-'+String(endOfLastMonth.getDate()).padStart(2,'0');
}

function getDataCeiling() {
  var daily = metaData.daily || [];
  if (!daily.length) return null;
  var lastCompleted = getLastCompletedMonthEnd();
  var latestData = daily[daily.length - 1].date;
  return lastCompleted < latestData ? lastCompleted : latestData;
}

function getDateRange(range) {
  var daily = metaData.daily || [];
  if (!daily.length) return null;
  var ceiling = getDataCeiling();
  if (!ceiling) return null;
  if (range === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd, label: fmtDate(customStart)+' - '+fmtDate(customEnd) };
  }
  var end = parseLocalDate(ceiling);
  var start;
  if (range === '7d') { start = new Date(end); start.setDate(start.getDate() - 6); }
  else if (range === '14d') { start = new Date(end); start.setDate(start.getDate() - 13); }
  else if (range === '90d') { start = new Date(end); start.setDate(start.getDate() - 89); }
  else { start = new Date(end); start.setDate(start.getDate() - 29); }
  var startStr = start.getFullYear()+'-'+String(start.getMonth()+1).padStart(2,'0')+'-'+String(start.getDate()).padStart(2,'0');
  return { start: startStr, end: ceiling, label: fmtDate(start)+' - '+fmtDate(end) };
}

function getDailyInRange(range) {
  var dr = getDateRange(range);
  if (!dr || !metaData.daily) return [];
  return metaData.daily.filter(function(d){ return d.date >= dr.start && d.date <= dr.end; });
}

function getLeadsInRange(range) {
  var dr = getDateRange(range);
  if (!dr || !leadsData.allLeads) return [];
  return leadsData.allLeads.filter(function(l){ var iso = toISO(l.date); return iso && iso >= dr.start && iso <= dr.end; });
}

function aggregateDaily(days) {
  var totals = { spend: 0, impressions: 0, reach: 0, leads: 0, messages: 0, linkClicks: 0 };
  days.forEach(function(d) { totals.spend += d.spend; totals.impressions += d.impressions; totals.reach += d.reach; totals.leads += d.leads; totals.messages += d.messages; totals.linkClicks += (d.linkClicks||0); });
  totals.cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  totals.costPerMessage = totals.messages > 0 ? totals.spend / totals.messages : 0;
  totals.cpc = totals.linkClicks > 0 ? totals.spend / totals.linkClicks : 0;
  // CRITICAL: leadConvPct = leads / linkClicks * 100
  totals.leadConvPct = totals.linkClicks > 0 ? (totals.leads / totals.linkClicks * 100) : 0;
  var withCtr = days.filter(function(d){ return d.uniqueCtr > 0; });
  totals.uniqueCtr = withCtr.length > 0 ? withCtr.reduce(function(s,d){ return s + d.uniqueCtr; }, 0) / withCtr.length : 0;
  totals.cpm = days.length > 0 ? days.reduce(function(s,d){ return s + d.cpm; }, 0) / days.length : 0;
  return totals;
}

function aggregateLeads(leads) {
  var totals = { totalLeads: leads.length, responded: 0, noContact: 0, inFollowUp: 0, confirmed: 0, noShow: 0, cancelled: 0 };
  leads.forEach(function(l) {
    var r = (l.responded || '').toLowerCase();
    if (r === 'yes') totals.responded++;
    else if (r === 'no contact') totals.noContact++;
    else totals.inFollowUp++;
    var s = (l.status || '').toLowerCase();
    if (s.includes('successful') || s === 'confirmed') totals.confirmed++;
    else if (s.includes('cancelled')) totals.cancelled++;
    else if (s.includes('no show') || s.includes('no-show')) totals.noShow++;
  });
  totals.respondedPct = totals.totalLeads > 0 ? (totals.responded / totals.totalLeads * 100) : 0;
  totals.booked = totals.confirmed + totals.cancelled + totals.noShow;
  totals.bookedPct = totals.totalLeads > 0 ? (totals.booked / totals.totalLeads * 100) : 0;
  totals.cancellationRate = totals.booked > 0 ? (totals.cancelled / totals.booked * 100) : 0;
  totals.rebooked = 0;
  if (leadsData.monthly) {
    var dr = getDateRange(currentRange);
    Object.entries(leadsData.monthly).forEach(function(entry) {
      var k = entry[0], v = entry[1];
      var mStart = k + '-01';
      var p = k.split('-').map(Number);
      var mEndD = new Date(p[0], p[1], 0);
      var mEnd = p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(mEndD.getDate()).padStart(2,'0');
      if (dr && mStart <= dr.end && mEnd >= dr.start && v.rebooked) {
        totals.rebooked += v.rebooked;
      }
    });
  }
  totals.rebookingRate = totals.booked > 0 ? Math.min(100, (totals.rebooked / totals.booked * 100)) : 0;
  totals.moneyCollected = 0;
  if (leadsData.monthly) {
    var dr = getDateRange(currentRange);
    Object.entries(leadsData.monthly).forEach(function(entry) {
      var k = entry[0], v = entry[1];
      var mStart = k + '-01';
      var p = k.split('-').map(Number);
      var mEndD = new Date(p[0], p[1], 0);
      var mEnd = p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(mEndD.getDate()).padStart(2,'0');
      if (dr && mStart <= dr.end && mEnd >= dr.start && v.moneyCollected) {
        totals.moneyCollected += v.moneyCollected;
      }
    });
  }
  return totals;
}

function render() {
  destroyCharts();
  var sub = document.getElementById('range-subtitle');
  var rdl = document.getElementById('range-date-label');
  if (currentRange === 'monthly') {
    var p = currentMonth.split('-').map(Number);
    var mStart = new Date(p[0], p[1] - 1, 1);
    var mEnd = new Date(p[0], p[1], 0);
    sub.textContent = fmtDate(mStart) + ' \\u2013 ' + fmtDate(mEnd);
    if(rdl) rdl.style.display='none';
    var m = metaData.monthly[currentMonth], l = enrichLeadData(leadsData.monthly[currentMonth]);
    var pm = metaData.monthly[prevMonth(currentMonth)], pl = enrichLeadData(leadsData.monthly[prevMonth(currentMonth)]);
    if (currentTab === 'overview') renderOverview(m, l, pm, pl);
    else if (currentTab === 'ads') renderAds(m, pm);
    else if (currentTab === 'leads') renderLeads(l, pl, m);
    else if (currentTab === 'roi') renderROI(m, l, pm, pl);
  } else {
    var dr = getDateRange(currentRange);
    sub.textContent = dr ? dr.label : 'Performance Dashboard';
    if(rdl && dr) { rdl.textContent = fmtDateLong(dr.start)+' - '+fmtDateLong(dr.end); rdl.style.display='inline'; } else if(rdl) { rdl.style.display='none'; }
    var days = getDailyInRange(currentRange);
    var leads = getLeadsInRange(currentRange);
    var m = aggregateDaily(days);
    var l = aggregateLeads(leads);
    var numDays;
    if (currentRange === 'custom') { numDays = Math.round((parseLocalDate(dr.end) - parseLocalDate(dr.start)) / 86400000) + 1; }
    else { numDays = currentRange === '7d' ? 7 : currentRange === '14d' ? 14 : currentRange === '90d' ? 90 : 30; }
    var drPrev = getDateRange(currentRange);
    var pm, pl;
    if (drPrev) {
      var prevEnd = parseLocalDate(drPrev.start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      var prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - numDays + 1);
      var prevStartStr = prevStart.toISOString().slice(0,10);
      var prevEndStr = prevEnd.toISOString().slice(0,10);
      var prevDays = (metaData.daily||[]).filter(function(d){ return d.date >= prevStartStr && d.date <= prevEndStr; });
      var prevLeads = (leadsData.allLeads||[]).filter(function(ld){ var iso=toISO(ld.date); return iso && iso >= prevStartStr && iso <= prevEndStr; });
      pm = aggregateDaily(prevDays);
      pl = aggregateLeads(prevLeads);
    }
    if (currentTab === 'overview') renderOverviewRange(m, l, pm, pl, days, leads);
    else if (currentTab === 'ads') renderAdsRange(m, pm, days);
    else if (currentTab === 'leads') renderLeadsRange(l, pl, leads, days);
    else if (currentTab === 'roi') renderROIRange(m, l, pm, pl);
  }
}

function enrichLeadData(l) {
  if (!l) return l;
  l.cancellationRate = l.booked > 0 ? (l.cancelled / l.booked * 100) : 0;
  if (l.rebooked === undefined) l.rebooked = 0;
  if (l.rebookingRate === undefined) l.rebookingRate = l.booked > 0 ? Math.min(100, (l.rebooked / l.booked * 100)) : 0;
  return l;
}

var LEGEND_OVERVIEW = '<div class="chart-row full"><div class="chart-card" style="background:var(--beige-light);"><h3 style="margin-bottom:16px;">Metric Definitions</h3><div style="display:grid;gap:12px;font-size:13px;line-height:1.6;"><div><strong>Total Spend:</strong> Total amount spent on Meta (Facebook/Instagram) advertising for the period.</div><div><strong>Total Leads:</strong> Number of leads generated through Meta ad campaigns during the period.</div><div><strong>Cost Per Lead (CPL):</strong> Average cost to acquire one lead. Calculated as Total Spend / Total Leads. Lower is better.</div><div><strong>Responded %:</strong> Percentage of leads who responded to follow-up contact via SMS, email, or phone call.</div><div><strong>Booked:</strong> Number of leads who booked an appointment (confirmed, cancelled, or no-show).</div><div><strong>Lead Status Breakdown:</strong> Visual breakdown of where all leads sit in the pipeline (Responded, No Contact, In Follow Up).</div><div><strong>Best Performing Ad:</strong> The ad with the highest efficiency (leads per dollar spent) for the period.</div></div></div></div>';
var LEGEND_ADS = '<div class="chart-row full"><div class="chart-card" style="background:var(--beige-light);"><h3 style="margin-bottom:16px;">Metric Definitions</h3><div style="display:grid;gap:12px;font-size:13px;line-height:1.6;"><div><strong>Ad Spend:</strong> Total amount spent on Meta ads during the selected reporting period.</div><div><strong>Leads Generated:</strong> Total number of leads captured from the ad campaigns.</div><div><strong>Cost Per Lead (CPL):</strong> Average cost to generate one lead.</div><div><strong>Conversations Started:</strong> Number of messaging conversations initiated through the ads (Facebook Messenger or Instagram DMs).</div><div><strong>Cost Per Conversation:</strong> Average cost to start a messaging conversation from the ads.</div><div><strong>Unique CTR:</strong> Percentage of people who saw the ad and clicked the link.</div><div><strong>CPM:</strong> Cost to show the ad 1,000 times. Indicates how expensive the audience is to reach.</div><div><strong>Link Clicks:</strong> Total number of clicks on links within the ad that directed people to a destination.</div><div><strong>CPC:</strong> Cost per click. Average cost for each link click on the ad.</div><div><strong>Lead Conv %:</strong> Percentage of link clicks that converted into a lead. Calculated as leads ÷ link clicks × 100.</div><div><strong>Audience by Age:</strong> Distribution of leads across age groups to identify which demographics respond most.</div><div><strong>Ad Placements:</strong> Where ads were shown (Facebook Feed, Instagram Feed, Stories, etc.) and how many leads each placement generated.</div></div></div></div>';
var LEGEND_LEADS = '<div class="chart-row full"><div class="chart-card" style="background:var(--beige-light);"><h3 style="margin-bottom:16px;">Metric Definitions</h3><div style="display:grid;gap:12px;font-size:13px;line-height:1.6;"><div><strong>Total Opportunities:</strong> Total number of qualified leads created in Go High Level CRM.</div><div><strong>Responded %:</strong> Percentage of leads who responded via SMS, email, or phone call.</div><div><strong>Booked:</strong> Number of leads who booked an appointment (confirmed, cancelled, or no-show).</div><div><strong>Booking Rate:</strong> Percentage of total leads who booked an appointment. Calculated as Booked / Total Opportunities x 100.</div><div><strong>Money Collected:</strong> Revenue generated from all confirmed appointments that came from leads during this period.</div><div><strong>Confirmed Appointments:</strong> Number of leads who attended their booked appointment successfully.</div><div><strong>Cancelled Appointments:</strong> Number of leads who booked an appointment but cancelled before attending.</div><div><strong>Cancellation Rate:</strong> Percentage of booked appointments that were cancelled.</div><div><strong>Rebooked Appointments:</strong> Number of successful appointments that were rebooked for a future appointment.</div><div><strong>Rebooking Rate:</strong> Percentage of successful bookings where the client scheduled another appointment.</div><div><strong>Lead Status Breakdown:</strong> Visual breakdown of where all leads sit in the pipeline (Confirmed, No Show, Cancelled, In Follow Up, No Contact).</div><div><strong>Offer Comparison:</strong> Side-by-side performance of each active offer, including budget allocation, leads, CPL, and bookings.</div></div></div></div>';

function getMonthlyDailyData(monthKey) {
  var daily = (metaData.daily || []).filter(function(d){ return d.date.startsWith(monthKey); });
  return {
    labels: daily.map(function(d){ return parseLocalDate(d.date).getDate(); }),
    spend: daily.map(function(d){ return d.spend; }),
    leads: daily.map(function(d){ return d.leads; }),
    cpl: daily.map(function(d){ return d.leads > 0 ? d.spend / d.leads : 0; }),
    days: daily
  };
}
function dailyXAxis() { return { grid:{display:false}, ticks:{ maxRotation:45, autoSkip:false, font:{size:9} } }; }

function renderOverview(m,l,pm,pl) {
  if(!m) return;
  var tab=document.getElementById('tab-overview');
  var dd = getMonthlyDailyData(currentMonth);
  var bestAd=m.ads&&m.ads.reduce(function(a,b){return((a.leads||0)/(a.spend||1)>(b.leads||0)/(b.spend||1))?a:b;},m.ads[0]);
  var avgCpl = m.cpl || 0;
  var avgCplLine = dd.labels.map(function(){ return avgCpl; });
  var ml = getMonthLabel(currentMonth);
  tab.innerHTML = '<div class="kpi-grid">'+kpi('spend','Total Spend',fmtC(m.spend),trend(m.spend,pm&&pm.spend))+kpi('leads','Total Leads',m.leads,trend(m.leads,pm&&pm.leads))+kpi('cpl','Cost Per Lead',fmtC(m.cpl),trend(m.cpl,pm&&pm.cpl,true))+kpi('responded','Responded %',l?fmtPw(l.respondedPct):'--',l&&pl?trend(l.respondedPct,pl.respondedPct):'')+kpi('booked','Booked',l?l.booked:'--',l&&pl?trend(l.booked,pl.booked):'')+'</div><div class="chart-row full"><div class="chart-card"><h3>Cost Per Lead</h3><div class="chart-sub">'+ml+' — Daily CPL vs monthly average ('+fmtC(avgCpl)+')</div><div class="chart-container"><canvas id="c-cpl"></canvas></div></div></div><div class="chart-row">'+(l?'<div class="chart-card"><h3>Lead Status</h3><div class="chart-sub">'+ml+'</div><div class="chart-container short"><canvas id="c-lead-status"></canvas></div></div>':'')+'<div class="chart-card"><h3>Best Performing Ad</h3><div class="chart-sub">'+ml+'</div><div style="padding:16px 0;"><div style="font-weight:700;font-size:16px;margin-bottom:4px;">'+(bestAd&&bestAd.adName||'--')+'</div><div style="font-size:12px;color:#999;margin-bottom:16px;">'+(bestAd&&bestAd.campaignName||'')+'</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;"><div><div class="kpi-label">Leads</div><div style="font-size:22px;font-weight:700;margin-top:4px;">'+(bestAd&&bestAd.leads||0)+'</div></div><div><div class="kpi-label">CPL</div><div style="font-size:22px;font-weight:700;margin-top:4px;">'+fmtC(bestAd&&bestAd.cpl||0)+'</div></div><div><div class="kpi-label">Unique CTR</div><div style="font-size:22px;font-weight:700;margin-top:4px;">'+fmtP(bestAd&&bestAd.uniqueCtr||0)+'</div></div></div></div></div></div>'+LEGEND_OVERVIEW;

  charts.cpl = new Chart(document.getElementById('c-cpl'),{type:'line',data:{labels:dd.labels,datasets:[
    {label:'Daily CPL',data:dd.cpl,borderColor:C.dark,backgroundColor:'rgba(59,59,59,0.08)',fill:true,pointRadius:3,pointBackgroundColor:C.dark,pointHoverRadius:5,tension:0.3,borderWidth:2},
    {label:'Monthly Avg ('+fmtC(avgCpl)+')',data:avgCplLine,borderColor:C.accent,borderDash:[8,4],borderWidth:2,pointRadius:0,fill:false,tension:0}
  ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v.toFixed(2);}}},x:dailyXAxis()}}});

  if(l) {
    var lTotal=l.responded+l.noContact+l.inFollowUp;
    charts.ls = new Chart(document.getElementById('c-lead-status'),{type:'doughnut',data:{labels:['Responded: '+l.responded+' ('+(l.responded/lTotal*100).toFixed(1)+'%)','No Contact: '+l.noContact+' ('+(l.noContact/lTotal*100).toFixed(1)+'%)','In Follow Up: '+l.inFollowUp+' ('+(l.inFollowUp/lTotal*100).toFixed(1)+'%)'],datasets:[{data:[l.responded,l.noContact,l.inFollowUp],backgroundColor:[C.dark,C.beige,C.accent],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom'}}}});
  }
}

function bucketDays(days, bucketSize) {
  if (bucketSize <= 1) return { labels: days.map(function(d){ return fmtDateShort(d.date); }), data: days };
  var buckets = [];
  for (var i = 0; i < days.length; i += bucketSize) {
    var chunk = days.slice(i, i + bucketSize);
    var spend = chunk.reduce(function(s,d){ return s + d.spend; }, 0);
    var leads = chunk.reduce(function(s,d){ return s + d.leads; }, 0);
    var impressions = chunk.reduce(function(s,d){ return s + d.impressions; }, 0);
    var messages = chunk.reduce(function(s,d){ return s + d.messages; }, 0);
    var label = fmtBucketLabel(chunk[0].date, chunk[chunk.length-1].date);
    buckets.push({ spend:spend, leads:leads, impressions:impressions, messages:messages, label:label });
  }
  return { labels: buckets.map(function(b){ return b.label; }), data: buckets };
}

function renderOverviewRange(m,l,pm,pl,days,leads) {
  var tab=document.getElementById('tab-overview');
  var _numD = currentRange==='custom' && customStart && customEnd ? Math.round((parseLocalDate(customEnd)-parseLocalDate(customStart))/86400000)+1 : 0;
  var bSize = (currentRange === '90d' || (currentRange==='custom' && _numD > 45)) ? 7 : 1;
  var bucketed = bucketDays(days, bSize);
  var labels = bucketed.labels;
  var chartData = bucketed.data;

  var avgCplR = m.cpl || 0;
  var cplDataR = chartData.map(function(d){ return d.leads > 0 ? d.spend / d.leads : null; });
  var avgCplLineR = labels.map(function(){ return avgCplR; });

  tab.innerHTML = '<div class="kpi-grid">'+kpi('spend','Total Spend',fmtC(m.spend),trend(m.spend,pm&&pm.spend))+kpi('leads','Total Leads',m.leads,trend(m.leads,pm&&pm.leads))+kpi('cpl','Cost Per Lead',fmtC(m.cpl),trend(m.cpl,pm&&pm.cpl,true))+kpi('responded','Responded %',fmtPw(l.respondedPct),pl?trend(l.respondedPct,pl.respondedPct):'')+kpi('booked','Booked',l.booked,pl?trend(l.booked,pl.booked):'')+'</div><div class="chart-row full"><div class="chart-card"><h3>Cost Per Lead</h3><div class="chart-sub">Daily CPL vs period average ('+fmtC(avgCplR)+')</div><div class="chart-container"><canvas id="c-cpl"></canvas></div></div></div><div class="chart-row"><div class="chart-card"><h3>Lead Status</h3><div class="chart-sub">Period breakdown</div><div class="chart-container short"><canvas id="c-lead-status"></canvas></div></div><div class="chart-card"><h3>Period Summary</h3><div class="chart-sub">Key metrics at a glance</div><div class="period-summary-grid" style="padding:16px 0;display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div><div class="kpi-label">Total Leads</div><div style="font-size:28px;font-weight:700;margin-top:4px;">'+l.totalLeads+'</div></div><div><div class="kpi-label">Responded</div><div style="font-size:28px;font-weight:700;margin-top:4px;">'+l.responded+'</div></div><div><div class="kpi-label">Avg Daily Spend</div><div style="font-size:28px;font-weight:700;margin-top:4px;">'+fmtC(days.length?m.spend/days.length:0)+'</div></div><div><div class="kpi-label">Avg Daily Leads</div><div style="font-size:28px;font-weight:700;margin-top:4px;">'+(days.length?(m.leads/days.length).toFixed(1):'0')+'</div></div></div></div></div>'+LEGEND_OVERVIEW;

  var pr = (currentRange === '90d' || (currentRange==='custom' && _numD > 45)) ? 4 : 3;
  charts.cpl = new Chart(document.getElementById('c-cpl'),{type:'line',data:{labels:labels,datasets:[
    {label:'Daily CPL',data:cplDataR,borderColor:C.dark,backgroundColor:'rgba(59,59,59,0.06)',fill:true,pointRadius:pr,pointBackgroundColor:C.dark,tension:0.3,spanGaps:true,borderWidth:2},
    {label:'Period Avg ('+fmtC(avgCplR)+')',data:avgCplLineR,borderColor:C.accent,borderDash:[8,4],borderWidth:2,pointRadius:0,fill:false,tension:0}
  ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v.toFixed(2);}}},x:{grid:{display:false}}}}});

  var lTotal = l.responded + l.noContact + l.inFollowUp;
  if (lTotal > 0) {
    charts.ls = new Chart(document.getElementById('c-lead-status'),{type:'doughnut',data:{labels:['Responded: '+l.responded+' ('+(l.responded/lTotal*100).toFixed(1)+'%)','No Contact: '+l.noContact+' ('+(l.noContact/lTotal*100).toFixed(1)+'%)','In Follow Up: '+l.inFollowUp+' ('+(l.inFollowUp/lTotal*100).toFixed(1)+'%)'],datasets:[{data:[l.responded,l.noContact,l.inFollowUp],backgroundColor:[C.dark,C.beige,C.accent],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom'}}}});
  }
}

function renderAds(m,pm) {
  if(!m) return;
  var tab=document.getElementById('tab-ads');
  var hasMultiOffer = m.offers && m.offers.length > 1;
  var hasGender = m.gender && m.gender.length > 0;
  var ageRowCols = hasGender ? 'triple' : '';
  var adsML = getMonthLabel(currentMonth);
  tab.innerHTML = '<div class="kpi-grid">'+kpi('spend','Ad Spend',fmtC(m.spend),trend(m.spend,pm&&pm.spend))+kpi('leads','Leads Generated',m.leads,trend(m.leads,pm&&pm.leads))+kpi('cpl','Cost Per Lead',fmtC(m.cpl),trend(m.cpl,pm&&pm.cpl,true))+kpi('msg','Conversations Started',m.messages,trend(m.messages,pm&&pm.messages))+kpi('msg','Cost Per Conversation',fmtC(m.costPerMessage),trend(m.costPerMessage,pm&&pm.costPerMessage,true))+kpi('ctr','Unique CTR',fmtP(m.uniqueCtr),trend(m.uniqueCtr,pm&&pm.uniqueCtr))+kpi('impressions','CPM',fmtC(m.cpm),trend(m.cpm,pm&&pm.cpm,true))+kpi('clicks','Link Clicks',fmtN(m.linkClicks||0),trend(m.linkClicks||0,pm&&pm.linkClicks||0))+kpi('cpc','CPC',fmtC(m.cpc||0),trend(m.cpc||0,pm&&pm.cpc||0,true))+kpi('conv','Lead Conv %',fmtP(m.leadConvPct),trend(m.leadConvPct,pm&&pm.leadConvPct))+'</div><div class="chart-row full"><div class="chart-card"><h3>Campaign Performance</h3><div class="chart-sub">'+adsML+' — Daily CPL by campaign</div><div class="chart-container"><canvas id="c-campaigns"></canvas></div></div></div>'+(hasMultiOffer?'<div class="chart-row full"><div class="chart-card"><h3>Offer Comparison</h3><div class="chart-sub">'+adsML+' — Side-by-side performance of active offers</div><div class="offer-grid" id="offer-compare-grid"></div></div></div>':'')+'<div class="chart-row '+ageRowCols+'"><div class="chart-card"><h3>Audience by Age</h3><div class="chart-sub">'+adsML+'</div><div class="chart-container"><canvas id="c-age"></canvas></div></div>'+(hasGender?'<div class="chart-card"><h3>Gender Breakdown</h3><div class="chart-sub">'+adsML+'</div><div class="chart-container"><canvas id="c-gender"></canvas></div></div>':'')+'<div class="chart-card"><h3>Ad Placements</h3><div class="chart-sub">'+adsML+'</div><div class="chart-container"><canvas id="c-placements"></canvas></div></div></div><div class="chart-row full"><div class="chart-card"><h3>Ad Creative Leaderboard</h3><div class="chart-sub">'+adsML+' — Top 5 ads ranked by cost per lead</div><div id="ad-leaderboard-table"></div></div></div>'+LEGEND_ADS;

  // Campaign daily CPL chart
  var campDaily = metaData.campaignDaily || {};
  var monthDates = Object.keys(campDaily).filter(function(d){ return d.startsWith(currentMonth); }).sort();
  var campNames = {};
  monthDates.forEach(function(d){ Object.keys(campDaily[d]).forEach(function(c){ campNames[c]=true; }); });
  var campList = Object.keys(campNames).sort();
  var campColors = [C.dark, C.coral, C.teal, C.accent, '#8b5cf6', '#f59e0b'];
  var campDatasets = [];
  campList.forEach(function(camp, i) {
    var cplArr = monthDates.map(function(d){ var cd = campDaily[d]&&campDaily[d][camp]; return cd && cd.leads > 0 ? cd.spend / cd.leads : null; });
    var totalSpend = 0, totalLeads = 0;
    monthDates.forEach(function(d){ var cd = campDaily[d]&&campDaily[d][camp]; if(cd){ totalSpend+=cd.spend; totalLeads+=cd.leads; }});
    var avgCplCamp = totalLeads > 0 ? totalSpend / totalLeads : 0;
    var shortName = camp.replace(/^.*?(?=((?:AGE [0-9]+[+]? )?OFFER))/i, '').substring(0, 40);
    campDatasets.push({label:shortName+' CPL',data:cplArr,borderColor:campColors[i%campColors.length],backgroundColor:'transparent',pointRadius:3,pointBackgroundColor:campColors[i%campColors.length],tension:0.3,borderWidth:2,spanGaps:true});
    campDatasets.push({label:shortName+' Avg ('+fmtC(avgCplCamp)+')',data:monthDates.map(function(){return avgCplCamp;}),borderColor:campColors[i%campColors.length],borderDash:[8,4],borderWidth:1.5,pointRadius:0,fill:false,tension:0});
  });
  var campDayLabels = monthDates.map(function(d){ return parseLocalDate(d).getDate(); });
  charts.camp = new Chart(document.getElementById('c-campaigns'),{type:'line',data:{labels:campDayLabels,datasets:campDatasets},options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v.toFixed(0);}}},x:dailyXAxis()},plugins:{legend:{labels:{usePointStyle:true,pointStyle:'circle',font:{size:11}}}}}});

  if(hasMultiOffer) {
    document.getElementById('offer-compare-grid').innerHTML = m.offers.map(function(o) {
      var camp = (m.campaigns||[]).find(function(c){ return c.name.toUpperCase().includes(o.campaignPattern); });
      return '<div class="offer-card"><h4>'+o.name+'</h4><div class="offer-stat"><span class="label">Leads</span><span class="value">'+o.leads+'</span></div><div class="offer-stat"><span class="label">CPL</span><span class="value">'+fmtC(o.cpl)+'</span></div><div class="offer-stat"><span class="label">Lead Conv %</span><span class="value">'+fmtP(camp?camp.leadConvPct:0)+'</span></div></div>';
    }).join('');
  }

  var ageData = m.demographics || [];
  if(ageData.length) {
    var ageColors = [C.beigeLight, C.accent, C.dark, C.teal, C.coral, C.beige];
    charts.age = new Chart(document.getElementById('c-age'),{type:'pie',data:{
      labels:ageData.map(function(a){return (a.age||a.range)+' ('+a.leads+' leads, Budget $'+Math.round(a.spend)+')';}),
      datasets:[{data:ageData.map(function(a){return a.leads;}),backgroundColor:ageColors,borderWidth:2,borderColor:'#fff'}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  var placeData = m.placements || [];
  if(placeData.length) {
    var placementColors = [C.dark, C.accent, C.teal, C.coral, C.beige, C.beigeLight];
    charts.place = new Chart(document.getElementById('c-placements'),{type:'doughnut',data:{
      labels:placeData.filter(function(p){return p.leads>0;}).map(function(p){return p.name+' ('+p.leads+' leads)';}),
      datasets:[{data:placeData.filter(function(p){return p.leads>0;}).map(function(p){return p.leads;}),backgroundColor:placementColors,borderWidth:0,hoverOffset:4}]
    },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  if (hasGender) {
    var genderColors = [C.coral, C.teal, C.beige];
    charts.gender = new Chart(document.getElementById('c-gender'),{type:'pie',data:{
      labels:m.gender.map(function(g){ var cpl = g.leads > 0 ? fmtC(g.spend/g.leads) : '--'; return g.gender+' ('+g.leads+' leads, CPL '+cpl+')'; }),
      datasets:[{data:m.gender.map(function(g){return g.leads;}),backgroundColor:genderColors,borderWidth:2,borderColor:'#fff'}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  var ads = (m.ads||[]).filter(function(a){return a.spend>0;}).sort(function(a,b){return a.cpl-b.cpl;}).slice(0,5);
  document.getElementById('ad-leaderboard-table').innerHTML = '<table class="ad-table"><thead><tr><th>#</th><th>Ad Creative</th><th>Spend</th><th>Leads</th><th>CPL</th><th>Unique CTR</th><th>Frequency</th></tr></thead><tbody>'+ads.map(function(a,i){return '<tr><td><div class="ad-rank '+(i===0?'top':'')+'">'+(i+1)+'</div></td><td><div class="ad-name">'+a.adName+'</div><div class="ad-adset">'+a.adSetName+'</div></td><td class="ad-metric">'+fmtC(a.spend)+'</td><td class="ad-metric">'+a.leads+'</td><td class="ad-metric '+(i===0?'best':'')+'">'+fmtC(a.cpl)+'</td><td class="ad-metric">'+fmtP(a.uniqueCtr)+'</td><td class="ad-metric">'+a.frequency.toFixed(2)+'</td></tr>';}).join('')+'</tbody></table>';
}

function renderAdsRange(m,pm,days) {
  var tab=document.getElementById('tab-ads');
  var drLabel = getDateRange(currentRange);
  var _numD = currentRange==='custom' && customStart && customEnd ? Math.round((parseLocalDate(customEnd)-parseLocalDate(customStart))/86400000)+1 : 0;
  var bSize = (currentRange === '90d' || (currentRange==='custom' && _numD > 45)) ? 7 : 1;
  var bucketed = bucketDays(days, bSize);
  var labels = bucketed.labels;
  var chartData = bucketed.data;
  var closestMonth = currentMonth || Object.keys(metaData.monthly).sort().reverse()[0];
  var mm = metaData.monthly[closestMonth] || {};
  var ads = (mm.ads||[]).filter(function(a){return a.spend>0;}).sort(function(a,b){return a.cpl-b.cpl;}).slice(0,5);

  // Aggregate gender data across months in range
  var genderAgg = {};
  var dr = getDateRange(currentRange);
  if (dr && metaData.monthly) {
    Object.entries(metaData.monthly).forEach(function(entry) {
      var k = entry[0], v = entry[1];
      var mStart = k + '-01';
      var p = k.split('-').map(Number);
      var mEndD = new Date(p[0], p[1], 0);
      var mEnd = p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(mEndD.getDate()).padStart(2,'0');
      if (mStart <= dr.end && mEnd >= dr.start && v.gender) {
        v.gender.forEach(function(g) {
          if (!genderAgg[g.gender]) genderAgg[g.gender] = { gender: g.gender, spend: 0, leads: 0 };
          genderAgg[g.gender].spend += g.spend;
          genderAgg[g.gender].leads += g.leads;
        });
      }
    });
  }
  var genderDataR = Object.values(genderAgg);
  var hasGenderR = genderDataR.length > 0;
  var ageRowColsR = hasGenderR ? 'triple' : '';

  var adsPL = drLabel ? drLabel.label : 'Selected period';
  tab.innerHTML = '<div class="kpi-grid">'+kpi('spend','Ad Spend',fmtC(m.spend),trend(m.spend,pm&&pm.spend))+kpi('leads','Leads Generated',m.leads,trend(m.leads,pm&&pm.leads))+kpi('cpl','Cost Per Lead',fmtC(m.cpl),trend(m.cpl,pm&&pm.cpl,true))+kpi('msg','Conversations Started',m.messages,trend(m.messages,pm&&pm.messages))+kpi('msg','Cost Per Conversation',fmtC(m.costPerMessage),trend(m.costPerMessage,pm&&pm.costPerMessage,true))+kpi('ctr','Unique CTR',fmtP(m.uniqueCtr),trend(m.uniqueCtr,pm&&pm.uniqueCtr))+kpi('impressions','CPM',fmtC(m.cpm),trend(m.cpm,pm&&pm.cpm,true))+kpi('clicks','Link Clicks',fmtN(m.linkClicks||0),trend(m.linkClicks||0,pm&&pm.linkClicks||0))+kpi('cpc','CPC',fmtC(m.cpc||0),trend(m.cpc||0,pm&&pm.cpc||0,true))+kpi('conv','Lead Conv %',fmtP(m.leadConvPct||0),trend(m.leadConvPct||0,pm&&pm.leadConvPct||0))+'</div><div class="chart-row full"><div class="chart-card"><h3>Spend vs Leads</h3><div class="chart-sub">'+adsPL+'</div><div class="chart-container"><canvas id="c-overlay"></canvas></div></div></div><div class="chart-row '+ageRowColsR+'"><div class="chart-card"><h3>Audience by Age</h3><div class="chart-sub">'+adsPL+'</div><div class="chart-container"><canvas id="c-age"></canvas></div></div>'+(hasGenderR?'<div class="chart-card"><h3>Gender Breakdown</h3><div class="chart-sub">'+adsPL+'</div><div class="chart-container"><canvas id="c-gender"></canvas></div></div>':'')+'<div class="chart-card"><h3>Ad Placements</h3><div class="chart-sub">'+adsPL+'</div><div class="chart-container"><canvas id="c-placements"></canvas></div></div></div><div class="chart-row full"><div class="chart-card"><h3>Ad Creative Leaderboard</h3><div class="chart-sub">'+adsPL+'</div><div id="ad-leaderboard-table"></div></div></div>'+LEGEND_ADS;

  var pr2 = (currentRange === '90d' || (currentRange==='custom' && _numD > 45)) ? 4 : 3;
  charts.ov = new Chart(document.getElementById('c-overlay'),{type:'line',data:{labels:labels,datasets:[
    {label:'Spend ($)',data:chartData.map(function(d){return d.spend;}),borderColor:C.beige,fill:false,pointRadius:pr2,pointBackgroundColor:C.beige,tension:0.3,yAxisID:'y',borderDash:[6,4]},
    {label:'Leads',data:chartData.map(function(d){return d.leads;}),borderColor:C.dark,backgroundColor:'rgba(59,59,59,0.06)',fill:true,pointRadius:pr2,pointBackgroundColor:C.dark,tension:0.3,yAxisID:'y1'}
  ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{position:'left',grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v;}}},y1:{position:'right',grid:{display:false}}}}});

  var ageDataR = mm.demographics || [];
  if(ageDataR.length) {
    var ageColors = [C.beigeLight, C.accent, C.dark, C.teal, C.coral, C.beige];
    charts.age = new Chart(document.getElementById('c-age'),{type:'pie',data:{
      labels:ageDataR.map(function(a){return (a.age||a.range)+' ('+a.leads+' leads, Budget $'+Math.round(a.spend)+')';}),
      datasets:[{data:ageDataR.map(function(a){return a.leads;}),backgroundColor:ageColors,borderWidth:2,borderColor:'#fff'}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  var placeDataR = mm.placements || [];
  if(placeDataR.length) {
    var placementColors = [C.dark, C.accent, C.teal, C.coral, C.beige, C.beigeLight];
    charts.place = new Chart(document.getElementById('c-placements'),{type:'doughnut',data:{
      labels:placeDataR.filter(function(p){return p.leads>0;}).map(function(p){return p.name+' ('+p.leads+' leads)';}),
      datasets:[{data:placeDataR.filter(function(p){return p.leads>0;}).map(function(p){return p.leads;}),backgroundColor:placementColors,borderWidth:0,hoverOffset:4}]
    },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  if (hasGenderR) {
    var genderColorsR = [C.coral, C.teal, C.beige];
    charts.gender = new Chart(document.getElementById('c-gender'),{type:'pie',data:{
      labels:genderDataR.map(function(g){ var cpl = g.leads > 0 ? fmtC(g.spend/g.leads) : '--'; return g.gender+' ('+g.leads+' leads, CPL '+cpl+')'; }),
      datasets:[{data:genderDataR.map(function(g){return g.leads;}),backgroundColor:genderColorsR,borderWidth:2,borderColor:'#fff'}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  document.getElementById('ad-leaderboard-table').innerHTML = ads.length ? '<table class="ad-table"><thead><tr><th>#</th><th>Ad Creative</th><th>Spend</th><th>Leads</th><th>CPL</th><th>Unique CTR</th><th>Frequency</th></tr></thead><tbody>'+ads.map(function(a,i){return '<tr><td><div class="ad-rank '+(i===0?'top':'')+'">'+(i+1)+'</div></td><td><div class="ad-name">'+a.adName+'</div><div class="ad-adset">'+a.adSetName+'</div></td><td class="ad-metric">'+fmtC(a.spend)+'</td><td class="ad-metric">'+a.leads+'</td><td class="ad-metric '+(i===0?'best':'')+'">'+fmtC(a.cpl)+'</td><td class="ad-metric">'+fmtP(a.uniqueCtr)+'</td><td class="ad-metric">'+a.frequency.toFixed(2)+'</td></tr>';}).join('')+'</tbody></table>' : '<p style="color:#999;font-size:13px;">No ad data available for this period.</p>';
}

function renderLeads(l,pl,m) {
  if(!l) return;
  var tab=document.getElementById('tab-leads');
  var p2 = currentMonth.split('-').map(Number);
  var monthLabel = new Date(p2[0], p2[1]-1, 1).toLocaleDateString('en-AU',{month:'long',year:'numeric'});
  tab.innerHTML = '<div class="kpi-grid">'+kpi('leads','Total Opportunities',l.totalLeads,trend(l.totalLeads,pl&&pl.totalLeads))+kpi('ctr','Responded %',fmtPw(l.respondedPct),trend(l.respondedPct,pl&&pl.respondedPct))+kpi('cpl','Booked Appointments',l.booked,trend(l.booked,pl&&pl.booked))+kpi('conv','Booking Rate',fmtPw(l.bookedPct),trend(l.bookedPct,pl&&pl.bookedPct))+kpi('revenue','Money Collected',fmtCw(l.moneyCollected),trend(l.moneyCollected,pl&&pl.moneyCollected))+kpi('booked','Confirmed Appointments',l.confirmed,trend(l.confirmed,pl&&pl.confirmed))+kpi('ctr','Cancelled Appointments',l.cancelled,trend(l.cancelled,pl&&pl.cancelled,true))+kpi('ctr','Cancellation Rate',fmtPw(l.cancellationRate||0),trend(l.cancellationRate||0,pl&&pl.cancellationRate||0,true))+kpi('booked','Rebooked Appointments',l.rebooked||0,trend(l.rebooked||0,pl&&pl.rebooked||0))+kpi('conv','Rebooking Rate',fmtPw(l.rebookingRate||0),trend(l.rebookingRate||0,pl&&pl.rebookingRate||0))+'</div><div class="chart-row full" id="call-metrics-section" style="display:none;"><div class="chart-card"><h3>Speed to Lead - Call Response</h3><div class="chart-sub">'+monthLabel+' - Outbound call performance</div><div class="kpi-grid" id="call-metrics-grid"></div></div></div><div class="chart-row"><div class="chart-card"><h3>Lead Status Breakdown</h3><div class="chart-sub">'+monthLabel+'</div><div class="chart-container"><canvas id="c-lead-donut"></canvas></div></div><div class="chart-card"><h3>Opportunities by Day of Week</h3><div class="chart-sub">'+monthLabel+'</div><div class="chart-container"><canvas id="c-lead-trend"></canvas></div></div></div>'+(l.offers&&l.offers.length>0?'<div class="chart-row full"><div class="chart-card"><h3>Offer Comparison</h3><div class="chart-sub">Budget, leads, CPL, and bookings by offer</div><div class="offer-grid">'+l.offers.map(function(o){var metaOffer=(m&&m.offers||[]).find(function(mo){return mo.campaignPattern&&o.name.toUpperCase().includes(mo.campaignPattern);}); var budget=metaOffer?metaOffer.spend:0; return '<div class="offer-card"><h4>'+o.name+'</h4><div class="offer-stat"><span class="label">Budget</span><span class="value">'+fmtC(budget)+'</span></div><div class="offer-stat"><span class="label">Leads</span><span class="value">'+o.leads+'</span></div><div class="offer-stat"><span class="label">CPL</span><span class="value">'+fmtC(o.cpl)+'</span></div><div class="offer-stat"><span class="label">Bookings</span><span class="value">'+o.booked+'</span></div></div>';}).join('')+'</div></div></div>':'')+'<div class="chart-row full"><div class="chart-card"><h3>Recent Leads</h3><div class="chart-sub">Latest lead activity</div><table class="lead-table"><thead><tr><th>Date</th><th>Name</th><th>Offer</th><th>Responded</th><th>Status</th></tr></thead><tbody>'+(l.leads||[]).slice(0,20).map(function(lead){var rc=lead.responded==='Yes'?'yes':lead.responded==='No contact'?'nocontact':'infollowup'; var sc=(lead.status||'').toLowerCase().replace(/\\s/g,''); return '<tr><td>'+fmtDate(lead.date)+'</td><td style="font-weight:600;">'+lead.name+'</td><td>'+lead.offer+'</td><td><span class="status-badge '+rc+'">'+lead.responded+'</span></td><td>'+(lead.status?'<span class="status-badge '+sc+'">'+lead.status+'</span>':'<span style="color:#ccc;">--</span>')+'</td></tr>';}).join('')+'</tbody></table></div></div>'+LEGEND_LEADS;

  var ldTotal=l.confirmed+l.noShow+l.cancelled+l.inFollowUp+l.noContact;
  var ldPct=function(v){return ldTotal?(v/ldTotal*100).toFixed(1):'0.0';};
  charts.ld = new Chart(document.getElementById('c-lead-donut'),{type:'doughnut',data:{
    labels:['Confirmed: '+l.confirmed+' ('+ldPct(l.confirmed)+'%)','No Show: '+l.noShow+' ('+ldPct(l.noShow)+'%)','Cancelled: '+l.cancelled+' ('+ldPct(l.cancelled)+'%)','In Follow Up: '+l.inFollowUp+' ('+ldPct(l.inFollowUp)+'%)','No Contact: '+l.noContact+' ('+ldPct(l.noContact)+'%)'],
    datasets:[{data:[l.confirmed,l.noShow,l.cancelled,l.inFollowUp,l.noContact],backgroundColor:[C.green,C.coral,'#c0392b',C.accent,C.beige],borderWidth:0,hoverOffset:4}]
  },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right'}}}});

  var allLeads = (l.leads || []);
  var dowCounts = [0,0,0,0,0,0,0];
  allLeads.forEach(function(ld){ if(ld.date){ var d = new Date(ld.date); if(!isNaN(d.getTime())){ dowCounts[d.getDay()]++; }}});
  var dowLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var dowData = [dowCounts[1],dowCounts[2],dowCounts[3],dowCounts[4],dowCounts[5],dowCounts[6],dowCounts[0]];
  charts.lt = new Chart(document.getElementById('c-lead-trend'),{type:'bar',data:{
    labels:dowLabels,
    datasets:[
      {label:'Opportunities',data:dowData,backgroundColor:C.beige,borderRadius:6}
    ]
  },options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{stepSize:1}},x:{grid:{display:false}}},plugins:{legend:{display:false}}}});

  var cSlug = new URLSearchParams(window.location.search).get('client') || window.__CLIENT_SLUG__ || '';
  fetch('https://lavpnfluvywcjeiyuash.supabase.co/functions/v1/call-metrics?client=' + cSlug)
    .then(function(r) { return r.json(); })
    .then(function(cm) {
      if (!cm || !cm.total_outbound_calls || cm.total_outbound_calls === 0) return;
      var section = document.getElementById('call-metrics-section');
      var grid = document.getElementById('call-metrics-grid');
      if (!grid || !section) return;
      section.style.display = '';
      function fmtTime(s) {
        if (s === null || s === undefined) return '--';
        if (s < 60) return s + 's';
        if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
        return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm';
      }
      grid.innerHTML =
        kpi('ctr', 'Avg Time to First Call', fmtTime(cm.avg_time_to_first_call_seconds), '') +
        kpi('conv', 'Called Within 10 Min', cm.called_within_10_min_pct + '%', '') +
        kpi('leads', 'Total Outbound Calls', cm.total_outbound_calls, '') +
        kpi('booked', 'Contacts Called', cm.unique_contacts_called, '') +
        kpi('revenue', 'During Business Hours', cm.calls_during_business_hours, '') +
        kpi('cpl', 'Outside Business Hours', cm.calls_outside_business_hours, '') +
        kpi('ctr', 'Avg Response (Business Hrs)', fmtTime(cm.avg_time_to_first_call_bh_seconds), '') +
        kpi('responded', 'Calls Answered', (cm.status_breakdown && cm.status_breakdown.completed) || 0, '');
    })
    .catch(function(err) {});
}

function renderLeadsRange(l,pl,leads,days) {
  var tab=document.getElementById('tab-leads');

  var closestMonth = currentMonth || Object.keys(metaData.monthly).sort().reverse()[0];
  var mm = metaData.monthly[closestMonth];
  var offerMap = {};
  leads.forEach(function(ld) {
    var o = ld.offer || 'Unknown';
    if (!offerMap[o]) offerMap[o] = { name: o, leads: 0, booked: 0 };
    offerMap[o].leads++;
    var s = (ld.status || '').toLowerCase();
    if (s.includes('successful') || s === 'confirmed' || s.includes('booked') || s.includes('cancelled') || s.includes('no show')) offerMap[o].booked++;
  });
  var offerCards = Object.values(offerMap).filter(function(o){return o.name.toUpperCase().includes('OFFER');}).map(function(o) {
    var metaOffer = (mm&&mm.offers||[]).find(function(mo){return mo.campaignPattern && o.name.toUpperCase().includes(mo.campaignPattern);});
    var budget = metaOffer ? metaOffer.spend : 0;
    var cpl = o.leads > 0 && budget > 0 ? budget / o.leads : 0;
    return '<div class="offer-card"><h4>'+o.name+'</h4><div class="offer-stat"><span class="label">Budget</span><span class="value">'+fmtC(budget)+'</span></div><div class="offer-stat"><span class="label">Leads</span><span class="value">'+o.leads+'</span></div><div class="offer-stat"><span class="label">CPL</span><span class="value">'+(cpl>0?fmtC(cpl):'--')+'</span></div><div class="offer-stat"><span class="label">Bookings</span><span class="value">'+o.booked+'</span></div></div>';
  }).join('');

  var drLabel = getDateRange(currentRange);
  var periodLabel = drLabel ? drLabel.label : 'Selected period';
  tab.innerHTML = '<div class="kpi-grid">'+kpi('leads','Total Opportunities',l.totalLeads,trend(l.totalLeads,pl&&pl.totalLeads))+kpi('ctr','Responded %',fmtPw(l.respondedPct),trend(l.respondedPct,pl&&pl.respondedPct))+kpi('cpl','Booked Appointments',l.booked,trend(l.booked,pl&&pl.booked))+kpi('conv','Booking Rate',fmtPw(l.bookedPct),trend(l.bookedPct,pl&&pl.bookedPct))+kpi('revenue','Money Collected',fmtCw(l.moneyCollected),trend(l.moneyCollected,pl&&pl.moneyCollected))+kpi('booked','Confirmed Appointments',l.confirmed,trend(l.confirmed,pl&&pl.confirmed))+kpi('ctr','Cancelled Appointments',l.cancelled,trend(l.cancelled,pl&&pl.cancelled,true))+kpi('ctr','Cancellation Rate',fmtPw(l.cancellationRate||0),trend(l.cancellationRate||0,pl&&pl.cancellationRate||0,true))+kpi('booked','Rebooked Appointments',l.rebooked||0,trend(l.rebooked||0,pl&&pl.rebooked||0))+kpi('conv','Rebooking Rate',fmtPw(l.rebookingRate||0),trend(l.rebookingRate||0,pl&&pl.rebookingRate||0))+'</div><div class="chart-row full" id="call-metrics-section" style="display:none;"><div class="chart-card"><h3>Speed to Lead - Call Response</h3><div class="chart-sub">'+periodLabel+' - Outbound call performance</div><div class="kpi-grid" id="call-metrics-grid"></div></div></div><div class="chart-row"><div class="chart-card"><h3>Lead Status Breakdown</h3><div class="chart-sub">'+periodLabel+'</div><div class="chart-container"><canvas id="c-lead-donut"></canvas></div></div><div class="chart-card"><h3>Opportunities by Day of Week</h3><div class="chart-sub">'+periodLabel+'</div><div class="chart-container"><canvas id="c-lead-trend"></canvas></div></div></div>'+(offerCards?'<div class="chart-row full"><div class="chart-card"><h3>Offer Comparison</h3><div class="chart-sub">Budget, leads, CPL, and bookings by offer</div><div class="offer-grid">'+offerCards+'</div></div></div>':'')+'<div class="chart-row full"><div class="chart-card"><h3>Leads in Period</h3><div class="chart-sub">'+leads.length+' leads found</div><table class="lead-table"><thead><tr><th>Date</th><th>Name</th><th>Offer</th><th>Responded</th><th>Status</th></tr></thead><tbody>'+leads.slice().reverse().slice(0,10).map(function(lead){var rc=(lead.responded||'').toLowerCase()==='yes'?'yes':(lead.responded||'').toLowerCase()==='no contact'?'nocontact':'infollowup'; var sc=(lead.status||'').toLowerCase().replace(/\\s/g,''); return '<tr><td>'+fmtDate(lead.date)+'</td><td style="font-weight:600;">'+lead.name+'</td><td>'+lead.offer+'</td><td><span class="status-badge '+rc+'">'+lead.responded+'</span></td><td>'+(lead.status?'<span class="status-badge '+sc+'">'+lead.status+'</span>':'<span style="color:#ccc;">--</span>')+'</td></tr>';}).join('')+'</tbody></table></div></div>'+LEGEND_LEADS;

  var ldTotal = l.responded + l.noContact + l.inFollowUp;
  var ldPct = function(v){return ldTotal?(v/ldTotal*100).toFixed(1):'0.0';};
  if (ldTotal > 0) {
    charts.ld = new Chart(document.getElementById('c-lead-donut'),{type:'doughnut',data:{
      labels:['Responded: '+l.responded+' ('+ldPct(l.responded)+'%)','No Contact: '+l.noContact+' ('+ldPct(l.noContact)+'%)','In Follow Up: '+l.inFollowUp+' ('+ldPct(l.inFollowUp)+'%)'],
      datasets:[{data:[l.responded,l.noContact,l.inFollowUp],backgroundColor:[C.dark,C.beige,C.accent],borderWidth:0,hoverOffset:4}]
    },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right'}}}});
  }

  var dowCountsR = [0,0,0,0,0,0,0];
  leads.forEach(function(ld){ if(ld.date){ var d = new Date(ld.date); if(!isNaN(d.getTime())){ dowCountsR[d.getDay()]++; }}});
  var dowLabelsR = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var dowDataR = [dowCountsR[1],dowCountsR[2],dowCountsR[3],dowCountsR[4],dowCountsR[5],dowCountsR[6],dowCountsR[0]];
  charts.lt = new Chart(document.getElementById('c-lead-trend'),{type:'bar',data:{
    labels:dowLabelsR,
    datasets:[
      {label:'Opportunities',data:dowDataR,backgroundColor:C.beige,borderRadius:6}
    ]
  },options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{stepSize:1}},x:{grid:{display:false}}},plugins:{legend:{display:false}}}});

  var cSlugR = new URLSearchParams(window.location.search).get('client') || window.__CLIENT_SLUG__ || '';
  fetch('https://lavpnfluvywcjeiyuash.supabase.co/functions/v1/call-metrics?client=' + cSlugR)
    .then(function(r) { return r.json(); })
    .then(function(cm) {
      if (!cm || !cm.total_outbound_calls || cm.total_outbound_calls === 0) return;
      var section = document.getElementById('call-metrics-section');
      var grid = document.getElementById('call-metrics-grid');
      if (!grid || !section) return;
      section.style.display = '';
      function fmtTime(s) {
        if (s === null || s === undefined) return '--';
        if (s < 60) return s + 's';
        if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
        return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm';
      }
      grid.innerHTML =
        kpi('ctr', 'Avg Time to First Call', fmtTime(cm.avg_time_to_first_call_seconds), '') +
        kpi('conv', 'Called Within 10 Min', cm.called_within_10_min_pct + '%', '') +
        kpi('leads', 'Total Outbound Calls', cm.total_outbound_calls, '') +
        kpi('booked', 'Contacts Called', cm.unique_contacts_called, '') +
        kpi('revenue', 'During Business Hours', cm.calls_during_business_hours, '') +
        kpi('cpl', 'Outside Business Hours', cm.calls_outside_business_hours, '') +
        kpi('ctr', 'Avg Response (Business Hrs)', fmtTime(cm.avg_time_to_first_call_bh_seconds), '') +
        kpi('responded', 'Calls Answered', (cm.status_breakdown && cm.status_breakdown.completed) || 0, '');
    })
    .catch(function(err) {});
}

function getLTV() {
  return metaData && metaData.ltv ? metaData.ltv : null;
}

function getAgencyFee(monthKey) {
  if (!metaData || !metaData.agencyFees) return 0;
  return metaData.agencyFees[monthKey] || 0;
}

function roiKpi(label, value) {
  return '<div class="kpi-card"><div class="kpi-label">'+label+'</div><div class="kpi-value">'+value+'</div></div>';
}

function renderROIContent(tab, m, l, pm, pl, numMonths) {
  var agencyFee = 0;
  if (currentRange === 'monthly') {
    agencyFee = getAgencyFee(currentMonth);
  } else {
    var dr = getDateRange(currentRange);
    if (dr && metaData.agencyFees) {
      Object.keys(metaData.agencyFees).forEach(function(mk) {
        var mStart = mk + '-01';
        var p = mk.split('-').map(Number);
        var mEndD = new Date(p[0], p[1], 0);
        var mEnd = p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(mEndD.getDate()).padStart(2,'0');
        if (mStart <= dr.end && mEnd >= dr.start) {
          agencyFee += metaData.agencyFees[mk];
        }
      });
    }
  }
  var adSpend = m&&m.spend || 0;
  var bookings = l&&l.booked || 0;
  var moneyCollected = l&&l.moneyCollected || 0;
  var totalCost = adSpend + agencyFee;
  var clientLTV = getLTV();
  var hasLTV = clientLTV !== null;
  var ltvRevenue = hasLTV ? bookings * clientLTV : 0;
  var trueROI = hasLTV && totalCost > 0 ? (ltvRevenue / totalCost * 100) : 0;
  var roi = totalCost > 0 ? (moneyCollected / totalCost * 100) : 0;
  var roiColor = roi >= 100 ? 'var(--green)' : roi >= 50 ? 'var(--accent)' : 'var(--coral)';
  var trueRoiColor = hasLTV ? (trueROI >= 100 ? 'var(--green)' : trueROI >= 50 ? 'var(--accent)' : 'var(--coral)') : '#999';

  var ltvRevenueDisplay = hasLTV ? fmtCw(ltvRevenue) : 'TBA';
  var trueROIDisplay = hasLTV ? trueROI.toFixed(1)+'%' : 'TBA';
  var ltvDescription = metaData.ltvDescription || (hasLTV ? 'Currently estimated at ~$'+clientLTV+' per client.' : 'The average revenue generated per client, calculated by dividing total revenue by the total number of clients.');
  var trueROISub = hasLTV ? 'Based on bookings x LTV ($'+clientLTV+')' : 'LTV not yet determined';

  tab.innerHTML = '<div class="kpi-grid">'+roiKpi('Agency Fee',fmtCw(agencyFee))+roiKpi('Ad Spend',fmtC(adSpend))+roiKpi('Total Cost',fmtC(totalCost))+roiKpi('Bookings',bookings)+roiKpi('Money Collected',fmtCw(moneyCollected))+roiKpi('LTV Revenue',ltvRevenueDisplay)+'</div><div class="chart-row"><div class="chart-card"><h3>Return on Investment</h3><div class="chart-sub">Based on actual money collected</div><div style="text-align:center;padding:30px 0;"><div style="font-size:48px;font-weight:700;color:'+roiColor+';">'+roi.toFixed(1)+'%</div><div style="font-size:14px;color:#999;margin-top:8px;">ROI</div></div></div><div class="chart-card"><h3>TRUE ROI (Projected)</h3><div class="chart-sub">'+trueROISub+'</div><div style="text-align:center;padding:30px 0;"><div style="font-size:48px;font-weight:700;color:'+trueRoiColor+';">'+trueROIDisplay+'</div><div style="font-size:14px;color:#999;margin-top:8px;">TRUE ROI</div></div></div></div><div class="chart-row full"><div class="chart-card"><h3>ROI Breakdown</h3><div class="chart-sub">Cost vs revenue comparison</div><div class="chart-container"><canvas id="c-roi-bar"></canvas></div></div></div><div class="chart-row full"><div class="chart-card" style="background:var(--beige-light);"><h3 style="margin-bottom:16px;">Metric Definitions</h3><div style="display:grid;gap:12px;font-size:13px;line-height:1.6;"><div><strong>Agency Fee:</strong> The monthly retainer paid to Media Waffle for management and strategy.</div><div><strong>Ad Spend:</strong> Total amount spent on Meta (Facebook/Instagram) advertising for the period.</div><div><strong>Total Cost:</strong> The combined investment: Ad Spend + Agency Fee. This is the total outlay for the period.</div><div><strong>Bookings:</strong> Number of confirmed appointments.</div><div><strong>Money Collected:</strong> Revenue generated from all confirmed appointments that came from leads during this period.</div><div><strong>LTV (Lifetime Value):</strong> '+ltvDescription+'</div><div><strong>LTV Revenue:</strong> Projected total revenue: Bookings x LTV. Represents the expected long-term value of bookings made this period.</div><div><strong>ROI (Return on Investment):</strong> Money Collected / Total Cost x 100. Shows actual return based on cash already received. Below 100% means you have not recouped costs yet from collected revenue alone.</div><div><strong>TRUE ROI:</strong> LTV Revenue / Total Cost x 100. Shows projected return when accounting for the full lifetime value of each booking. This is the more accurate measure of campaign profitability.</div></div></div></div>';

  var barLabels = hasLTV ? ['Agency Fee','Ad Spend','Total Cost','Money Collected','LTV Revenue'] : ['Agency Fee','Ad Spend','Total Cost','Money Collected'];
  var barData = hasLTV ? [agencyFee, adSpend, totalCost, moneyCollected, ltvRevenue] : [agencyFee, adSpend, totalCost, moneyCollected];
  var barColors = hasLTV ? [C.accent, C.beige, C.coral, '#6ba378', '#35d45a'] : [C.accent, C.beige, C.coral, '#6ba378'];

  charts.roiBar = new Chart(document.getElementById('c-roi-bar'),{type:'bar',data:{
    labels:barLabels,
    datasets:[{
      data:barData,
      backgroundColor:barColors,
      borderRadius:6
    }]
  },options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return fmtC(ctx.raw);}}}},scales:{x:{grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v.toLocaleString();}}},y:{grid:{display:false}}}}});
}

function renderROI(m, l, pm, pl) {
  renderROIContent(document.getElementById('tab-roi'), m, l, pm, pl, 1);
}

function renderROIRange(m, l, pm, pl) {
  var numMonths = 1;
  var dr = getDateRange(currentRange);
  if (dr) {
    var days = Math.round((parseLocalDate(dr.end) - parseLocalDate(dr.start)) / 86400000) + 1;
    numMonths = Math.max(1, Math.round(days / 30));
  }
  renderROIContent(document.getElementById('tab-roi'), m, l, pm, pl, numMonths);
}

async function exportPDF() {
  var btn=document.querySelector('.export-btn'); btn.textContent='Generating...'; btn.disabled=true;
  try {
    var c=document.getElementById('dashboard-content');
    var canvas=await html2canvas(c,{scale:2,backgroundColor:'#f5f0e8',useCORS:true});
    var jsPDF2=window.jspdf; var pdf=new jsPDF2.jsPDF('l','mm','a4');
    var w=pdf.internal.pageSize.getWidth(), h=(canvas.height*w)/canvas.width;
    var left=h, pos=0; var pH=pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,pos,w,h);
    left-=pH; while(left>0){pos=-(h-left);pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,pos,w,h);left-=pH;}
    var rangeLabel = currentRange==='monthly' ? currentMonth : currentRange==='custom' ? customStart+' to '+customEnd : currentRange.toUpperCase();
    pdf.save(metaData.client+' - '+rangeLabel+'.pdf');
  } catch(e){alert('PDF export failed.');}
  btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export PDF';
  btn.disabled=false;
}

loadData();
document.addEventListener('click', function(e) {
  var wrap = document.querySelector('.custom-range-wrap');
  if (wrap && !wrap.contains(e.target)) document.getElementById('custom-range-popup').classList.remove('open');
});
})();
`;
const _app_dashboard = UNSAFE_withComponentProps(function ClientDashboard2() {
  const scriptInjected = useRef(false);
  const appData = useRouteLoaderData("routes/_app");
  useEffect(() => {
    if (scriptInjected.current) return;
    scriptInjected.current = true;
    if (appData?.profile?.client_slug) {
      window.__CLIENT_SLUG__ = appData.profile.client_slug;
    }
    const waitForChart = setInterval(() => {
      if (typeof window.Chart !== "undefined") {
        clearInterval(waitForChart);
        const script = document.createElement("script");
        script.textContent = DASHBOARD_SCRIPT;
        document.body.appendChild(script);
      }
    }, 100);
    return () => clearInterval(waitForChart);
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx("style", {
      dangerouslySetInnerHTML: {
        __html: CSS
      }
    }), /* @__PURE__ */ jsxs("aside", {
      className: "sidebar",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "sidebar-logo",
        children: [/* @__PURE__ */ jsx("div", {
          className: "logo-text",
          children: "Media Waffle"
        }), /* @__PURE__ */ jsx("div", {
          className: "logo-sub",
          children: "Client Dashboard"
        })]
      }), /* @__PURE__ */ jsxs("nav", {
        className: "sidebar-nav",
        children: [/* @__PURE__ */ jsx("div", {
          className: "nav-label",
          children: "Reporting"
        }), /* @__PURE__ */ jsxs("div", {
          className: "nav-item active",
          onClick: (e) => window._dashboardSwitchTab?.("overview", e.currentTarget),
          children: [/* @__PURE__ */ jsxs("svg", {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: [/* @__PURE__ */ jsx("rect", {
              x: "3",
              y: "3",
              width: "7",
              height: "7",
              rx: "1"
            }), /* @__PURE__ */ jsx("rect", {
              x: "14",
              y: "3",
              width: "7",
              height: "7",
              rx: "1"
            }), /* @__PURE__ */ jsx("rect", {
              x: "3",
              y: "14",
              width: "7",
              height: "7",
              rx: "1"
            }), /* @__PURE__ */ jsx("rect", {
              x: "14",
              y: "14",
              width: "7",
              height: "7",
              rx: "1"
            })]
          }), "Overview"]
        }), /* @__PURE__ */ jsxs("div", {
          className: "nav-item",
          onClick: (e) => window._dashboardSwitchTab?.("ads", e.currentTarget),
          children: [/* @__PURE__ */ jsxs("svg", {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: [/* @__PURE__ */ jsx("path", {
              d: "M12 20V10"
            }), /* @__PURE__ */ jsx("path", {
              d: "M18 20V4"
            }), /* @__PURE__ */ jsx("path", {
              d: "M6 20v-4"
            })]
          }), "Ad Performance"]
        }), /* @__PURE__ */ jsxs("div", {
          className: "nav-item",
          onClick: (e) => window._dashboardSwitchTab?.("leads", e.currentTarget),
          children: [/* @__PURE__ */ jsxs("svg", {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: [/* @__PURE__ */ jsx("path", {
              d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            }), /* @__PURE__ */ jsx("circle", {
              cx: "9",
              cy: "7",
              r: "4"
            }), /* @__PURE__ */ jsx("path", {
              d: "M22 21v-2a4 4 0 0 0-3-3.87"
            }), /* @__PURE__ */ jsx("path", {
              d: "M16 3.13a4 4 0 0 1 0 7.75"
            })]
          }), "Lead Data"]
        }), /* @__PURE__ */ jsxs("div", {
          className: "nav-item",
          onClick: (e) => window._dashboardSwitchTab?.("roi", e.currentTarget),
          children: [/* @__PURE__ */ jsx("svg", {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: /* @__PURE__ */ jsx("path", {
              d: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            })
          }), "ROI"]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "sidebar-footer",
        children: [/* @__PURE__ */ jsx("div", {
          className: "sidebar-client",
          id: "sidebar-client",
          children: "Loading..."
        }), /* @__PURE__ */ jsx("div", {
          className: "sidebar-updated",
          id: "sidebar-updated",
          children: "Last updated: --"
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "main",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mobile-tabs",
        id: "mobile-tabs",
        children: [/* @__PURE__ */ jsx("button", {
          className: "mobile-tab active",
          onClick: (e) => {
            window._dashboardSwitchTab?.("overview", document.querySelector(".nav-item:nth-child(2)"));
            window._dashboardSetMobileTab?.(e.currentTarget);
          },
          children: "Overview"
        }), /* @__PURE__ */ jsx("button", {
          className: "mobile-tab",
          onClick: (e) => {
            window._dashboardSwitchTab?.("ads", document.querySelector(".nav-item:nth-child(3)"));
            window._dashboardSetMobileTab?.(e.currentTarget);
          },
          children: "Ads"
        }), /* @__PURE__ */ jsx("button", {
          className: "mobile-tab",
          onClick: (e) => {
            window._dashboardSwitchTab?.("leads", document.querySelector(".nav-item:nth-child(4)"));
            window._dashboardSetMobileTab?.(e.currentTarget);
          },
          children: "Leads"
        }), /* @__PURE__ */ jsx("button", {
          className: "mobile-tab",
          onClick: (e) => {
            window._dashboardSwitchTab?.("roi", document.querySelector(".nav-item:nth-child(5)"));
            window._dashboardSetMobileTab?.(e.currentTarget);
          },
          children: "ROI"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "topbar",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "topbar-left",
          children: [/* @__PURE__ */ jsx("h1", {
            id: "client-name",
            children: "Loading..."
          }), /* @__PURE__ */ jsx("p", {
            id: "range-subtitle",
            children: "Performance Dashboard"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "topbar-right",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "month-selector",
            id: "month-selector-wrap",
            children: [/* @__PURE__ */ jsx("button", {
              className: "month-nav-btn",
              id: "month-prev",
              onClick: () => window._dashboardNavMonth?.(-1),
              children: "←"
            }), /* @__PURE__ */ jsx("select", {
              id: "month-selector",
              onChange: () => window._dashboardChangeMonth?.()
            }), /* @__PURE__ */ jsx("button", {
              className: "month-nav-btn",
              id: "month-next",
              onClick: () => window._dashboardNavMonth?.(1),
              children: "→"
            })]
          }), /* @__PURE__ */ jsx("span", {
            id: "range-date-label",
            style: {
              fontSize: "12px",
              color: "#8a8478",
              marginRight: "10px",
              display: "none"
            }
          }), /* @__PURE__ */ jsxs("div", {
            className: "date-selector",
            children: [/* @__PURE__ */ jsx("button", {
              className: "date-btn",
              onClick: (e) => window._dashboardSetRange?.("90d", e.currentTarget),
              children: "90D"
            }), /* @__PURE__ */ jsx("button", {
              className: "date-btn active",
              onClick: (e) => window._dashboardSetRange?.("monthly", e.currentTarget),
              children: "Monthly"
            }), /* @__PURE__ */ jsxs("div", {
              className: "custom-range-wrap",
              children: [/* @__PURE__ */ jsx("button", {
                className: "date-btn",
                id: "custom-range-btn",
                onClick: (e) => window._dashboardToggleCustomRange?.(e.currentTarget),
                children: "Custom"
              }), /* @__PURE__ */ jsxs("div", {
                className: "custom-range-popup",
                id: "custom-range-popup",
                children: [/* @__PURE__ */ jsx("label", {
                  children: "From"
                }), /* @__PURE__ */ jsx("input", {
                  type: "date",
                  id: "custom-start"
                }), /* @__PURE__ */ jsx("label", {
                  children: "To"
                }), /* @__PURE__ */ jsx("input", {
                  type: "date",
                  id: "custom-end"
                }), /* @__PURE__ */ jsx("button", {
                  className: "apply-btn",
                  onClick: () => window._dashboardApplyCustomRange?.(),
                  children: "Apply"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("button", {
            className: "export-btn",
            onClick: () => window._dashboardExportPDF?.(),
            children: [/* @__PURE__ */ jsxs("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/* @__PURE__ */ jsx("path", {
                d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
              }), /* @__PURE__ */ jsx("polyline", {
                points: "7 10 12 15 17 10"
              }), /* @__PURE__ */ jsx("line", {
                x1: "12",
                y1: "15",
                x2: "12",
                y2: "3"
              })]
            }), "Export PDF"]
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "content",
        id: "dashboard-content",
        children: [/* @__PURE__ */ jsx("div", {
          className: "tab-content active",
          id: "tab-overview"
        }), /* @__PURE__ */ jsx("div", {
          className: "tab-content",
          id: "tab-ads"
        }), /* @__PURE__ */ jsx("div", {
          className: "tab-content",
          id: "tab-leads"
        }), /* @__PURE__ */ jsx("div", {
          className: "tab-content",
          id: "tab-roi"
        })]
      })]
    })]
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _app_dashboard,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
function shouldRevalidate({
  formAction
}) {
  if (formAction) return true;
  return false;
}
async function loader$3({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());
  const {
    data: profile
  } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";
  const {
    data: clientAccess
  } = await supabase.from("msg_client_users").select("client_id, role, msg_clients(id, name, slug, status, ghl_location_id)").eq("user_id", user.id);
  if (!isAdmin && (!clientAccess || clientAccess.length === 0)) {
    return Response.redirect(new URL("/dashboard", request.url).toString());
  }
  const allClientData = {};
  const clientList = (clientAccess || []).map((ca) => ca.msg_clients).filter(Boolean);
  for (const client of clientList) {
    const [brand, offers, faqs, locations, services, blocked, suggested, convLogs, trainingExamples] = await Promise.all([supabase.from("msg_brand_config").select("*").eq("client_id", client.id).single(), supabase.from("msg_offers").select("*").eq("client_id", client.id).order("is_active", {
      ascending: false
    }).order("updated_at", {
      ascending: false
    }), supabase.from("msg_faqs").select("*").eq("client_id", client.id).order("times_used", {
      ascending: false
    }), supabase.from("msg_locations").select("*").eq("client_id", client.id).order("name"), supabase.from("msg_services").select("*").eq("client_id", client.id).order("name"), supabase.from("msg_blocked_topics").select("*").eq("client_id", client.id), supabase.from("msg_learned_patterns").select("*").eq("client_id", client.id).eq("status", "pending_review"), supabase.from("msg_conversation_logs").select("*").eq("client_id", client.id).order("created_at", {
      ascending: false
    }).limit(50), supabase.from("msg_training_examples").select("*").eq("client_id", client.id).order("created_at", {
      ascending: false
    })]);
    allClientData[client.slug] = {
      client,
      brand: brand.data,
      offers: offers.data || [],
      faqs: faqs.data || [],
      locations: locations.data || [],
      services: services.data || [],
      blocked: blocked.data || [],
      suggested: suggested.data || [],
      conversations: {
        logs: convLogs.data || [],
        total: convLogs.data?.length || 0
      },
      trainingExamples: trainingExamples.data || []
    };
  }
  return {
    isAdmin,
    clients: clientAccess || [],
    userId: user.id,
    allClientData
  };
}
const HUB_CSS = `
.hub-wrap { display: flex; min-height: 100vh; font-family: 'Montserrat', sans-serif; background: #f5f0e8; }
.hub-sidebar {
  width: 240px; background: #fff; border-right: 1px solid #ddd5c4;
  position: fixed; top: 0; left: 0; bottom: 0;
  display: flex; flex-direction: column; z-index: 40;
  transition: transform 0.25s ease;
}
.hub-overlay { display: none; }
.hub-hamburger { display: none; }
.hub-close-btn { display: none; }
.hub-main { margin-left: 240px; flex: 1; min-height: 100vh; padding: 32px; overflow-y: auto; }

@media (max-width: 768px) {
  .hub-sidebar {
    transform: translateX(-100%);
    width: 280px;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15);
  }
  .hub-sidebar.open { transform: translateX(0); }
  .hub-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 35; }
  .hub-overlay.open { display: block; }
  .hub-close-btn { display: block; }
  .hub-hamburger {
    display: flex; align-items: center; justify-content: center;
    position: fixed; top: 12px; right: 12px; z-index: 50;
    width: 40px; height: 40px; border-radius: 8px;
    background: #fff; border: 1px solid #ddd5c4; cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .hub-main { margin-left: 0; padding: 16px; padding-top: 16px; }
}

/* Responsive tables */
.hub-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 768px) {
  .hub-table-wrap table { min-width: 640px; }
}

/* Responsive grids */
.hub-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.hub-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.hub-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.hub-grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
@media (max-width: 768px) {
  .hub-grid-2, .hub-grid-3, .hub-grid-4 { grid-template-columns: 1fr; }
  .hub-grid-cards { grid-template-columns: 1fr; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .hub-grid-4 { grid-template-columns: repeat(2, 1fr); }
}

/* Responsive form rows */
.hub-form-row { display: flex; gap: 8px; align-items: flex-end; }
@media (max-width: 768px) {
  .hub-form-row { flex-direction: column; align-items: stretch; }
  .hub-form-row input, .hub-form-row button { width: 100%; }
}

/* Responsive action buttons */
.hub-actions { display: flex; gap: 8px; flex-shrink: 0; }
@media (max-width: 768px) {
  .hub-card-layout { flex-direction: column !important; }
  .hub-actions { margin-top: 12px; }
}

/* Responsive page header */
.hub-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
@media (max-width: 480px) {
  .hub-page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
}

/* Escalation resolve row */
.hub-resolve-row { display: flex; gap: 8px; align-items: flex-end; }
@media (max-width: 768px) {
  .hub-resolve-row { flex-direction: column; align-items: stretch; }
}
`;
const _app_hub = UNSAFE_withComponentProps(function HubLayout() {
  const {
    isAdmin,
    clients
  } = useLoaderData();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx("style", {
      dangerouslySetInnerHTML: {
        __html: HUB_CSS
      }
    }), /* @__PURE__ */ jsxs("div", {
      className: "hub-wrap",
      children: [/* @__PURE__ */ jsx("button", {
        className: "hub-hamburger",
        onClick: () => setMenuOpen(true),
        "aria-label": "Menu",
        children: /* @__PURE__ */ jsxs("svg", {
          width: "20",
          height: "20",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "#3b3b3b",
          strokeWidth: "2",
          strokeLinecap: "round",
          children: [/* @__PURE__ */ jsx("line", {
            x1: "3",
            y1: "6",
            x2: "21",
            y2: "6"
          }), /* @__PURE__ */ jsx("line", {
            x1: "3",
            y1: "12",
            x2: "21",
            y2: "12"
          }), /* @__PURE__ */ jsx("line", {
            x1: "3",
            y1: "18",
            x2: "21",
            y2: "18"
          })]
        })
      }), /* @__PURE__ */ jsx("div", {
        className: `hub-overlay ${menuOpen ? "open" : ""}`,
        onClick: () => setMenuOpen(false)
      }), /* @__PURE__ */ jsxs("nav", {
        className: `hub-sidebar ${menuOpen ? "open" : ""}`,
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            padding: "24px 24px 20px",
            borderBottom: "1px solid #ddd5c4",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                color: "#3b3b3b"
              },
              children: "Media Waffle"
            }), /* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#c4a882",
                marginTop: 4
              },
              children: "AI Messaging Hub"
            })]
          }), /* @__PURE__ */ jsx("button", {
            className: "hub-close-btn",
            onClick: () => setMenuOpen(false),
            "aria-label": "Close menu",
            style: {
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4
            },
            children: /* @__PURE__ */ jsxs("svg", {
              width: "20",
              height: "20",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "#3b3b3b",
              strokeWidth: "2",
              strokeLinecap: "round",
              children: [/* @__PURE__ */ jsx("line", {
                x1: "18",
                y1: "6",
                x2: "6",
                y2: "18"
              }), /* @__PURE__ */ jsx("line", {
                x1: "6",
                y1: "6",
                x2: "18",
                y2: "18"
              })]
            })
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            padding: "16px 12px",
            flex: 1,
            overflowY: "auto"
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: sectionLabel,
            children: "Admin"
          }), isAdmin && /* @__PURE__ */ jsxs(Fragment, {
            children: [/* @__PURE__ */ jsxs(NavLink, {
              prefetch: "intent",
              to: "/hub/admin/clients",
              style: ({
                isActive
              }) => navStyle(isActive),
              children: [/* @__PURE__ */ jsx(NavIcon, {
                d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
              }), "All Clients"]
            }), /* @__PURE__ */ jsxs(NavLink, {
              prefetch: "intent",
              to: "/hub/admin/onboarding",
              style: ({
                isActive
              }) => navStyle(isActive),
              children: [/* @__PURE__ */ jsx(NavIcon, {
                d: "M12 5v14m-7-7h14"
              }), "New Client"]
            })]
          }), /* @__PURE__ */ jsx("div", {
            style: {
              ...sectionLabel,
              marginTop: 16
            },
            children: "Select Client"
          }), /* @__PURE__ */ jsx("div", {
            style: {
              padding: "0 4px",
              marginBottom: 8
            },
            children: /* @__PURE__ */ jsxs("select", {
              style: {
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #ddd5c4",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "'Montserrat', sans-serif",
                background: "#faf8f5",
                color: "#3b3b3b",
                cursor: "pointer"
              },
              value: (() => {
                const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
                const match = clients.find((ca) => ca.msg_clients && currentPath.startsWith(`/hub/${ca.msg_clients.slug}`));
                return match?.msg_clients?.slug || "";
              })(),
              onChange: (e) => {
                if (e.target.value) window.location.href = `/hub/${e.target.value}/brand`;
              },
              children: [/* @__PURE__ */ jsx("option", {
                value: "",
                children: "-- Select client --"
              }), clients.map((ca) => {
                const client = ca.msg_clients;
                if (!client) return null;
                return /* @__PURE__ */ jsx("option", {
                  value: client.slug,
                  children: client.name
                }, client.id);
              })]
            })
          }), (() => {
            const activeClient = clients.find((ca) => {
              const c = ca.msg_clients;
              if (!c) return false;
              const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
              return currentPath.startsWith(`/hub/${c.slug}`);
            });
            if (!activeClient) return null;
            const client = activeClient.msg_clients;
            return /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  ...sectionLabel,
                  marginTop: 16
                },
                children: client.name
              }), /* @__PURE__ */ jsxs(NavLink, {
                prefetch: "render",
                to: `/hub/${client.slug}/brand`,
                style: ({
                  isActive
                }) => navStyle(isActive),
                children: [/* @__PURE__ */ jsx(NavIcon, {
                  d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"
                }), "Brand Identity"]
              }), /* @__PURE__ */ jsxs(NavLink, {
                prefetch: "render",
                to: `/hub/${client.slug}/settings`,
                style: ({
                  isActive
                }) => navStyle(isActive),
                children: [/* @__PURE__ */ jsx(NavIcon, {
                  d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                }), "Settings"]
              }), /* @__PURE__ */ jsxs(NavLink, {
                prefetch: "render",
                to: `/hub/${client.slug}/locations`,
                style: ({
                  isActive
                }) => navStyle(isActive),
                children: [/* @__PURE__ */ jsx(NavIcon, {
                  d: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                }), "Locations"]
              }), /* @__PURE__ */ jsxs(NavLink, {
                prefetch: "render",
                to: `/hub/${client.slug}/offers`,
                style: ({
                  isActive
                }) => navStyle(isActive),
                children: [/* @__PURE__ */ jsx(NavIcon, {
                  text: "$"
                }), "Offers & Services"]
              }), /* @__PURE__ */ jsxs(NavLink, {
                prefetch: "render",
                to: `/hub/${client.slug}/training`,
                style: ({
                  isActive
                }) => navStyle(isActive),
                children: [/* @__PURE__ */ jsx(NavIcon, {
                  d: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"
                }), "AI Training"]
              }), /* @__PURE__ */ jsxs(NavLink, {
                prefetch: "render",
                to: `/hub/${client.slug}/conversations`,
                style: ({
                  isActive
                }) => navStyle(isActive),
                children: [/* @__PURE__ */ jsx(NavIcon, {
                  d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                }), "Conversations"]
              }), /* @__PURE__ */ jsxs(NavLink, {
                prefetch: "render",
                to: `/hub/${client.slug}/escalations`,
                style: ({
                  isActive
                }) => navStyle(isActive),
                children: [/* @__PURE__ */ jsx(NavIcon, {
                  d: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                }), "Escalations"]
              }), /* @__PURE__ */ jsxs(NavLink, {
                prefetch: "render",
                to: `/hub/${client.slug}/faqs`,
                style: ({
                  isActive
                }) => navStyle(isActive),
                children: [/* @__PURE__ */ jsx(NavIcon, {
                  text: "?"
                }), "FAQs"]
              })]
            });
          })()]
        }), /* @__PURE__ */ jsx("div", {
          style: {
            padding: "16px 16px",
            borderTop: "1px solid #ddd5c4"
          },
          children: /* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 10,
              color: "#bbb",
              fontWeight: 500
            },
            children: "Powered by Media Waffle"
          })
        })]
      }), /* @__PURE__ */ jsx("main", {
        className: "hub-main",
        children: /* @__PURE__ */ jsx(Outlet, {
          context: {
            allClientData: useLoaderData().allClientData
          }
        })
      })]
    })]
  });
});
function NavIcon({
  d,
  text
}) {
  if (text) {
    return /* @__PURE__ */ jsx("span", {
      style: {
        width: 18,
        height: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 16,
        fontWeight: 400,
        fontFamily: "'Montserrat', sans-serif"
      },
      children: text
    });
  }
  return /* @__PURE__ */ jsx("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0
    },
    children: /* @__PURE__ */ jsx("path", {
      d
    })
  });
}
const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: "#aaa",
  padding: "16px 12px 6px"
};
function navStyle(isActive) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? "white" : "#5a5a5a",
    background: isActive ? "#3b3b3b" : "transparent",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: 2
  };
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _app_hub,
  loader: loader$3,
  shouldRevalidate
}, Symbol.toStringTag, { value: "Module" }));
function loader$2({
  request
}) {
  return Response.redirect(new URL("/hub/admin/clients", request.url).toString());
}
const _app_hub__index = UNSAFE_withComponentProps(function HubIndex() {
  return null;
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _app_hub__index,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());
  const {
    data: clients
  } = await supabase.from("msg_clients").select("*").order("name");
  const [convRes, faqRes] = await Promise.all([supabase.from("msg_conversation_logs").select("client_id, action"), supabase.from("msg_faqs").select("client_id").eq("is_active", true)]);
  const stats = {};
  for (const c of clients || []) {
    const convs = (convRes.data || []).filter((r) => r.client_id === c.id);
    stats[c.id] = {
      total: convs.length,
      escalations: convs.filter((r) => r.action === "escalated").length,
      lost: convs.filter((r) => r.action === "mark_lost").length,
      faqs: (faqRes.data || []).filter((r) => r.client_id === c.id).length
    };
  }
  return {
    clients: clients || [],
    stats
  };
}
async function action$8({
  request
}) {
  createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "toggle_status") {
    const id = form.get("id");
    const current = form.get("status");
    const next = current === "active" ? "paused" : "active";
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_clients?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_KEY}`,
        "apikey": SB_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        status: next
      })
    });
  }
  return {
    success: true
  };
}
const _app_hub_admin_clients = UNSAFE_withComponentProps(function AdminClients2() {
  const {
    clients,
    stats
  } = useLoaderData();
  const fetcher = useFetcher();
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      className: "hub-page-header",
      style: {
        marginBottom: 32
      },
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          style: {
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: "#3b3b3b",
            margin: 0
          },
          children: "All Clients"
        }), /* @__PURE__ */ jsxs("p", {
          style: {
            color: "#8a8478",
            fontSize: 13,
            margin: "4px 0 0"
          },
          children: [clients.length, " messaging clients configured"]
        })]
      }), /* @__PURE__ */ jsx("a", {
        href: "/hub/admin/onboarding",
        style: btnPrimary$6,
        children: "+ New Client"
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "hub-grid-4",
      style: {
        marginBottom: 32
      },
      children: [{
        label: "Active Clients",
        value: clients.filter((c) => c.status === "active").length,
        color: "#2e7d32"
      }, {
        label: "Total Conversations",
        value: Object.values(stats).reduce((s, v) => s + v.total, 0),
        color: "#1565c0"
      }, {
        label: "Escalations",
        value: Object.values(stats).reduce((s, v) => s + v.escalations, 0),
        color: "#ef6c00"
      }, {
        label: "Total FAQs",
        value: Object.values(stats).reduce((s, v) => s + v.faqs, 0),
        color: "#7b1fa2"
      }].map(({
        label: label2,
        value,
        color
      }) => /* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 11,
            color: "#8a8478",
            marginBottom: 4
          },
          children: label2
        }), /* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 32,
            fontWeight: 700,
            color
          },
          children: value
        })]
      }, label2))
    }), /* @__PURE__ */ jsx("div", {
      style: {
        background: "white",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        overflow: "hidden"
      },
      children: /* @__PURE__ */ jsxs("table", {
        style: {
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          fontFamily: "'Montserrat', sans-serif"
        },
        children: [/* @__PURE__ */ jsx("thead", {
          children: /* @__PURE__ */ jsx("tr", {
            style: {
              background: "#3b3b3b",
              color: "#f5f0e8"
            },
            children: ["Client", "Status", "FAQs", "Conversations", "Escalations", "Lost", ""].map((h) => /* @__PURE__ */ jsx("th", {
              style: th,
              children: h
            }, h))
          })
        }), /* @__PURE__ */ jsx("tbody", {
          children: clients.map((c, i) => {
            const s = stats[c.id] || {};
            return /* @__PURE__ */ jsxs("tr", {
              style: {
                background: i % 2 === 0 ? "white" : "#faf8f5"
              },
              children: [/* @__PURE__ */ jsxs("td", {
                style: {
                  ...td,
                  fontWeight: 700
                },
                children: [/* @__PURE__ */ jsx("a", {
                  href: `/hub/${c.slug}/brand`,
                  style: {
                    color: "#3b3b3b",
                    textDecoration: "none"
                  },
                  children: c.name
                }), /* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 11,
                    color: "#b0a89a",
                    fontWeight: 400
                  },
                  children: c.slug
                })]
              }), /* @__PURE__ */ jsx("td", {
                style: td,
                children: /* @__PURE__ */ jsx("span", {
                  style: {
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: c.status === "active" ? "#e8f5e9" : "#fff3e0",
                    color: c.status === "active" ? "#2e7d32" : "#ef6c00"
                  },
                  children: c.status
                })
              }), /* @__PURE__ */ jsx("td", {
                style: td,
                children: s.faqs
              }), /* @__PURE__ */ jsx("td", {
                style: {
                  ...td,
                  fontWeight: 600
                },
                children: s.total
              }), /* @__PURE__ */ jsx("td", {
                style: td,
                children: s.escalations > 0 ? /* @__PURE__ */ jsx("span", {
                  style: {
                    color: "#ef6c00",
                    fontWeight: 600
                  },
                  children: s.escalations
                }) : 0
              }), /* @__PURE__ */ jsx("td", {
                style: td,
                children: s.lost
              }), /* @__PURE__ */ jsx("td", {
                style: td,
                children: /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    gap: 6
                  },
                  children: [/* @__PURE__ */ jsx("a", {
                    href: `/hub/${c.slug}/brand`,
                    style: {
                      ...btnSmall$2,
                      background: "#e3f2fd",
                      color: "#1565c0",
                      textDecoration: "none"
                    },
                    children: "Manage"
                  }), /* @__PURE__ */ jsxs(fetcher.Form, {
                    method: "post",
                    children: [/* @__PURE__ */ jsx("input", {
                      type: "hidden",
                      name: "intent",
                      value: "toggle_status"
                    }), /* @__PURE__ */ jsx("input", {
                      type: "hidden",
                      name: "id",
                      value: c.id
                    }), /* @__PURE__ */ jsx("input", {
                      type: "hidden",
                      name: "status",
                      value: c.status
                    }), /* @__PURE__ */ jsx("button", {
                      type: "submit",
                      style: {
                        ...btnSmall$2,
                        background: c.status === "active" ? "#fff3e0" : "#e8f5e9",
                        color: c.status === "active" ? "#ef6c00" : "#2e7d32"
                      },
                      children: c.status === "active" ? "Pause" : "Activate"
                    })]
                  })]
                })
              })]
            }, c.id);
          })
        })]
      })
    })]
  });
});
const th = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5
};
const td = {
  padding: "12px 14px",
  borderBottom: "1px solid #eee8dc"
};
const btnPrimary$6 = {
  padding: "10px 20px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif",
  textDecoration: "none"
};
const btnSmall$2 = {
  padding: "5px 10px",
  border: "none",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8,
  default: _app_hub_admin_clients,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function loader({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());
  const {
    data: profile
  } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return Response.redirect(new URL("/hub", request.url).toString());
  return {
    userId: user.id
  };
}
async function action$7({
  request
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();
  if (!user) return {
    error: "Not authenticated"
  };
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "create_client") {
    const name = form.get("name");
    const slug = form.get("slug");
    const ghlApiKey = form.get("ghl_api_key");
    const ghlLocationId = form.get("ghl_location_id");
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    const clientRes = await fetch(`${SB_URL}/rest/v1/msg_clients`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SB_SERVICE_KEY}`,
        "apikey": SB_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        name,
        slug,
        ghl_api_key: ghlApiKey,
        ghl_location_id: ghlLocationId,
        status: "active"
      })
    });
    if (!clientRes.ok) return {
      error: await clientRes.text()
    };
    const [client] = await clientRes.json();
    if (!client) return {
      error: "Failed to create client"
    };
    const sbPost = async (table, data2) => {
      await fetch(`${SB_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SB_SERVICE_KEY}`,
          "apikey": SB_SERVICE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(data2)
      });
    };
    await sbPost("msg_brand_config", {
      client_id: client.id,
      assistant_name: form.get("assistant_name") || "Assistant",
      tone: form.get("tone") || "friendly",
      greeting_style: form.get("greeting_style") || "Hi [name]",
      phone_number: form.get("phone_number") || "",
      sms_char_limit: 160,
      sms_max_messages: 7,
      dm_max_messages: 10,
      emoji_allowed: false,
      deposit_required: false,
      post_booking_response: "Amazing, see you then!"
    });
    const defaultBlocked = [{
      topic: "Owner personal information",
      reason: "Privacy - never share owner details"
    }, {
      topic: "Staff personal information",
      reason: "Privacy - never share staff details"
    }, {
      topic: "Other lead information",
      reason: "Privacy - never reference other leads"
    }, {
      topic: "Business financials",
      reason: "Never discuss revenue or costs"
    }, {
      topic: "Medical advice",
      reason: "Never provide medical recommendations - escalate"
    }];
    for (const b of defaultBlocked) {
      await sbPost("msg_blocked_topics", {
        client_id: client.id,
        ...b
      });
    }
    await sbPost("msg_client_users", {
      client_id: client.id,
      user_id: user.id,
      role: "owner"
    });
    return {
      success: true,
      clientSlug: client.slug
    };
  }
  return {};
}
const _app_hub_admin_onboarding = UNSAFE_withComponentProps(function Onboarding() {
  const fetcher = useFetcher();
  const [step, setStep] = useState(1);
  const result = fetcher.data;
  if (result?.success) {
    return /* @__PURE__ */ jsx("div", {
      style: {
        maxWidth: 600,
        width: "100%"
      },
      children: /* @__PURE__ */ jsxs("div", {
        style: {
          background: "#e8f5e9",
          borderRadius: 12,
          padding: 32,
          textAlign: "center"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 48,
            marginBottom: 16
          },
          children: "✓"
        }), /* @__PURE__ */ jsx("h2", {
          style: {
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: "#2e7d32",
            marginBottom: 8
          },
          children: "Client Created"
        }), /* @__PURE__ */ jsx("p", {
          style: {
            color: "#666",
            marginBottom: 24
          },
          children: "Now configure their locations, offers, and FAQs."
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 12,
            justifyContent: "center"
          },
          children: [/* @__PURE__ */ jsx("a", {
            href: `/hub/${result.clientSlug}/brand`,
            style: btnPrimary$5,
            children: "Configure Brand"
          }), /* @__PURE__ */ jsx("a", {
            href: `/hub/${result.clientSlug}/locations`,
            style: {
              ...btnPrimary$5,
              background: "transparent",
              color: "#3b3b3b",
              border: "1px solid #ddd5c4"
            },
            children: "Add Locations"
          })]
        })]
      })
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 600,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsx("h1", {
      style: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: 28,
        color: "#3b3b3b",
        margin: "0 0 8px"
      },
      children: "Onboard New Client"
    }), /* @__PURE__ */ jsx("p", {
      style: {
        color: "#8a8478",
        fontSize: 13,
        marginBottom: 32
      },
      children: "Set up a new AI messaging client. You can configure details after creation."
    }), result?.error && /* @__PURE__ */ jsx("div", {
      style: {
        background: "#ffebee",
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        color: "#c62828",
        fontSize: 13
      },
      children: result.error
    }), /* @__PURE__ */ jsxs(fetcher.Form, {
      method: "post",
      children: [/* @__PURE__ */ jsx("input", {
        type: "hidden",
        name: "intent",
        value: "create_client"
      }), /* @__PURE__ */ jsxs(Card$2, {
        title: "Step 1: Business Details",
        step: 1,
        current: step,
        children: [/* @__PURE__ */ jsx(Field$2, {
          label: "Business Name",
          name: "name",
          required: true,
          hint: "e.g. MB Luxury Spa"
        }), /* @__PURE__ */ jsx(Field$2, {
          label: "Slug (URL-safe)",
          name: "slug",
          required: true,
          hint: "e.g. mb-luxury (lowercase, hyphens only)"
        }), /* @__PURE__ */ jsx(Field$2, {
          label: "Phone Number",
          name: "phone_number",
          hint: "Business phone for leads to call/text"
        }), /* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 8
          },
          children: /* @__PURE__ */ jsx("button", {
            type: "button",
            onClick: () => setStep(2),
            style: btnPrimary$5,
            children: "Next"
          })
        })]
      }), /* @__PURE__ */ jsxs(Card$2, {
        title: "Step 2: GoHighLevel Integration",
        step: 2,
        current: step,
        children: [/* @__PURE__ */ jsx(Field$2, {
          label: "GHL API Key",
          name: "ghl_api_key",
          required: true,
          hint: "API key for this location"
        }), /* @__PURE__ */ jsx(Field$2, {
          label: "GHL Location ID",
          name: "ghl_location_id",
          required: true,
          hint: "Location ID from GHL"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8
          },
          children: [/* @__PURE__ */ jsx("button", {
            type: "button",
            onClick: () => setStep(1),
            style: {
              ...btnPrimary$5,
              background: "transparent",
              color: "#3b3b3b",
              border: "1px solid #ddd5c4"
            },
            children: "Back"
          }), /* @__PURE__ */ jsx("button", {
            type: "button",
            onClick: () => setStep(3),
            style: btnPrimary$5,
            children: "Next"
          })]
        })]
      }), /* @__PURE__ */ jsxs(Card$2, {
        title: "Step 3: AI Assistant",
        step: 3,
        current: step,
        children: [/* @__PURE__ */ jsx(Field$2, {
          label: "Assistant Name",
          name: "assistant_name",
          hint: "e.g. Cassie, Sophie, Mia"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle$4,
            children: "Tone"
          }), /* @__PURE__ */ jsxs("select", {
            name: "tone",
            style: inputStyle$4,
            children: [/* @__PURE__ */ jsx("option", {
              value: "friendly",
              children: "Friendly"
            }), /* @__PURE__ */ jsx("option", {
              value: "professional",
              children: "Professional"
            }), /* @__PURE__ */ jsx("option", {
              value: "casual",
              children: "Casual"
            })]
          })]
        }), /* @__PURE__ */ jsx(Field$2, {
          label: "Greeting Style",
          name: "greeting_style",
          hint: "Use [name] for the lead's first name. e.g. Hi [name]"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8
          },
          children: [/* @__PURE__ */ jsx("button", {
            type: "button",
            onClick: () => setStep(2),
            style: {
              ...btnPrimary$5,
              background: "transparent",
              color: "#3b3b3b",
              border: "1px solid #ddd5c4"
            },
            children: "Back"
          }), /* @__PURE__ */ jsx("button", {
            type: "submit",
            style: {
              ...btnPrimary$5,
              background: "#2e7d32"
            },
            children: "Create Client"
          })]
        })]
      })]
    })]
  });
});
function Card$2({
  title,
  step,
  current,
  children
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      background: "white",
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      display: step === current ? "block" : "none"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 20
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#3b3b3b",
          color: "#f5f0e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700
        },
        children: step
      }), /* @__PURE__ */ jsx("h3", {
        style: {
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "#3b3b3b",
          margin: 0
        },
        children: title
      })]
    }), children]
  });
}
function Field$2({
  label: label2,
  name,
  required,
  hint
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginBottom: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelStyle$4,
      children: label2
    }), /* @__PURE__ */ jsx("input", {
      name,
      required,
      style: inputStyle$4
    }), hint && /* @__PURE__ */ jsx("div", {
      style: {
        fontSize: 11,
        color: "#8a8478",
        marginTop: 4
      },
      children: hint
    })]
  });
}
const labelStyle$4 = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#3b3b3b",
  marginBottom: 6
};
const inputStyle$4 = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd5c4",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif",
  background: "#faf8f5",
  boxSizing: "border-box"
};
const btnPrimary$5 = {
  padding: "10px 20px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif",
  textDecoration: "none"
};
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7,
  default: _app_hub_admin_onboarding,
  loader
}, Symbol.toStringTag, { value: "Module" }));
async function action$6({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const {
    data: client
  } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {
    error: "Client not found"
  };
  if (intent === "save_brand") {
    const updates = {};
    for (const [key, value] of form.entries()) {
      if (key === "intent") continue;
      updates[key] = value;
    }
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    const res = await fetch(`${SB_URL}/rest/v1/msg_brand_config?client_id=eq.${client.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_SERVICE_KEY}`,
        "apikey": SB_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errText = await res.text();
      return {
        error: `Save failed: ${errText}`
      };
    }
    return {
      success: true
    };
  }
  if (intent === "save_rules") {
    const rulesJson = form.get("rules");
    await supabase.from("msg_brand_config").update({
      custom_rules: rulesJson
    }).eq("client_id", client.id);
    return {
      success: true
    };
  }
  if (intent === "add_blocked") {
    await supabase.from("msg_blocked_topics").insert({
      client_id: client.id,
      topic: form.get("topic"),
      reason: form.get("reason") || null
    });
    return {
      success: true
    };
  }
  if (intent === "update_blocked") {
    await supabase.from("msg_blocked_topics").update({
      topic: form.get("topic"),
      reason: form.get("reason") || null
    }).eq("id", form.get("id"));
    return {
      success: true
    };
  }
  if (intent === "remove_blocked") {
    await supabase.from("msg_blocked_topics").delete().eq("id", form.get("id"));
    return {
      success: true
    };
  }
  return {};
}
const _app_hub_$slug_brand = UNSAFE_withComponentProps(function BrandIdentity() {
  const {
    allClientData
  } = useOutletContext();
  const {
    slug
  } = useParams();
  const data2 = allClientData[slug] || {};
  const client = data2.client || {};
  const brand = data2.brand || {};
  const blocked = data2.blocked || [];
  const fetcher = useFetcher();
  const [saved, setSaved] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("intent", "save_brand");
    fetcher.submit(formData, {
      method: "post"
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2e3);
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 720,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsx("div", {
      className: "hub-page-header",
      children: /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          style: {
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: "#3b3b3b",
            margin: 0
          },
          children: "Brand Identity"
        }), /* @__PURE__ */ jsx("p", {
          style: {
            color: "#8a8478",
            fontSize: 13,
            margin: "4px 0 0"
          },
          children: client.name
        })]
      })
    }), /* @__PURE__ */ jsxs("form", {
      onSubmit: handleSubmit,
      children: [/* @__PURE__ */ jsxs(Card$1, {
        title: "Assistant Identity",
        children: [/* @__PURE__ */ jsx(Field$1, {
          label: "Assistant Name",
          name: "assistant_name",
          value: brand?.assistant_name || "",
          hint: "The name your AI assistant uses (e.g. Cassie)"
        }), /* @__PURE__ */ jsx(TextArea$1, {
          label: "Brand Voice",
          name: "tone",
          value: brand?.tone || "friendly",
          rows: 3,
          hint: "Describe how the assistant should sound (e.g. friendly, warm and professional, keeps it brief)"
        }), /* @__PURE__ */ jsx(Field$1, {
          label: "Greeting Style",
          name: "greeting_style",
          value: brand?.greeting_style || "Hi [name]",
          hint: "Use [name] as placeholder for lead's first name"
        })]
      }), /* @__PURE__ */ jsx(Card$1, {
        title: "Response Behaviour",
        children: /* @__PURE__ */ jsx(Field$1, {
          label: "Post-Booking Response",
          name: "post_booking_response",
          value: brand?.post_booking_response || "",
          hint: "What to say when a lead confirms they booked"
        })
      }), /* @__PURE__ */ jsx("button", {
        type: "submit",
        style: {
          ...btnPrimary$4,
          marginBottom: 32,
          background: saved ? "#2e7d32" : "#3b3b3b",
          transition: "all 0.3s"
        },
        children: saved ? "✓ Saved" : fetcher.state === "submitting" ? "Saving..." : "Save Brand Identity"
      })]
    }), /* @__PURE__ */ jsx(RulesSection, {
      brand,
      blocked
    })]
  });
});
function RulesSection({
  brand,
  blocked
}) {
  const fetcher = useFetcher();
  const parseRules = () => {
    const raw = brand?.custom_rules;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [];
  };
  const [rules, setRules] = useState(parseRules());
  const [addingRule, setAddingRule] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [editingRule, setEditingRule] = useState(null);
  const [editRuleText, setEditRuleText] = useState("");
  const [addingBlocked, setAddingBlocked] = useState(false);
  const [editingBlocked, setEditingBlocked] = useState(null);
  const [editBlockedTopic, setEditBlockedTopic] = useState("");
  const [editBlockedReason, setEditBlockedReason] = useState("");
  const saveRules = (updated) => {
    setRules(updated);
    const formData = new FormData();
    formData.set("intent", "save_rules");
    formData.set("rules", JSON.stringify(updated));
    fetcher.submit(formData, {
      method: "post"
    });
  };
  const addRule = () => {
    if (!newRule.trim()) return;
    saveRules([...rules, newRule.trim()]);
    setNewRule("");
    setAddingRule(false);
  };
  const updateRule = (idx) => {
    if (!editRuleText.trim()) return;
    const updated = [...rules];
    updated[idx] = editRuleText.trim();
    saveRules(updated);
    setEditingRule(null);
  };
  const deleteRule = (idx) => {
    saveRules(rules.filter((_, i) => i !== idx));
  };
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs(Card$1, {
      title: "Conversation Rules",
      children: [/* @__PURE__ */ jsx("p", {
        style: {
          fontSize: 12,
          color: "#8a8478",
          marginBottom: 16
        },
        children: "Behavioural instructions that control how the AI responds. These are injected directly into the system prompt."
      }), rules.length === 0 && !addingRule && /* @__PURE__ */ jsx("div", {
        style: {
          padding: 20,
          textAlign: "center",
          color: "#b0a89a",
          fontSize: 13
        },
        children: "No custom rules yet"
      }), rules.map((rule, idx) => /* @__PURE__ */ jsx("div", {
        style: ruleRow,
        children: editingRule === idx ? /* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1
          },
          children: [/* @__PURE__ */ jsx("textarea", {
            value: editRuleText,
            onChange: (e) => setEditRuleText(e.target.value),
            rows: 2,
            style: {
              ...inputStyle$3,
              resize: "vertical",
              marginBottom: 8
            },
            autoFocus: true
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 8
            },
            children: [/* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => updateRule(idx),
              style: btnSave,
              children: "Save"
            }), /* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => setEditingRule(null),
              style: btnCancel,
              children: "Cancel"
            })]
          })]
        }) : /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              flex: 1,
              fontSize: 13,
              color: "#3b3b3b",
              lineHeight: 1.5
            },
            children: rule
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 6,
              flexShrink: 0,
              marginLeft: 12
            },
            children: [/* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => {
                setEditingRule(idx);
                setEditRuleText(rule);
              },
              style: btnEdit,
              children: "Edit"
            }), /* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => {
                if (confirm("Delete this rule?")) deleteRule(idx);
              },
              style: btnDelete,
              children: "Delete"
            })]
          })]
        })
      }, idx)), addingRule ? /* @__PURE__ */ jsxs("div", {
        style: {
          marginTop: 12
        },
        children: [/* @__PURE__ */ jsx("textarea", {
          value: newRule,
          onChange: (e) => setNewRule(e.target.value),
          rows: 2,
          placeholder: "e.g. Always ask about their preferred appointment time",
          style: {
            ...inputStyle$3,
            resize: "vertical",
            marginBottom: 8
          },
          autoFocus: true
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 8
          },
          children: [/* @__PURE__ */ jsx("button", {
            type: "button",
            onClick: addRule,
            style: btnSave,
            children: "Add Rule"
          }), /* @__PURE__ */ jsx("button", {
            type: "button",
            onClick: () => {
              setAddingRule(false);
              setNewRule("");
            },
            style: btnCancel,
            children: "Cancel"
          })]
        })]
      }) : /* @__PURE__ */ jsx("button", {
        type: "button",
        onClick: () => setAddingRule(true),
        style: {
          ...btnPrimary$4,
          marginTop: 12
        },
        children: "Add Rule"
      })]
    }), /* @__PURE__ */ jsxs(Card$1, {
      title: "Blocked Topics",
      children: [/* @__PURE__ */ jsx("p", {
        style: {
          fontSize: 12,
          color: "#8a8478",
          marginBottom: 16
        },
        children: "Topics the AI must never discuss with leads. If a lead asks about these, the AI will deflect or escalate."
      }), blocked.length === 0 && !addingBlocked && /* @__PURE__ */ jsx("div", {
        style: {
          padding: 20,
          textAlign: "center",
          color: "#b0a89a",
          fontSize: 13
        },
        children: "No blocked topics yet"
      }), blocked.map((b) => /* @__PURE__ */ jsx("div", {
        style: ruleRow,
        children: editingBlocked === b.id ? /* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              marginBottom: 8
            },
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSmall,
              children: "Topic"
            }), /* @__PURE__ */ jsx("input", {
              value: editBlockedTopic,
              onChange: (e) => setEditBlockedTopic(e.target.value),
              style: inputStyle$3,
              autoFocus: true
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              marginBottom: 8
            },
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSmall,
              children: "Reason (optional)"
            }), /* @__PURE__ */ jsx("input", {
              value: editBlockedReason,
              onChange: (e) => setEditBlockedReason(e.target.value),
              style: inputStyle$3
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 8
            },
            children: [/* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => {
                if (!editBlockedTopic.trim()) return;
                const formData = new FormData();
                formData.set("intent", "update_blocked");
                formData.set("id", b.id);
                formData.set("topic", editBlockedTopic.trim());
                formData.set("reason", editBlockedReason.trim());
                fetcher.submit(formData, {
                  method: "post"
                });
                setEditingBlocked(null);
              },
              style: btnSave,
              children: "Save"
            }), /* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => setEditingBlocked(null),
              style: btnCancel,
              children: "Cancel"
            })]
          })]
        }) : /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              flex: 1
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontWeight: 600,
                fontSize: 13,
                color: "#3b3b3b"
              },
              children: b.topic
            }), b.reason && /* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 12,
                color: "#8a8478",
                marginTop: 2
              },
              children: b.reason
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 6,
              flexShrink: 0,
              marginLeft: 12
            },
            children: [/* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => {
                setEditingBlocked(b.id);
                setEditBlockedTopic(b.topic);
                setEditBlockedReason(b.reason || "");
              },
              style: btnEdit,
              children: "Edit"
            }), /* @__PURE__ */ jsx("button", {
              type: "button",
              onClick: () => {
                if (!confirm("Delete this blocked topic?")) return;
                const formData = new FormData();
                formData.set("intent", "remove_blocked");
                formData.set("id", b.id);
                fetcher.submit(formData, {
                  method: "post"
                });
              },
              style: btnDelete,
              children: "Delete"
            })]
          })]
        })
      }, b.id)), addingBlocked ? /* @__PURE__ */ jsx(AddBlockedForm, {
        onSave: (topic, reason) => {
          const formData = new FormData();
          formData.set("intent", "add_blocked");
          formData.set("topic", topic);
          formData.set("reason", reason);
          fetcher.submit(formData, {
            method: "post"
          });
          setAddingBlocked(false);
        },
        onCancel: () => setAddingBlocked(false)
      }) : /* @__PURE__ */ jsx("button", {
        type: "button",
        onClick: () => setAddingBlocked(true),
        style: {
          ...btnPrimary$4,
          marginTop: 12
        },
        children: "Add Blocked Topic"
      })]
    })]
  });
}
function AddBlockedForm({
  onSave,
  onCancel
}) {
  const [topic, setTopic] = useState("");
  const [reason, setReason] = useState("");
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginTop: 12
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        marginBottom: 8
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSmall,
        children: "Topic"
      }), /* @__PURE__ */ jsx("input", {
        value: topic,
        onChange: (e) => setTopic(e.target.value),
        placeholder: "e.g. Competitor pricing",
        style: inputStyle$3,
        autoFocus: true
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        marginBottom: 8
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSmall,
        children: "Reason (optional)"
      }), /* @__PURE__ */ jsx("input", {
        value: reason,
        onChange: (e) => setReason(e.target.value),
        placeholder: "Why this topic is blocked",
        style: inputStyle$3
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        gap: 8
      },
      children: [/* @__PURE__ */ jsx("button", {
        type: "button",
        onClick: () => {
          if (topic.trim()) onSave(topic.trim(), reason.trim());
        },
        style: btnSave,
        children: "Add Topic"
      }), /* @__PURE__ */ jsx("button", {
        type: "button",
        onClick: onCancel,
        style: btnCancel,
        children: "Cancel"
      })]
    })]
  });
}
function Card$1({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      background: "white",
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
    },
    children: [/* @__PURE__ */ jsx("h3", {
      style: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: 16,
        color: "#3b3b3b",
        marginTop: 0,
        marginBottom: 16
      },
      children: title
    }), children]
  });
}
function Field$1({
  label: label2,
  name,
  value,
  hint,
  type
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginBottom: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelStyle$3,
      children: label2
    }), /* @__PURE__ */ jsx("input", {
      name,
      defaultValue: value,
      type: type || "text",
      style: inputStyle$3
    }), hint && /* @__PURE__ */ jsx("div", {
      style: hintStyle$1,
      children: hint
    })]
  });
}
function TextArea$1({
  label: label2,
  name,
  value,
  hint,
  rows
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginBottom: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelStyle$3,
      children: label2
    }), /* @__PURE__ */ jsx("textarea", {
      name,
      defaultValue: value,
      rows: rows || 3,
      style: {
        ...inputStyle$3,
        resize: "vertical",
        minHeight: 60
      }
    }), hint && /* @__PURE__ */ jsx("div", {
      style: hintStyle$1,
      children: hint
    })]
  });
}
const ruleRow = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: "12px 0",
  borderBottom: "1px solid #eee8dc"
};
const labelStyle$3 = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#3b3b3b",
  marginBottom: 6
};
const labelSmall = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#8a8478",
  marginBottom: 4
};
const inputStyle$3 = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd5c4",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif",
  background: "#faf8f5",
  boxSizing: "border-box"
};
const hintStyle$1 = {
  fontSize: 11,
  color: "#8a8478",
  marginTop: 4
};
const btnPrimary$4 = {
  padding: "10px 20px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const btnEdit = {
  padding: "5px 12px",
  background: "#eee8dc",
  color: "#3b3b3b",
  border: "none",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const btnDelete = {
  padding: "5px 12px",
  background: "#ffebee",
  color: "#c62828",
  border: "none",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const btnSave = {
  padding: "8px 16px",
  background: "#2e7d32",
  color: "white",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const btnCancel = {
  padding: "8px 16px",
  background: "#f5f5f5",
  color: "#666",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: _app_hub_$slug_brand
}, Symbol.toStringTag, { value: "Module" }));
async function action$5({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const {
    data: client
  } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {
    error: "Client not found"
  };
  if (intent === "save_settings") {
    const updates = {};
    for (const [key, value] of form.entries()) {
      if (key === "intent") continue;
      if (key === "emoji_allowed" || key === "sms_emoji_allowed" || key === "deposit_required") updates[key] = value === "true";
      else if (key === "sms_char_limit" || key === "sms_max_messages" || key === "dm_max_messages") updates[key] = parseInt(value) || 0;
      else updates[key] = value;
    }
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    const res = await fetch(`${SB_URL}/rest/v1/msg_brand_config?client_id=eq.${client.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_SERVICE_KEY}`,
        "apikey": SB_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errText = await res.text();
      return {
        error: `Save failed: ${errText}`
      };
    }
    return {
      success: true
    };
  }
  return {};
}
const _app_hub_$slug_settings = UNSAFE_withComponentProps(function Settings() {
  const {
    allClientData
  } = useOutletContext();
  const {
    slug
  } = useParams();
  const data2 = allClientData[slug] || {};
  const client = data2.client || {};
  const brand = data2.brand || {};
  const fetcher = useFetcher();
  const [saved, setSaved] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("intent", "save_settings");
    fetcher.submit(formData, {
      method: "post"
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2e3);
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 720,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsx("div", {
      className: "hub-page-header",
      children: /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          style: {
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: "#3b3b3b",
            margin: 0
          },
          children: "Settings"
        }), /* @__PURE__ */ jsx("p", {
          style: {
            color: "#8a8478",
            fontSize: 13,
            margin: "4px 0 0"
          },
          children: client.name
        })]
      })
    }), /* @__PURE__ */ jsxs("form", {
      onSubmit: handleSubmit,
      children: [/* @__PURE__ */ jsxs(Card, {
        title: "Contact Details",
        children: [/* @__PURE__ */ jsx(Field, {
          label: "Phone Number",
          name: "phone_number",
          value: brand?.phone_number || ""
        }), /* @__PURE__ */ jsx(Field, {
          label: "Escalation Phone",
          name: "escalation_phone",
          value: brand?.escalation_phone || "",
          hint: "Phone number for escalation messages"
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        title: "Message Limits",
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 20
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "#3b3b3b",
              marginBottom: 12
            },
            children: "SMS"
          }), /* @__PURE__ */ jsxs("div", {
            className: "hub-grid-2",
            children: [/* @__PURE__ */ jsx(Field, {
              label: "Character Limit",
              name: "sms_char_limit",
              value: brand?.sms_char_limit || 160,
              type: "number"
            }), /* @__PURE__ */ jsx(Field, {
              label: "Max Messages",
              name: "sms_max_messages",
              value: brand?.sms_max_messages || 7,
              type: "number"
            })]
          }), /* @__PURE__ */ jsx(CheckboxField, {
            label: "Allow emojis in SMS",
            name: "sms_emoji_allowed",
            checked: brand?.sms_emoji_allowed || false
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            borderTop: "1px solid #eee8dc",
            paddingTop: 20
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "#3b3b3b",
              marginBottom: 12
            },
            children: "Social Media DMs"
          }), /* @__PURE__ */ jsxs("div", {
            className: "hub-grid-2",
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 16
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle$2,
                children: "Character Limit"
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  padding: "10px 12px",
                  border: "1px solid #ddd5c4",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "#faf8f5",
                  color: "#8a8478"
                },
                children: "None"
              })]
            }), /* @__PURE__ */ jsx(Field, {
              label: "Max Messages",
              name: "dm_max_messages",
              value: brand?.dm_max_messages || 10,
              type: "number"
            })]
          }), /* @__PURE__ */ jsx(CheckboxField, {
            label: "Allow emojis in DMs",
            name: "emoji_allowed",
            checked: brand?.emoji_allowed || false
          })]
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        title: "Refund Policy",
        children: [/* @__PURE__ */ jsx(TextArea, {
          label: "Refund Policy",
          name: "refund_policy",
          value: brand?.refund_policy || "",
          hint: "The refund policy the AI will reference when leads ask about refunds"
        }), /* @__PURE__ */ jsx(TextArea, {
          label: "Deposit Terms",
          name: "deposit_info",
          value: brand?.deposit_info || "",
          hint: "Deposit terms the AI will reference when leads ask about deposits or payment"
        })]
      }), /* @__PURE__ */ jsx("button", {
        type: "submit",
        style: {
          ...btnPrimary$3,
          marginBottom: 32,
          background: saved ? "#2e7d32" : "#3b3b3b",
          transition: "all 0.3s"
        },
        children: saved ? "✓ Saved" : fetcher.state === "submitting" ? "Saving..." : "Save Settings"
      })]
    })]
  });
});
function Card({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      background: "white",
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
    },
    children: [/* @__PURE__ */ jsx("h3", {
      style: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: 16,
        color: "#3b3b3b",
        marginTop: 0,
        marginBottom: 16
      },
      children: title
    }), children]
  });
}
function Field({
  label: label2,
  name,
  value,
  hint,
  type
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginBottom: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelStyle$2,
      children: label2
    }), /* @__PURE__ */ jsx("input", {
      name,
      defaultValue: value,
      type: type || "text",
      style: inputStyle$2
    }), hint && /* @__PURE__ */ jsx("div", {
      style: hintStyle,
      children: hint
    })]
  });
}
function TextArea({
  label: label2,
  name,
  value,
  hint,
  rows
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginBottom: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelStyle$2,
      children: label2
    }), /* @__PURE__ */ jsx("textarea", {
      name,
      defaultValue: value,
      rows: rows || 3,
      style: {
        ...inputStyle$2,
        resize: "vertical",
        minHeight: 60
      }
    }), hint && /* @__PURE__ */ jsx("div", {
      style: hintStyle,
      children: hint
    })]
  });
}
function CheckboxField({
  label: label2,
  name,
  checked
}) {
  const [isChecked, setIsChecked] = useState(checked);
  return /* @__PURE__ */ jsx("div", {
    style: {
      marginBottom: 16
    },
    children: /* @__PURE__ */ jsxs("label", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "#3b3b3b",
        cursor: "pointer"
      },
      children: [/* @__PURE__ */ jsx("input", {
        type: "hidden",
        name,
        value: isChecked ? "true" : "false"
      }), /* @__PURE__ */ jsx("input", {
        type: "checkbox",
        checked: isChecked,
        onChange: (e) => setIsChecked(e.target.checked),
        style: {
          accentColor: "#3b3b3b"
        }
      }), label2]
    })
  });
}
const labelStyle$2 = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#3b3b3b",
  marginBottom: 6
};
const inputStyle$2 = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd5c4",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif",
  background: "#faf8f5",
  boxSizing: "border-box"
};
const hintStyle = {
  fontSize: 11,
  color: "#8a8478",
  marginTop: 4
};
const btnPrimary$3 = {
  padding: "10px 20px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: _app_hub_$slug_settings
}, Symbol.toStringTag, { value: "Module" }));
function OfferCard({
  offer,
  offerTags,
  onEdit,
  fetcher
}) {
  const [newTag, setNewTag] = useState("");
  const handleRemoveTag = (tagToRemove) => {
    const remainingTags = offerTags.filter((t) => t !== tagToRemove);
    const formData = new FormData();
    formData.append("intent", "update_offer_tags");
    formData.append("id", offer.id);
    formData.append("trigger_tags", remainingTags.join(", "));
    fetcher.submit(formData, {
      method: "post"
    });
  };
  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const allTags = [...offerTags, newTag.trim()];
    const formData = new FormData();
    formData.append("intent", "update_offer_tags");
    formData.append("id", offer.id);
    formData.append("trigger_tags", allTags.join(", "));
    fetcher.submit(formData, {
      method: "post"
    });
    setNewTag("");
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      ...card$1,
      marginBottom: 10,
      opacity: offer.is_active ? 1 : 0.5,
      position: "relative"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        position: "absolute",
        top: 12,
        right: 12,
        display: "flex",
        gap: 6
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: onEdit,
        title: "Edit",
        style: iconButton,
        children: /* @__PURE__ */ jsxs("svg", {
          width: "14",
          height: "14",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [/* @__PURE__ */ jsx("path", {
            d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          }), /* @__PURE__ */ jsx("path", {
            d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          })]
        })
      }), /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        style: {
          display: "inline"
        },
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "toggle_offer"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "id",
          value: offer.id
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "is_active",
          value: String(offer.is_active)
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          title: offer.is_active ? "Deactivate" : "Activate",
          style: {
            ...iconButton,
            background: offer.is_active ? "#fff3e0" : "#e8f5e9",
            color: offer.is_active ? "#ef6c00" : "#2e7d32"
          },
          children: offer.is_active ? /* @__PURE__ */ jsxs("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "currentColor",
            children: [/* @__PURE__ */ jsx("rect", {
              x: "6",
              y: "4",
              width: "4",
              height: "16"
            }), /* @__PURE__ */ jsx("rect", {
              x: "14",
              y: "4",
              width: "4",
              height: "16"
            })]
          }) : /* @__PURE__ */ jsx("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "currentColor",
            children: /* @__PURE__ */ jsx("polygon", {
              points: "5 3 19 12 5 21 5 3"
            })
          })
        })]
      }), /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        onSubmit: (e) => {
          if (!confirm("Delete this offer?")) e.preventDefault();
        },
        style: {
          display: "inline"
        },
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "delete_offer"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "id",
          value: offer.id
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          title: "Delete",
          style: {
            ...iconButton,
            background: "#ffebee",
            color: "#c62828"
          },
          children: /* @__PURE__ */ jsxs("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [/* @__PURE__ */ jsx("polyline", {
              points: "3 6 5 6 21 6"
            }), /* @__PURE__ */ jsx("path", {
              d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            })]
          })
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        paddingRight: 80
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          fontWeight: 700,
          fontSize: 15,
          color: "#3b3b3b"
        },
        children: offer.name
      }), offer.price && /* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 18,
          fontWeight: 700,
          color: "#c4a882",
          marginTop: 4
        },
        children: offer.price
      }), offer.description && /* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 13,
          color: "#666",
          marginTop: 8,
          lineHeight: 1.5
        },
        children: offer.description
      }), offer.terms && /* @__PURE__ */ jsxs("div", {
        style: {
          fontSize: 12,
          color: "#8a8478",
          marginTop: 6
        },
        children: ["Terms: ", offer.terms]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          marginTop: 12
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 11,
            fontWeight: 600,
            color: "#8a8478",
            marginBottom: 6
          },
          children: "Trigger tags:"
        }), /* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 8
          },
          children: offerTags.length > 0 ? offerTags.map((tag) => /* @__PURE__ */ jsxs("div", {
            style: tagPill,
            children: [/* @__PURE__ */ jsx("span", {
              children: tag
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => handleRemoveTag(tag),
              style: tagRemoveButton,
              title: "Remove tag",
              children: "×"
            })]
          }, tag)) : /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 11,
              color: "#b0a89a",
              fontStyle: "italic"
            },
            children: "no tags set"
          })
        }), /* @__PURE__ */ jsxs("form", {
          onSubmit: handleAddTag,
          style: {
            display: "flex",
            gap: 6,
            alignItems: "center"
          },
          children: [/* @__PURE__ */ jsx("input", {
            type: "text",
            value: newTag,
            onChange: (e) => setNewTag(e.target.value),
            placeholder: "Add tag...",
            style: {
              padding: "4px 8px",
              border: "1px solid #ddd5c4",
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "'Montserrat', sans-serif",
              width: 120
            }
          }), /* @__PURE__ */ jsx("button", {
            type: "submit",
            style: {
              padding: "4px 12px",
              background: "#3b3b3b",
              color: "#f5f0e8",
              border: "none",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif"
            },
            children: "Add"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          fontSize: 11,
          color: "#b0a89a",
          marginTop: 8
        },
        children: ["Updated ", new Date(offer.updated_at).toLocaleDateString("en-AU"), offer.one_per_customer && " | One per customer", offer.health_rebate_eligible && " | Health rebate eligible"]
      })]
    })]
  });
}
function ServiceCard({
  service,
  onEdit,
  fetcher
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      ...card$1,
      marginBottom: 10,
      opacity: service.is_active ? 1 : 0.5,
      position: "relative"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        position: "absolute",
        top: 12,
        right: 12,
        display: "flex",
        gap: 6
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: onEdit,
        title: "Edit",
        style: iconButton,
        children: /* @__PURE__ */ jsxs("svg", {
          width: "14",
          height: "14",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [/* @__PURE__ */ jsx("path", {
            d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          }), /* @__PURE__ */ jsx("path", {
            d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          })]
        })
      }), /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        style: {
          display: "inline"
        },
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "toggle_service"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "id",
          value: service.id
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "is_active",
          value: String(service.is_active)
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          title: service.is_active ? "Deactivate" : "Activate",
          style: {
            ...iconButton,
            background: service.is_active ? "#fff3e0" : "#e8f5e9",
            color: service.is_active ? "#ef6c00" : "#2e7d32"
          },
          children: service.is_active ? /* @__PURE__ */ jsxs("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "currentColor",
            children: [/* @__PURE__ */ jsx("rect", {
              x: "6",
              y: "4",
              width: "4",
              height: "16"
            }), /* @__PURE__ */ jsx("rect", {
              x: "14",
              y: "4",
              width: "4",
              height: "16"
            })]
          }) : /* @__PURE__ */ jsx("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "currentColor",
            children: /* @__PURE__ */ jsx("polygon", {
              points: "5 3 19 12 5 21 5 3"
            })
          })
        })]
      }), /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        onSubmit: (e) => {
          if (!confirm("Delete this service?")) e.preventDefault();
        },
        style: {
          display: "inline"
        },
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "delete_service"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "id",
          value: service.id
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          title: "Delete",
          style: {
            ...iconButton,
            background: "#ffebee",
            color: "#c62828"
          },
          children: /* @__PURE__ */ jsxs("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [/* @__PURE__ */ jsx("polyline", {
              points: "3 6 5 6 21 6"
            }), /* @__PURE__ */ jsx("path", {
              d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            })]
          })
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        paddingRight: 80
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          fontWeight: 600,
          fontSize: 14,
          color: "#3b3b3b"
        },
        children: service.name
      }), service.description && /* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 13,
          color: "#666",
          marginTop: 4
        },
        children: service.description
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          fontSize: 12,
          color: "#8a8478",
          marginTop: 4
        },
        children: [service.price_range && /* @__PURE__ */ jsx("span", {
          children: service.price_range
        }), service.price_range && service.duration && /* @__PURE__ */ jsx("span", {
          children: " | "
        }), service.duration && /* @__PURE__ */ jsx("span", {
          children: service.duration
        })]
      })]
    })]
  });
}
async function action$4({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const {
    data: client
  } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {
    error: "Client not found"
  };
  if (intent === "add_offer") {
    const tagsRaw = (form.get("trigger_tags") || "").trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    await supabase.from("msg_offers").insert({
      client_id: client.id,
      name: form.get("name"),
      short_name: form.get("short_name") || null,
      price: form.get("price") || null,
      description: form.get("description") || null,
      terms: form.get("terms") || null,
      booking_link: form.get("booking_link") || null,
      trigger_tags: JSON.stringify(tags),
      health_rebate_eligible: form.get("health_rebate_eligible") === "true",
      one_per_customer: form.get("one_per_customer") === "true",
      is_active: true
    });
  } else if (intent === "update_offer_tags") {
    const tagsRaw = (form.get("trigger_tags") || "").trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_offers?id=eq.${form.get("id")}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_SERVICE_KEY}`,
        "apikey": SB_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        trigger_tags: JSON.stringify(tags)
      })
    });
  } else if (intent === "toggle_offer") {
    const active = form.get("is_active") === "true";
    await supabase.from("msg_offers").update({
      is_active: !active
    }).eq("id", form.get("id"));
  } else if (intent === "edit_offer") {
    const tagsRaw = (form.get("trigger_tags") || "").trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_offers?id=eq.${form.get("id")}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_KEY}`,
        "apikey": SB_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        name: form.get("name"),
        short_name: form.get("short_name") || null,
        price: form.get("price") || null,
        description: form.get("description") || null,
        terms: form.get("terms") || null,
        booking_link: form.get("booking_link") || null,
        trigger_tags: JSON.stringify(tags),
        health_rebate_eligible: form.get("health_rebate_eligible") === "true",
        one_per_customer: form.get("one_per_customer") === "true"
      })
    });
  } else if (intent === "delete_offer") {
    await supabase.from("msg_offers").delete().eq("id", form.get("id"));
  } else if (intent === "edit_service") {
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_services?id=eq.${form.get("id")}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_KEY}`,
        "apikey": SB_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || null,
        price_range: form.get("price_range") || null,
        duration: form.get("duration") || null
      })
    });
  }
  if (intent === "add_service") {
    await supabase.from("msg_services").insert({
      client_id: client.id,
      name: form.get("name"),
      description: form.get("description") || null,
      price_range: form.get("price_range") || null,
      duration: form.get("duration") || null,
      is_active: true
    });
  } else if (intent === "toggle_service") {
    const active = form.get("is_active") === "true";
    await supabase.from("msg_services").update({
      is_active: !active
    }).eq("id", form.get("id"));
  } else if (intent === "delete_service") {
    await supabase.from("msg_services").delete().eq("id", form.get("id"));
  }
  return {
    success: true
  };
}
const _app_hub_$slug_offers = UNSAFE_withComponentProps(function OffersAndServices() {
  const {
    allClientData
  } = useOutletContext();
  const {
    slug
  } = useParams();
  const data2 = allClientData[slug] || {};
  const client = data2.client || {};
  const offers = data2.offers || [];
  const services = data2.services || [];
  const fetcher = useFetcher();
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 720,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsx("h1", {
      style: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: 24,
        color: "#3b3b3b",
        margin: 0
      },
      children: "Offers & Services"
    }), /* @__PURE__ */ jsx("p", {
      style: {
        color: "#8a8478",
        fontSize: 13,
        margin: "4px 0 32px"
      },
      children: client.name
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16
      },
      children: [/* @__PURE__ */ jsx("h2", {
        style: {
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "#3b3b3b",
          margin: 0
        },
        children: "Offers"
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => setShowAddOffer(!showAddOffer),
        style: btnPrimary$2,
        children: showAddOffer ? "Cancel" : "Add Offer"
      })]
    }), showAddOffer && /* @__PURE__ */ jsx("div", {
      style: {
        ...card$1,
        marginBottom: 16
      },
      children: /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        onSubmit: () => setShowAddOffer(false),
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "add_offer"
        }), [["Name", "name", true], ["Short Name", "short_name"], ["Price", "price"]].map(([l, n, r]) => /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle$1,
            children: l
          }), /* @__PURE__ */ jsx("input", {
            name: n,
            required: r,
            style: inputStyle$1
          })]
        }, n)), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle$1,
            children: "Description"
          }), /* @__PURE__ */ jsx("textarea", {
            name: "description",
            rows: 3,
            style: {
              ...inputStyle$1,
              resize: "vertical"
            }
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle$1,
            children: "Terms"
          }), /* @__PURE__ */ jsx("textarea", {
            name: "terms",
            rows: 2,
            style: {
              ...inputStyle$1,
              resize: "vertical"
            }
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle$1,
            children: "Booking Link"
          }), /* @__PURE__ */ jsx("input", {
            name: "booking_link",
            style: inputStyle$1
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle$1,
            children: "GHL Trigger Tags"
          }), /* @__PURE__ */ jsx("input", {
            name: "trigger_tags",
            placeholder: "e.g. hot lead, meta lead (comma separated)",
            style: inputStyle$1
          }), /* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 11,
              color: "#8a8478",
              marginTop: 4
            },
            children: "Leads with ALL these tags will receive this offer's promo messaging"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 16,
            marginBottom: 16
          },
          children: [/* @__PURE__ */ jsxs("label", {
            style: {
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6
            },
            children: [/* @__PURE__ */ jsx("input", {
              type: "checkbox",
              name: "health_rebate_eligible",
              value: "true"
            }), " Health rebate eligible"]
          }), /* @__PURE__ */ jsxs("label", {
            style: {
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6
            },
            children: [/* @__PURE__ */ jsx("input", {
              type: "checkbox",
              name: "one_per_customer",
              value: "true"
            }), " One per customer"]
          })]
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          style: {
            ...btnPrimary$2,
            background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b",
            transition: "all 0.3s"
          },
          children: fetcher.state === "submitting" ? "Saving..." : "Save Offer"
        })]
      })
    }), offers.length === 0 && !showAddOffer && /* @__PURE__ */ jsx("div", {
      style: {
        ...card$1,
        textAlign: "center",
        color: "#8a8478",
        padding: 32,
        marginBottom: 16
      },
      children: "No offers yet"
    }), offers.map((offer) => {
      const offerTags = (() => {
        try {
          return typeof offer.trigger_tags === "string" ? JSON.parse(offer.trigger_tags) : offer.trigger_tags || [];
        } catch {
          return [];
        }
      })();
      if (editingOfferId === offer.id) {
        return /* @__PURE__ */ jsx("div", {
          style: {
            ...card$1,
            marginBottom: 10,
            border: "2px solid #c4a882"
          },
          children: /* @__PURE__ */ jsxs(fetcher.Form, {
            method: "post",
            onSubmit: () => setEditingOfferId(null),
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "edit_offer"
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "id",
              value: offer.id
            }), [["Name", "name", offer.name], ["Short Name", "short_name", offer.short_name], ["Price", "price", offer.price]].map(([l, n, v]) => /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle$1,
                children: l
              }), /* @__PURE__ */ jsx("input", {
                name: n,
                defaultValue: v || "",
                style: inputStyle$1
              })]
            }, n)), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle$1,
                children: "Description"
              }), /* @__PURE__ */ jsx("textarea", {
                name: "description",
                defaultValue: offer.description || "",
                rows: 3,
                style: {
                  ...inputStyle$1,
                  resize: "vertical"
                }
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle$1,
                children: "Terms"
              }), /* @__PURE__ */ jsx("textarea", {
                name: "terms",
                defaultValue: offer.terms || "",
                rows: 2,
                style: {
                  ...inputStyle$1,
                  resize: "vertical"
                }
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle$1,
                children: "Booking Link"
              }), /* @__PURE__ */ jsx("input", {
                name: "booking_link",
                defaultValue: offer.booking_link || "",
                style: inputStyle$1
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle$1,
                children: "GHL Trigger Tags"
              }), /* @__PURE__ */ jsx("input", {
                name: "trigger_tags",
                defaultValue: offerTags.join(", "),
                placeholder: "hot lead, meta lead",
                style: inputStyle$1
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                gap: 16,
                marginBottom: 16
              },
              children: [/* @__PURE__ */ jsxs("label", {
                style: {
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                },
                children: [/* @__PURE__ */ jsx("input", {
                  type: "checkbox",
                  name: "health_rebate_eligible",
                  value: "true",
                  defaultChecked: offer.health_rebate_eligible
                }), " Health rebate eligible"]
              }), /* @__PURE__ */ jsxs("label", {
                style: {
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                },
                children: [/* @__PURE__ */ jsx("input", {
                  type: "checkbox",
                  name: "one_per_customer",
                  value: "true",
                  defaultChecked: offer.one_per_customer
                }), " One per customer"]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("button", {
                type: "submit",
                style: btnPrimary$2,
                children: "Save"
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                onClick: () => setEditingOfferId(null),
                style: {
                  ...btnSmall$1,
                  background: "#eee8dc",
                  color: "#3b3b3b"
                },
                children: "Cancel"
              })]
            })]
          })
        }, offer.id);
      }
      return /* @__PURE__ */ jsx(OfferCard, {
        offer,
        offerTags,
        onEdit: () => setEditingOfferId(offer.id),
        fetcher
      }, offer.id);
    }), /* @__PURE__ */ jsx("div", {
      style: {
        borderTop: "2px solid #ddd5c4",
        margin: "32px 0"
      }
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16
      },
      children: [/* @__PURE__ */ jsx("h2", {
        style: {
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "#3b3b3b",
          margin: 0
        },
        children: "Services"
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => setShowAddService(!showAddService),
        style: btnPrimary$2,
        children: showAddService ? "Cancel" : "Add Service"
      })]
    }), showAddService && /* @__PURE__ */ jsx("div", {
      style: {
        ...card$1,
        marginBottom: 16
      },
      children: /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        onSubmit: () => setShowAddService(false),
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "add_service"
        }), [["Service Name", "name", true], ["Description", "description"], ["Price Range", "price_range"], ["Duration", "duration"]].map(([l, n, r]) => /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle$1,
            children: l
          }), /* @__PURE__ */ jsx("input", {
            name: n,
            required: r,
            style: inputStyle$1
          })]
        }, n)), /* @__PURE__ */ jsx("button", {
          type: "submit",
          style: {
            ...btnPrimary$2,
            background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b",
            transition: "all 0.3s"
          },
          children: fetcher.state === "submitting" ? "Saving..." : "Save Service"
        })]
      })
    }), services.length === 0 && !showAddService && /* @__PURE__ */ jsx("div", {
      style: {
        ...card$1,
        textAlign: "center",
        color: "#8a8478",
        padding: 32
      },
      children: "No services yet"
    }), services.map((svc) => {
      if (editingServiceId === svc.id) {
        return /* @__PURE__ */ jsx("div", {
          style: {
            ...card$1,
            marginBottom: 10,
            border: "2px solid #c4a882"
          },
          children: /* @__PURE__ */ jsxs(fetcher.Form, {
            method: "post",
            onSubmit: () => setEditingServiceId(null),
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "edit_service"
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "id",
              value: svc.id
            }), [["Service Name", "name", svc.name], ["Description", "description", svc.description], ["Price Range", "price_range", svc.price_range], ["Duration", "duration", svc.duration]].map(([l, n, v]) => /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle$1,
                children: l
              }), /* @__PURE__ */ jsx("input", {
                name: n,
                defaultValue: v || "",
                style: inputStyle$1
              })]
            }, n)), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("button", {
                type: "submit",
                style: btnPrimary$2,
                children: "Save"
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                onClick: () => setEditingServiceId(null),
                style: {
                  ...btnSmall$1,
                  background: "#eee8dc",
                  color: "#3b3b3b"
                },
                children: "Cancel"
              })]
            })]
          })
        }, svc.id);
      }
      return /* @__PURE__ */ jsx(ServiceCard, {
        service: svc,
        onEdit: () => setEditingServiceId(svc.id),
        fetcher
      }, svc.id);
    })]
  });
});
const card$1 = {
  background: "white",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
};
const labelStyle$1 = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#3b3b3b",
  marginBottom: 4
};
const inputStyle$1 = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd5c4",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif",
  background: "#faf8f5",
  boxSizing: "border-box"
};
const btnPrimary$2 = {
  padding: "10px 20px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const btnSmall$1 = {
  padding: "6px 12px",
  border: "none",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const iconButton = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  border: "none",
  background: "#e8e8e8",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  padding: 0
};
const tagPill = {
  padding: "2px 8px",
  borderRadius: 10,
  fontSize: 11,
  fontWeight: 600,
  background: "#e3f2fd",
  color: "#1565c0",
  display: "inline-flex",
  alignItems: "center",
  gap: 4
};
const tagRemoveButton = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
  color: "#1565c0",
  fontWeight: 700
};
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: _app_hub_$slug_offers
}, Symbol.toStringTag, { value: "Module" }));
async function action$3({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const {
    data: client
  } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {};
  if (intent === "add") {
    await supabase.from("msg_faqs").insert({
      client_id: client.id,
      category: form.get("category") || "general",
      question: form.get("question"),
      answer: form.get("answer") || (form.get("response_type") === "escalate" ? "Escalate to owner" : ""),
      response_type: form.get("response_type") || "direct",
      profile: form.get("profile") || "shared",
      source: "manual",
      is_active: true
    });
  } else if (intent === "toggle") {
    const id = form.get("id");
    const active = form.get("is_active") === "true";
    await supabase.from("msg_faqs").update({
      is_active: !active
    }).eq("id", id);
  } else if (intent === "update") {
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    await fetch(`${SB_URL}/rest/v1/msg_faqs?id=eq.${form.get("id")}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_KEY}`,
        "apikey": SB_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        question: form.get("question"),
        answer: form.get("answer"),
        ...form.get("profile") ? {
          profile: form.get("profile")
        } : {},
        ...form.get("response_type") ? {
          response_type: form.get("response_type")
        } : {}
      })
    });
  } else if (intent === "delete") {
    await supabase.from("msg_faqs").delete().eq("id", form.get("id"));
  } else if (intent === "approve_suggestion") {
    const patternId = form.get("pattern_id");
    const {
      data: pattern
    } = await supabase.from("msg_learned_patterns").select("*").eq("id", patternId).single();
    if (pattern) {
      await supabase.from("msg_faqs").insert({
        client_id: client.id,
        category: "general",
        question: pattern.example_inbound,
        answer: form.get("answer") || pattern.suggested_answer,
        source: "learned",
        is_active: true
      });
      await supabase.from("msg_learned_patterns").update({
        status: "approved"
      }).eq("id", patternId);
    }
  } else if (intent === "reject_suggestion") {
    await supabase.from("msg_learned_patterns").update({
      status: "rejected"
    }).eq("id", form.get("pattern_id"));
  }
  return {
    success: true
  };
}
const _app_hub_$slug_faqs = UNSAFE_withComponentProps(function FAQs() {
  const {
    allClientData
  } = useOutletContext();
  const {
    slug
  } = useParams();
  const data2 = allClientData[slug] || {};
  const client = data2.client || {};
  const faqs = data2.faqs || [];
  const suggested = data2.suggested || [];
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [profileFilter, setProfileFilter] = useState("all");
  const profileTabs = [{
    key: "all",
    label: "All"
  }, {
    key: "shared",
    label: "Shared"
  }, {
    key: "promo",
    label: "Promo"
  }, {
    key: "general",
    label: "General"
  }];
  const filteredFaqs = profileFilter === "all" ? faqs : faqs.filter((f) => f.profile === profileFilter);
  const profileColors = {
    shared: {
      bg: "#eee8dc",
      color: "#3b3b3b"
    },
    promo: {
      bg: "#e3f2fd",
      color: "#1565c0"
    },
    general: {
      bg: "#e8f5e9",
      color: "#2e7d32"
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 720,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      className: "hub-page-header",
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          style: {
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: "#3b3b3b",
            margin: 0
          },
          children: "FAQs"
        }), /* @__PURE__ */ jsx("p", {
          style: {
            color: "#8a8478",
            fontSize: 13,
            margin: "4px 0 0"
          },
          children: client.name
        })]
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => setShowAdd(!showAdd),
        style: btnPrimary$1,
        children: showAdd ? "Cancel" : "Add FAQ"
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        gap: 4,
        marginBottom: 20,
        background: "#eee8dc",
        borderRadius: 8,
        padding: 4
      },
      children: profileTabs.map((t) => /* @__PURE__ */ jsxs("button", {
        onClick: () => setProfileFilter(t.key),
        style: {
          flex: 1,
          padding: "8px 12px",
          borderRadius: 6,
          border: "none",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Montserrat', sans-serif",
          background: profileFilter === t.key ? "#3b3b3b" : "transparent",
          color: profileFilter === t.key ? "#f5f0e8" : "#5a5a5a",
          transition: "all 0.15s"
        },
        children: [t.label, " ", t.key !== "all" && `(${faqs.filter((f) => f.profile === t.key).length})`]
      }, t.key))
    }), suggested.length > 0 && /* @__PURE__ */ jsxs("div", {
      style: {
        background: "#fffde7",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        border: "1px solid #fff9c4"
      },
      children: [/* @__PURE__ */ jsxs("h3", {
        style: {
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          margin: "0 0 12px",
          color: "#f57f17"
        },
        children: ["AI Suggested FAQs (", suggested.length, ")"]
      }), /* @__PURE__ */ jsx("p", {
        style: {
          fontSize: 12,
          color: "#8a8478",
          marginBottom: 12
        },
        children: "Based on common questions from lead conversations"
      }), suggested.map((s) => /* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 8,
          padding: 12,
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 4
          },
          children: ["Q: ", s.example_inbound]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            fontSize: 13,
            color: "#666",
            marginBottom: 8
          },
          children: ["A: ", s.suggested_answer]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 8
          },
          children: [/* @__PURE__ */ jsxs(fetcher.Form, {
            method: "post",
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "approve_suggestion"
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "pattern_id",
              value: s.id
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "answer",
              value: s.suggested_answer
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              style: {
                ...btnSmall,
                background: "#e8f5e9",
                color: "#2e7d32"
              },
              children: "Approve"
            })]
          }), /* @__PURE__ */ jsxs(fetcher.Form, {
            method: "post",
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "reject_suggestion"
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "pattern_id",
              value: s.id
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              style: {
                ...btnSmall,
                background: "#ffebee",
                color: "#c62828"
              },
              children: "Reject"
            })]
          })]
        })]
      }, s.id))]
    }), showAdd && /* @__PURE__ */ jsx("div", {
      style: {
        background: "white",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      },
      children: /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        onSubmit: () => setShowAdd(false),
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "add"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle,
            children: "Question"
          }), /* @__PURE__ */ jsx("input", {
            name: "question",
            required: true,
            style: inputStyle
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle,
            children: "Response Type"
          }), /* @__PURE__ */ jsxs("select", {
            name: "response_type",
            id: "add-response-type",
            defaultValue: "direct",
            style: inputStyle,
            onChange: (e) => {
              document.getElementById("add-answer-field");
              const answerLabel = document.getElementById("add-answer-label");
              const answerInput = document.getElementById("add-answer-input");
              if (e.target.value === "escalate") {
                answerLabel.textContent = "Reason (optional)";
                answerInput.placeholder = "e.g. Medical question, Sensitive topic";
                answerInput.required = false;
                answerInput.rows = 1;
              } else if (e.target.value === "instruction") {
                answerLabel.textContent = "Instruction";
                answerInput.placeholder = "e.g. Check Fresha for availability, then direct to booking page";
                answerInput.required = true;
                answerInput.rows = 3;
              } else {
                answerLabel.textContent = "Answer";
                answerInput.placeholder = "The exact reply to send to the lead";
                answerInput.required = true;
                answerInput.rows = 3;
              }
            },
            children: [/* @__PURE__ */ jsx("option", {
              value: "direct",
              children: "Direct Response (send this answer to the lead)"
            }), /* @__PURE__ */ jsx("option", {
              value: "escalate",
              children: "Escalate (do not reply, escalate to owner)"
            }), /* @__PURE__ */ jsx("option", {
              value: "instruction",
              children: "Instruction (tells AI how to behave, never sent)"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          id: "add-answer-field",
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            id: "add-answer-label",
            style: labelStyle,
            children: "Answer"
          }), /* @__PURE__ */ jsx("textarea", {
            id: "add-answer-input",
            name: "answer",
            required: true,
            rows: 3,
            style: {
              ...inputStyle,
              resize: "vertical"
            },
            placeholder: "The exact reply to send to the lead"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelStyle,
            children: "Profile"
          }), /* @__PURE__ */ jsxs("select", {
            name: "profile",
            defaultValue: "shared",
            style: inputStyle,
            children: [/* @__PURE__ */ jsx("option", {
              value: "shared",
              children: "Shared (both profiles)"
            }), /* @__PURE__ */ jsx("option", {
              value: "promo",
              children: "Promo only"
            }), /* @__PURE__ */ jsx("option", {
              value: "general",
              children: "General only"
            })]
          })]
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "category",
          value: "general"
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          style: {
            ...btnPrimary$1,
            background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b",
            transition: "all 0.3s"
          },
          children: fetcher.state === "submitting" ? "Saving..." : "Save FAQ"
        })]
      })
    }), filteredFaqs.map((faq) => {
      const pc = profileColors[faq.profile] || profileColors.shared;
      if (editingId === faq.id) {
        return /* @__PURE__ */ jsx("div", {
          style: {
            background: "#faf8f5",
            borderRadius: 8,
            padding: 20,
            marginBottom: 8,
            border: "2px solid #c4a882"
          },
          children: /* @__PURE__ */ jsxs(fetcher.Form, {
            method: "post",
            onSubmit: () => setEditingId(null),
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "update"
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "id",
              value: faq.id
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 10
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle,
                children: "Question"
              }), /* @__PURE__ */ jsx("input", {
                name: "question",
                defaultValue: faq.question,
                style: inputStyle
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle,
                children: "Response Type"
              }), /* @__PURE__ */ jsxs("select", {
                name: "response_type",
                defaultValue: faq.response_type || "direct",
                style: inputStyle,
                onChange: (e) => {
                  const label2 = e.target.closest("div")?.parentElement?.querySelector(`[data-edit-label="${faq.id}"]`);
                  if (label2) label2.textContent = e.target.value === "escalate" ? "Reason (optional)" : e.target.value === "instruction" ? "Instruction" : "Answer";
                },
                children: [/* @__PURE__ */ jsx("option", {
                  value: "direct",
                  children: "Direct Response"
                }), /* @__PURE__ */ jsx("option", {
                  value: "escalate",
                  children: "Escalate"
                }), /* @__PURE__ */ jsx("option", {
                  value: "instruction",
                  children: "Instruction"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                "data-edit-label": faq.id,
                style: labelStyle,
                children: faq.response_type === "escalate" ? "Reason (optional)" : faq.response_type === "instruction" ? "Instruction" : "Answer"
              }), /* @__PURE__ */ jsx("textarea", {
                name: "answer",
                defaultValue: faq.answer,
                rows: faq.response_type === "escalate" ? 1 : 3,
                style: {
                  ...inputStyle,
                  resize: "vertical"
                }
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelStyle,
                children: "Profile"
              }), /* @__PURE__ */ jsxs("select", {
                name: "profile",
                defaultValue: faq.profile || "shared",
                style: inputStyle,
                children: [/* @__PURE__ */ jsx("option", {
                  value: "shared",
                  children: "Shared (both profiles)"
                }), /* @__PURE__ */ jsx("option", {
                  value: "promo",
                  children: "Promo only"
                }), /* @__PURE__ */ jsx("option", {
                  value: "general",
                  children: "General only"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("button", {
                type: "submit",
                style: {
                  ...btnPrimary$1,
                  background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b",
                  transition: "all 0.3s"
                },
                children: fetcher.state === "submitting" ? "Saving..." : "Save"
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                onClick: () => setEditingId(null),
                style: {
                  ...btnSmall,
                  background: "#eee8dc",
                  color: "#3b3b3b"
                },
                children: "Cancel"
              })]
            })]
          })
        }, faq.id);
      }
      return /* @__PURE__ */ jsx("div", {
        style: {
          background: "white",
          borderRadius: 8,
          padding: 16,
          marginBottom: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          opacity: faq.is_active ? 1 : 0.5,
          borderLeft: `3px solid ${faq.source === "learned" ? "#f57f17" : "#c4a882"}`
        },
        children: /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              flex: 1
            },
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap"
              },
              children: [/* @__PURE__ */ jsxs("div", {
                style: {
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#3b3b3b"
                },
                children: ["Q: ", faq.question]
              }), /* @__PURE__ */ jsx("span", {
                style: {
                  padding: "1px 6px",
                  borderRadius: 8,
                  fontSize: 9,
                  fontWeight: 600,
                  background: pc.bg,
                  color: pc.color,
                  flexShrink: 0
                },
                children: (faq.profile || "shared").toUpperCase()
              }), faq.response_type === "escalate" && /* @__PURE__ */ jsx("span", {
                style: {
                  padding: "1px 6px",
                  borderRadius: 8,
                  fontSize: 9,
                  fontWeight: 600,
                  background: "#fff3e0",
                  color: "#ef6c00",
                  flexShrink: 0
                },
                children: "ESCALATE"
              }), faq.response_type === "instruction" && /* @__PURE__ */ jsx("span", {
                style: {
                  padding: "1px 6px",
                  borderRadius: 8,
                  fontSize: 9,
                  fontWeight: 600,
                  background: "#f3e5f5",
                  color: "#7b1fa2",
                  flexShrink: 0
                },
                children: "INSTRUCTION"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                fontSize: 13,
                color: "#666",
                marginTop: 6,
                lineHeight: 1.5
              },
              children: ["A: ", faq.answer]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                fontSize: 11,
                color: "#b0a89a",
                marginTop: 6
              },
              children: ["Used ", faq.times_used, "x", faq.source === "learned" && " | AI Learned"]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 6,
              flexShrink: 0,
              marginLeft: 12,
              alignItems: "flex-start"
            },
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => setEditingId(faq.id),
              style: {
                ...btnSmall,
                background: "#e3f2fd",
                color: "#1565c0"
              },
              children: "Edit"
            }), /* @__PURE__ */ jsxs(fetcher.Form, {
              method: "post",
              onSubmit: (e) => {
                if (!confirm("Delete this FAQ?")) e.preventDefault();
              },
              children: [/* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "intent",
                value: "delete"
              }), /* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "id",
                value: faq.id
              }), /* @__PURE__ */ jsx("button", {
                type: "submit",
                style: {
                  ...btnSmall,
                  background: "#ffebee",
                  color: "#c62828"
                },
                children: "Delete"
              })]
            })]
          })]
        })
      }, faq.id);
    }), !showAdd && faqs.length > 3 && /* @__PURE__ */ jsx("div", {
      style: {
        marginTop: 20,
        textAlign: "center"
      },
      children: /* @__PURE__ */ jsx("button", {
        onClick: () => setShowAdd(true),
        style: btnPrimary$1,
        children: "Add FAQ"
      })
    })]
  });
});
const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#3b3b3b",
  marginBottom: 4
};
const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd5c4",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif",
  background: "#faf8f5",
  boxSizing: "border-box"
};
const btnPrimary$1 = {
  padding: "10px 20px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const btnSmall = {
  padding: "5px 10px",
  border: "none",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: _app_hub_$slug_faqs
}, Symbol.toStringTag, { value: "Module" }));
async function action$2({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const {
    data: client
  } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {};
  if (intent === "add") {
    await supabase.from("msg_locations").insert({
      client_id: client.id,
      name: form.get("name"),
      tag: form.get("tag"),
      address: form.get("address") || null,
      full_address: form.get("full_address") || null,
      booking_link: form.get("booking_link") || null,
      general_booking_link: form.get("general_booking_link") || null,
      ghl_pipeline_id: form.get("ghl_pipeline_id") || null,
      fresha_url: form.get("fresha_url") || null,
      booking_system: form.get("booking_system") || "fresha",
      is_active: true
    });
  } else if (intent === "toggle") {
    const active = form.get("is_active") === "true";
    await supabase.from("msg_locations").update({
      is_active: !active
    }).eq("id", form.get("id"));
  } else if (intent === "delete") {
    await supabase.from("msg_locations").delete().eq("id", form.get("id"));
  }
  return {
    success: true
  };
}
const _app_hub_$slug_locations = UNSAFE_withComponentProps(function Locations() {
  const {
    allClientData
  } = useOutletContext();
  const {
    slug
  } = useParams();
  const data2 = allClientData[slug] || {};
  const client = data2.client || {};
  const locations = data2.locations || [];
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 720,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      className: "hub-page-header",
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("h1", {
          style: {
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: "#3b3b3b",
            margin: 0
          },
          children: "Locations"
        }), /* @__PURE__ */ jsx("p", {
          style: {
            color: "#8a8478",
            fontSize: 13,
            margin: "4px 0 0"
          },
          children: client.name
        })]
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => setShowAdd(!showAdd),
        style: btn,
        children: showAdd ? "Cancel" : "Add Location"
      })]
    }), showAdd && /* @__PURE__ */ jsx("div", {
      style: card,
      children: /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        onSubmit: () => setShowAdd(false),
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "add"
        }), [["Name", "name", true], ["Tag (lowercase, no spaces)", "tag", true], ["Address", "address"], ["Full Address", "full_address"], ["Promo Booking Link", "booking_link"], ["General Booking Link", "general_booking_link"], ["GHL Pipeline ID", "ghl_pipeline_id"], ["Fresha URL", "fresha_url"]].map(([l, n, r]) => /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: label,
            children: l
          }), /* @__PURE__ */ jsx("input", {
            name: n,
            required: r,
            style: input
          })]
        }, n)), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: label,
            children: "Booking System"
          }), /* @__PURE__ */ jsxs("select", {
            name: "booking_system",
            style: input,
            children: [/* @__PURE__ */ jsx("option", {
              value: "fresha",
              children: "Fresha"
            }), /* @__PURE__ */ jsx("option", {
              value: "other",
              children: "Other"
            }), /* @__PURE__ */ jsx("option", {
              value: "none",
              children: "None"
            })]
          })]
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          style: btn,
          children: "Save Location"
        })]
      })
    }), locations.map((loc) => /* @__PURE__ */ jsx("div", {
      style: {
        ...card,
        opacity: loc.is_active ? 1 : 0.5
      },
      children: /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontWeight: 700,
              fontSize: 16,
              color: "#3b3b3b"
            },
            children: loc.name
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              fontSize: 12,
              color: "#c4a882",
              marginTop: 2
            },
            children: ["Tag: ", loc.tag]
          }), loc.address && /* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 13,
              color: "#666",
              marginTop: 8
            },
            children: loc.address
          }), loc.full_address && /* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 12,
              color: "#8a8478"
            },
            children: loc.full_address
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              marginTop: 8,
              fontSize: 12,
              color: "#666"
            },
            children: [loc.booking_link && /* @__PURE__ */ jsxs("div", {
              children: ["Promo: ", /* @__PURE__ */ jsx("a", {
                href: loc.booking_link,
                target: "_blank",
                style: {
                  color: "#5b9ea6"
                },
                children: loc.booking_link
              })]
            }), loc.general_booking_link && /* @__PURE__ */ jsxs("div", {
              children: ["General: ", /* @__PURE__ */ jsx("a", {
                href: loc.general_booking_link,
                target: "_blank",
                style: {
                  color: "#5b9ea6"
                },
                children: loc.general_booking_link
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              fontSize: 11,
              color: "#b0a89a",
              marginTop: 6
            },
            children: [loc.booking_system, " | Pipeline: ", loc.ghl_pipeline_id || "-"]
          })]
        }), /* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            gap: 6,
            flexShrink: 0
          },
          children: /* @__PURE__ */ jsxs(fetcher.Form, {
            method: "post",
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "toggle"
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "id",
              value: loc.id
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "is_active",
              value: String(loc.is_active)
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              style: {
                ...btnSm,
                background: loc.is_active ? "#fff3e0" : "#e8f5e9",
                color: loc.is_active ? "#ef6c00" : "#2e7d32"
              },
              children: loc.is_active ? "Deactivate" : "Activate"
            })]
          })
        })]
      })
    }, loc.id))]
  });
});
const card = {
  background: "white",
  borderRadius: 12,
  padding: 20,
  marginBottom: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
};
const label = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#3b3b3b",
  marginBottom: 4
};
const input = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd5c4",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif",
  background: "#faf8f5",
  boxSizing: "border-box"
};
const btn = {
  padding: "10px 20px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const btnSm = {
  padding: "6px 12px",
  border: "none",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: _app_hub_$slug_locations
}, Symbol.toStringTag, { value: "Module" }));
const _app_hub_$slug_conversations = UNSAFE_withComponentProps(function Conversations() {
  const {
    allClientData
  } = useOutletContext();
  const {
    slug
  } = useParams();
  const data2 = allClientData[slug] || {};
  const client = data2.client || {};
  const logs = data2.conversations?.logs || [];
  const locationId = client.ghl_location_id || "";
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");
  const actionColors = {
    responded: {
      bg: "#e8f5e9",
      color: "#2e7d32",
      label: "Responded"
    },
    escalated: {
      bg: "#fff3e0",
      color: "#ef6c00",
      label: "Escalated"
    },
    mark_lost: {
      bg: "#ffebee",
      color: "#c62828",
      label: "Lost"
    },
    check_availability: {
      bg: "#e3f2fd",
      color: "#1565c0",
      label: "Availability"
    },
    ignored: {
      bg: "#f5f5f5",
      color: "#666",
      label: "Ignored"
    }
  };
  function ghlLink(contactId) {
    if (!contactId || !locationId) return null;
    return `https://app.gohighlevel.com/v2/location/${locationId}/contacts/detail/${contactId}`;
  }
  function timeAgo(dateStr) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const mins = Math.floor((now - then) / 6e4);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }
  const contactMap = /* @__PURE__ */ new Map();
  for (const log of logs) {
    const key = log.contact_id || log.contact_name || "unknown";
    if (!contactMap.has(key)) {
      contactMap.set(key, {
        name: log.contact_name || "Unknown",
        contactId: log.contact_id || "",
        location: log.location_tag || "",
        channel: (log.channel || "").replace("TYPE_", ""),
        logs: [],
        lastAction: log.action || "",
        lastTime: log.created_at
      });
    }
    contactMap.get(key).logs.push(log);
  }
  for (const c of contactMap.values()) {
    const parts = (c.name || "").trim().split(/\s+/);
    if (parts.length > 1) {
      c.name = `${parts[0]} ${parts[parts.length - 1][0]}.`;
    } else {
      c.name = parts[0] || "Unknown";
    }
  }
  const contacts = Array.from(contactMap.values());
  const filtered = filter === "all" ? contacts : contacts.filter((c) => c.lastAction === filter);
  const totalConversations = contacts.length;
  const responded = contacts.filter((c) => c.logs.some((l) => l.action === "responded")).length;
  const escalated = contacts.filter((c) => c.logs.some((l) => l.action === "escalated")).length;
  const lost = contacts.filter((c) => c.lastAction === "mark_lost").length;
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 800,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsx("h1", {
      style: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: 24,
        color: "#3b3b3b",
        margin: 0
      },
      children: "Conversations"
    }), /* @__PURE__ */ jsx("p", {
      style: {
        color: "#8a8478",
        fontSize: 13,
        margin: "4px 0 24px"
      },
      children: client.name
    }), /* @__PURE__ */ jsx("div", {
      className: "hub-grid-4",
      style: {
        marginBottom: 24
      },
      children: [{
        label: "Total",
        value: totalConversations,
        bg: "#f5f0e8",
        color: "#3b3b3b"
      }, {
        label: "Responded",
        value: responded,
        bg: "#e8f5e9",
        color: "#2e7d32"
      }, {
        label: "Escalated",
        value: escalated,
        bg: "#fff3e0",
        color: "#ef6c00"
      }, {
        label: "Lost",
        value: lost,
        bg: "#ffebee",
        color: "#c62828"
      }].map((s) => /* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          textAlign: "center"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 24,
            fontWeight: 700,
            color: s.color
          },
          children: s.value
        }), /* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 11,
            color: "#8a8478",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginTop: 4
          },
          children: s.label
        })]
      }, s.label))
    }), /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        gap: 4,
        marginBottom: 20,
        background: "#eee8dc",
        borderRadius: 8,
        padding: 4,
        flexWrap: "wrap"
      },
      children: [{
        key: "all",
        label: "All"
      }, {
        key: "responded",
        label: "Responded"
      }, {
        key: "escalated",
        label: "Escalated"
      }, {
        key: "mark_lost",
        label: "Lost"
      }, {
        key: "check_availability",
        label: "Availability"
      }].map((t) => /* @__PURE__ */ jsx("button", {
        onClick: () => setFilter(t.key),
        style: {
          flex: 1,
          minWidth: 70,
          padding: "8px 12px",
          borderRadius: 6,
          border: "none",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Montserrat', sans-serif",
          background: filter === t.key ? "#3b3b3b" : "transparent",
          color: filter === t.key ? "#f5f0e8" : "#5a5a5a",
          transition: "all 0.15s"
        },
        children: t.label
      }, t.key))
    }), filtered.length === 0 && /* @__PURE__ */ jsx("div", {
      style: {
        background: "white",
        borderRadius: 12,
        padding: 40,
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      },
      children: /* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 13,
          color: "#8a8478"
        },
        children: "No conversations yet"
      })
    }), filtered.map((contact) => {
      const isExpanded = expanded === contact.contactId;
      const link = ghlLink(contact.contactId);
      const ac = actionColors[contact.lastAction] || actionColors.ignored;
      return /* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 12,
          marginBottom: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          borderLeft: `3px solid ${ac.color}`,
          overflow: "hidden"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          onClick: () => setExpanded(isExpanded ? null : contact.contactId),
          style: {
            padding: "14px 16px",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: 1,
              minWidth: 200
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#eee8dc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#3b3b3b",
                flexShrink: 0
              },
              children: (contact.name || "?")[0].toUpperCase()
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#3b3b3b"
                },
                children: contact.name
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  fontSize: 11,
                  color: "#8a8478",
                  marginTop: 2
                },
                children: [contact.location, " | ", contact.channel, " | ", contact.logs.length, " message", contact.logs.length !== 1 ? "s" : ""]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                padding: "3px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                background: ac.bg,
                color: ac.color
              },
              children: ac.label
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontSize: 12,
                color: "#8a8478",
                minWidth: 60,
                textAlign: "right"
              },
              children: timeAgo(contact.lastTime)
            }), link && /* @__PURE__ */ jsx("a", {
              href: link,
              target: "_blank",
              rel: "noopener noreferrer",
              onClick: (e) => e.stopPropagation(),
              style: {
                color: "#5b9ea6",
                fontSize: 11,
                fontWeight: 600,
                textDecoration: "none",
                padding: "4px 8px",
                background: "#f0f7f7",
                borderRadius: 4
              },
              children: "GHL"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontSize: 16,
                color: "#b0a89a",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s"
              },
              children: "▼"
            })]
          })]
        }), isExpanded && /* @__PURE__ */ jsxs("div", {
          style: {
            borderTop: "1px solid #eee8dc",
            background: "#faf8f5"
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              padding: "16px 16px 12px",
              maxHeight: 400,
              overflowY: "auto"
            },
            children: contact.logs.slice().reverse().map((log, i) => {
              const prevLog = i > 0 ? contact.logs.slice().reverse()[i - 1] : null;
              const showDate = !prevLog || new Date(log.created_at).toDateString() !== new Date(prevLog.created_at).toDateString();
              return /* @__PURE__ */ jsxs("div", {
                children: [showDate && /* @__PURE__ */ jsx("div", {
                  style: {
                    textAlign: "center",
                    margin: "12px 0 8px",
                    position: "relative"
                  },
                  children: /* @__PURE__ */ jsx("span", {
                    style: {
                      background: "#faf8f5",
                      padding: "0 12px",
                      fontSize: 10,
                      color: "#b0a89a",
                      fontWeight: 600,
                      position: "relative",
                      zIndex: 1
                    },
                    children: new Date(log.created_at).toLocaleDateString("en-AU", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short"
                    })
                  })
                }), log.inbound_text && /* @__PURE__ */ jsx("div", {
                  style: {
                    display: "flex",
                    justifyContent: "flex-start",
                    marginBottom: 4
                  },
                  children: /* @__PURE__ */ jsxs("div", {
                    style: {
                      maxWidth: "80%"
                    },
                    children: [/* @__PURE__ */ jsx("div", {
                      style: {
                        padding: "8px 12px",
                        borderRadius: "12px 12px 12px 4px",
                        background: "white",
                        border: "1px solid #eee8dc",
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "#3b3b3b"
                      },
                      children: log.inbound_text
                    }), /* @__PURE__ */ jsx("div", {
                      style: {
                        fontSize: 9,
                        color: "#b0a89a",
                        marginTop: 2,
                        paddingLeft: 4
                      },
                      children: new Date(log.created_at).toLocaleTimeString("en-AU", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    })]
                  })
                }), log.outbound_text && /* @__PURE__ */ jsx("div", {
                  style: {
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 4
                  },
                  children: /* @__PURE__ */ jsxs("div", {
                    style: {
                      maxWidth: "80%"
                    },
                    children: [/* @__PURE__ */ jsx("div", {
                      style: {
                        padding: "8px 12px",
                        borderRadius: "12px 12px 4px 12px",
                        background: "#3b3b3b",
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "#f5f0e8"
                      },
                      children: log.outbound_text
                    }), /* @__PURE__ */ jsxs("div", {
                      style: {
                        fontSize: 9,
                        color: "#b0a89a",
                        marginTop: 2,
                        textAlign: "right",
                        paddingRight: 4
                      },
                      children: [new Date(log.created_at).toLocaleTimeString("en-AU", {
                        hour: "2-digit",
                        minute: "2-digit"
                      }), log.action && log.action !== "responded" && /* @__PURE__ */ jsx("span", {
                        style: {
                          marginLeft: 6,
                          padding: "1px 5px",
                          borderRadius: 6,
                          fontSize: 8,
                          background: actionColors[log.action]?.bg || "#f5f5f5",
                          color: actionColors[log.action]?.color || "#666"
                        },
                        children: actionColors[log.action]?.label || log.action
                      })]
                    })]
                  })
                }), !log.outbound_text && log.action === "escalated" && /* @__PURE__ */ jsx("div", {
                  style: {
                    textAlign: "center",
                    margin: "6px 0"
                  },
                  children: /* @__PURE__ */ jsx("span", {
                    style: {
                      fontSize: 10,
                      color: "#ef6c00",
                      fontWeight: 600,
                      background: "#fff3e0",
                      padding: "2px 10px",
                      borderRadius: 8
                    },
                    children: "Escalated to owner"
                  })
                })]
              }, log.id || i);
            })
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              borderTop: "1px solid #eee8dc",
              padding: "8px 16px",
              display: "flex",
              gap: 16,
              flexWrap: "wrap"
            },
            children: [/* @__PURE__ */ jsxs("span", {
              style: {
                fontSize: 10,
                color: "#b0a89a"
              },
              children: [contact.logs.length, " exchange", contact.logs.length !== 1 ? "s" : ""]
            }), /* @__PURE__ */ jsxs("span", {
              style: {
                fontSize: 10,
                color: "#b0a89a"
              },
              children: ["First: ", new Date(contact.logs[contact.logs.length - 1]?.created_at).toLocaleDateString("en-AU", {
                day: "2-digit",
                month: "short"
              })]
            }), /* @__PURE__ */ jsxs("span", {
              style: {
                fontSize: 10,
                color: "#b0a89a"
              },
              children: ["Last: ", new Date(contact.logs[0]?.created_at).toLocaleDateString("en-AU", {
                day: "2-digit",
                month: "short"
              })]
            }), link && /* @__PURE__ */ jsx("a", {
              href: link,
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                fontSize: 10,
                color: "#5b9ea6",
                fontWeight: 600,
                textDecoration: "none",
                marginLeft: "auto"
              },
              children: "View full history in GHL →"
            })]
          })]
        })]
      }, contact.contactId);
    })]
  });
});
const route21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _app_hub_$slug_conversations
}, Symbol.toStringTag, { value: "Module" }));
async function action$1({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "resolve") {
    const id = form.get("id");
    const notes = form.get("notes");
    await supabase.from("msg_conversation_logs").update({
      escalation_status: "resolved",
      escalation_notes: notes || null
    }).eq("id", id);
  } else if (intent === "dismiss") {
    const id = form.get("id");
    await supabase.from("msg_conversation_logs").update({
      escalation_status: "dismissed"
    }).eq("id", id);
  }
  return {
    success: true
  };
}
const _app_hub_$slug_escalations = UNSAFE_withComponentProps(function Escalations() {
  const {
    allClientData
  } = useOutletContext();
  const {
    slug
  } = useParams();
  const data2 = allClientData[slug] || {};
  const client = data2.client || {};
  const allLogs = data2.conversations?.logs || [];
  const locationId = client.ghl_location_id || "";
  const fetcher = useFetcher();
  const escalations = allLogs.filter((l) => l.action === "escalated");
  const open = escalations.filter((l) => !l.escalation_status);
  const resolved = escalations.filter((l) => l.escalation_status);
  function ghlLink(contactId) {
    if (!contactId || !locationId) return null;
    return `https://app.gohighlevel.com/v2/location/${locationId}/contacts/detail/${contactId}`;
  }
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 800,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsx("h1", {
      style: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: 24,
        color: "#3b3b3b",
        margin: 0
      },
      children: "Escalations"
    }), /* @__PURE__ */ jsx("p", {
      style: {
        color: "#8a8478",
        fontSize: 13,
        margin: "4px 0 24px"
      },
      children: client.name
    }), /* @__PURE__ */ jsxs("div", {
      className: "hub-grid-2",
      style: {
        marginBottom: 24
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 11,
            color: "#8a8478",
            marginBottom: 4
          },
          children: "Open"
        }), /* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 32,
            fontWeight: 700,
            color: open.length > 0 ? "#ef6c00" : "#2e7d32"
          },
          children: open.length
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 11,
            color: "#8a8478",
            marginBottom: 4
          },
          children: "Resolved"
        }), /* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 32,
            fontWeight: 700,
            color: "#3b3b3b"
          },
          children: resolved.length
        })]
      })]
    }), open.length > 0 && /* @__PURE__ */ jsxs("div", {
      style: {
        marginBottom: 32
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "#ef6c00",
          marginBottom: 12
        },
        children: "Open Escalations"
      }), open.map((esc) => {
        const link = ghlLink(esc.contact_id);
        return /* @__PURE__ */ jsxs("div", {
          style: {
            background: "white",
            borderRadius: 12,
            padding: 20,
            marginBottom: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderLeft: "4px solid #ef6c00"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12
            },
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#3b3b3b"
                },
                children: esc.contact_name || "Unknown"
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  fontSize: 12,
                  color: "#8a8478",
                  marginTop: 2
                },
                children: [esc.location_tag || "-", " | ", (esc.channel || "").replace("TYPE_", ""), " | ", new Date(esc.created_at).toLocaleString("en-AU", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })]
              })]
            }), link && /* @__PURE__ */ jsx("a", {
              href: link,
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                padding: "6px 14px",
                background: "#5b9ea6",
                color: "white",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none"
              },
              children: "Open in GHL"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              background: "#faf8f5",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 12,
                color: "#8a8478",
                marginBottom: 4
              },
              children: "Lead said:"
            }), /* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 13,
                color: "#3b3b3b"
              },
              children: esc.inbound_text || "-"
            }), esc.outbound_text && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 12,
                  color: "#8a8478",
                  marginTop: 8,
                  marginBottom: 4
                },
                children: "AI replied:"
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 13,
                  color: "#3b3b3b"
                },
                children: esc.outbound_text
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "hub-resolve-row",
            children: [/* @__PURE__ */ jsxs(fetcher.Form, {
              method: "post",
              className: "hub-resolve-row",
              style: {
                flex: 1
              },
              children: [/* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "intent",
                value: "resolve"
              }), /* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "id",
                value: esc.id
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  flex: 1
                },
                children: /* @__PURE__ */ jsx("input", {
                  name: "notes",
                  placeholder: "Resolution notes (optional)",
                  style: {
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd5c4",
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "'Montserrat', sans-serif",
                    background: "white",
                    boxSizing: "border-box"
                  }
                })
              }), /* @__PURE__ */ jsx("button", {
                type: "submit",
                style: {
                  padding: "8px 16px",
                  background: "#2e7d32",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  whiteSpace: "nowrap"
                },
                children: "Mark Resolved"
              })]
            }), /* @__PURE__ */ jsxs(fetcher.Form, {
              method: "post",
              children: [/* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "intent",
                value: "dismiss"
              }), /* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "id",
                value: esc.id
              }), /* @__PURE__ */ jsx("button", {
                type: "submit",
                style: {
                  padding: "8px 16px",
                  background: "#f5f5f5",
                  color: "#666",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif"
                },
                children: "Dismiss"
              })]
            })]
          })]
        }, esc.id);
      })]
    }), open.length === 0 && /* @__PURE__ */ jsxs("div", {
      style: {
        background: "white",
        borderRadius: 12,
        padding: 40,
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginBottom: 32
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 15,
          fontWeight: 600,
          color: "#2e7d32",
          marginBottom: 4
        },
        children: "All clear"
      }), /* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 13,
          color: "#8a8478"
        },
        children: "No open escalations"
      })]
    }), resolved.length > 0 && /* @__PURE__ */ jsxs("div", {
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "#aaa",
          marginBottom: 12
        },
        children: "Resolved"
      }), resolved.map((esc) => {
        const link = ghlLink(esc.contact_id);
        return /* @__PURE__ */ jsx("div", {
          style: {
            background: "white",
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            opacity: 0.6
          },
          children: /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            },
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#3b3b3b"
                },
                children: esc.contact_name || "Unknown"
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  fontSize: 12,
                  color: "#8a8478",
                  marginTop: 2
                },
                children: [esc.location_tag || "-", " | ", new Date(esc.created_at).toLocaleString("en-AU", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                }), esc.escalation_notes && ` | ${esc.escalation_notes}`]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  padding: "3px 10px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#e8f5e9",
                  color: "#2e7d32"
                },
                children: esc.escalation_status
              }), link && /* @__PURE__ */ jsx("a", {
                href: link,
                target: "_blank",
                rel: "noopener noreferrer",
                style: {
                  color: "#5b9ea6",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none"
                },
                children: "GHL"
              })]
            })]
          })
        }, esc.id);
      })]
    })]
  });
});
const route22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: _app_hub_$slug_escalations
}, Symbol.toStringTag, { value: "Module" }));
async function action({
  request,
  params
}) {
  const {
    supabase
  } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const {
    data: client
  } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return {
    error: "Client not found"
  };
  if (intent === "test_message") {
    const message = form.get("message");
    form.get("contact_name") || "Test Lead";
    form.get("location") || "";
    const channel = form.get("channel") || "SMS";
    const testProfile = form.get("profile") || "promo";
    const history = form.get("history") || "[]";
    const [brandRes, offersRes, locationsRes, faqsRes, servicesRes, blockedRes, trainingRes] = await Promise.all([supabase.from("msg_brand_config").select("*").eq("client_id", client.id).single(), supabase.from("msg_offers").select("*").eq("client_id", client.id).eq("is_active", true), supabase.from("msg_locations").select("*").eq("client_id", client.id).eq("is_active", true), supabase.from("msg_faqs").select("*").eq("client_id", client.id).eq("is_active", true).order("times_used", {
      ascending: false
    }), supabase.from("msg_services").select("*").eq("client_id", client.id).eq("is_active", true), supabase.from("msg_blocked_topics").select("*").eq("client_id", client.id), supabase.from("msg_training_examples").select("*").eq("client_id", client.id).eq("is_active", true)]);
    const brand = brandRes.data || {};
    const offers = offersRes.data || [];
    const locations = locationsRes.data || [];
    const faqs = faqsRes.data || [];
    const services = servicesRes.data || [];
    const blocked = blockedRes.data || [];
    const training = trainingRes.data || [];
    const assistantName = brand.assistant_name || "Assistant";
    const clientName = (await supabase.from("msg_clients").select("name").eq("id", client.id).single()).data?.name || "Client";
    const profileFaqs = faqs.filter((f) => !f.profile || f.profile === "shared" || f.profile === testProfile);
    const profileTraining = training.filter((t) => !t.profile || t.profile === "shared" || t.profile === testProfile);
    let prompt = `# ${assistantName} - AI Messaging Assistant for ${clientName}

`;
    if (testProfile === "general") {
      prompt += `You are ${assistantName}, a ${brand.tone || "friendly"} messaging assistant for ${clientName}.
`;
      prompt += `You respond to people who message us on Facebook or Instagram with general enquiries about our services.
`;
      prompt += `You should be helpful but conservative. If you are not sure about the answer, escalate rather than guess.
`;
      prompt += `Use the general booking link when directing people to book, not the promo link.

`;
      prompt += `## Location Clarification (IMPORTANT)
`;
      prompt += `We have multiple locations. Before providing any booking link or address:
`;
      prompt += `1. Check if the lead has already mentioned a location in the conversation.
`;
      prompt += `2. If yes, use that location's details and general booking link.
`;
      prompt += `3. If no, ask which location they prefer. Keep it natural, e.g. "We have two locations — Aitkenvale and Fairfield. Which one works best for you?"
`;
      prompt += `4. Do NOT guess or default to a location. Always clarify first.

`;
    } else {
      prompt += `You are ${assistantName}, a ${brand.tone || "friendly"} messaging assistant for ${clientName}.
`;
      prompt += `You respond to leads who have enquired about our services.

`;
    }
    prompt += `## CRITICAL SAFETY RULES
`;
    prompt += `- You are ${assistantName}. NEVER say you are an AI, chatbot, bot, or automated system.
`;
    prompt += `- NEVER reference any other business outside ${clientName}.
`;
    prompt += `- NEVER share personal information about the business owner, staff, or other leads.
`;
    prompt += `- NEVER provide medical advice. Escalate immediately.
`;
    prompt += `- NEVER fabricate information.

`;
    if (blocked.length > 0) {
      prompt += `## BLOCKED TOPICS
`;
      blocked.forEach((b) => {
        prompt += `- ${b.topic}: ${b.reason || ""}
`;
      });
      prompt += `
`;
    }
    prompt += `## Communication Style
`;
    prompt += `- Tone: ${brand.tone || "friendly"}
`;
    prompt += `- First contact greeting: ${brand.greeting_style || "Hi [name]"}
`;
    prompt += `- Australian spelling throughout
`;
    if (channel === "SMS") {
      prompt += `- Do NOT use emojis. Target 160 chars, max 306. GSM-7 encoding.
`;
    } else {
      prompt += `- Emojis allowed in social media DMs.
`;
    }
    prompt += `
`;
    if (brand.phone_number) {
      prompt += `## Contact
- Phone: ${brand.phone_number}

`;
    }
    if (locations.length > 0) {
      prompt += `## Locations
`;
      locations.forEach((loc) => {
        prompt += `### ${loc.name}
`;
        if (loc.address) prompt += `- Address: ${loc.address}
`;
        if (loc.booking_link) prompt += `- Promo booking link: ${loc.booking_link}
`;
        if (loc.general_booking_link) prompt += `- General booking link: ${loc.general_booking_link}
`;
      });
      prompt += `
`;
    }
    if (offers.length > 0) {
      prompt += `## Current Offers
`;
      offers.forEach((o) => {
        prompt += `### ${o.name}
`;
        if (o.price) prompt += `- Price: ${o.price}
`;
        if (o.description) prompt += `- ${o.description}
`;
        if (o.terms) prompt += `- Terms: ${o.terms}
`;
        if (o.one_per_customer) prompt += `- One per customer
`;
      });
      prompt += `
`;
    }
    if (services.length > 0) {
      prompt += `## Services
`;
      services.forEach((s) => {
        let line = `- ${s.name}`;
        if (s.price_range) line += ` (${s.price_range})`;
        if (s.duration) line += ` | ${s.duration}`;
        prompt += line + `
`;
      });
      prompt += `
`;
    }
    const directFaqs = profileFaqs.filter((f) => !f.response_type || f.response_type === "direct");
    const escalateFaqs = profileFaqs.filter((f) => f.response_type === "escalate");
    const instructionFaqs = profileFaqs.filter((f) => f.response_type === "instruction");
    if (directFaqs.length > 0) {
      prompt += `## Frequently Asked Questions (Direct Responses)
`;
      prompt += `Use these answers when the lead asks the matching question. Send the answer as your response.

`;
      directFaqs.forEach((f) => {
        prompt += `**Q: ${f.question}**
A: ${f.answer}

`;
      });
    }
    if (escalateFaqs.length > 0) {
      prompt += `## Escalation Topics (DO NOT RESPOND — ESCALATE IMMEDIATELY)
`;
      prompt += `If the lead asks about ANY of these topics, return ONLY: ESCALATE: [topic]. Do NOT send any message.

`;
      escalateFaqs.forEach((f) => {
        prompt += `- **${f.question}** → ESCALATE immediately. Reason: ${f.answer}
`;
      });
      prompt += `
`;
    }
    if (instructionFaqs.length > 0) {
      prompt += `## FAQ Instructions (Rules, NOT text to send)
`;
      instructionFaqs.forEach((f) => {
        prompt += `- When asked about **${f.question}**: ${f.answer}
`;
      });
      prompt += `
`;
    }
    const instructions = profileTraining.filter((t) => t.correction_type === "instruction");
    const exactExamples = profileTraining.filter((t) => t.correction_type !== "instruction");
    if (instructions.length > 0) {
      prompt += `## SYSTEM RULES (HIGHEST PRIORITY — OVERRIDE ALL TRAINING EXAMPLES BELOW)
`;
      prompt += `These rules MUST be followed. If a rule conflicts with a training example below, the rule wins.

`;
      instructions.forEach((t) => {
        prompt += `- RULE: ${t.correct_response}
`;
        if (t.notes) prompt += `  Context: ${t.notes}
`;
      });
      prompt += `
`;
    }
    if (exactExamples.length > 0) {
      prompt += `## Training Examples (Reference Responses)
`;
      prompt += `Use these ONLY when the lead's message closely matches. If no match and no FAQ covers the question, follow SYSTEM RULES above.

`;
      exactExamples.forEach((t) => {
        prompt += `Lead: "${t.inbound_text}"
`;
        prompt += `Correct response: "${t.correct_response}"
`;
        if (t.notes) prompt += `Note: ${t.notes}
`;
        prompt += `
`;
      });
    }
    prompt += `## Post-Booking Response
`;
    prompt += `If a lead says they have booked, respond with: "${brand.post_booking_response || "Amazing, see you then!"}"
`;
    prompt += `Do not confirm or check any booking details.

`;
    prompt += `## Lead Declines
If a lead is not interested, return ONLY: MARK_LOST: Lead declined offer

`;
    prompt += `## Escalation
If you cannot handle something, return: ESCALATE: [reason]
`;
    let parsedHistory = [];
    try {
      parsedHistory = JSON.parse(history);
    } catch {
    }
    const messages = [];
    parsedHistory.forEach((m) => {
      messages.push({
        role: m.role,
        content: m.content
      });
    });
    messages.push({
      role: "user",
      content: message
    });
    const supabaseUrl = process.env.SUPABASE_URL || "https://lavpnfluvywcjeiyuash.supabase.co";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDEzODcsImV4cCI6MjA4OTE3NzM4N30.X_GTCS1TY8aA9UeF7s76KtMYFymii_gLRceqLP09Ep0";
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-sandbox`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          system: prompt,
          messages
        })
      });
      const data2 = await res.json();
      if (data2.error) return {
        error: data2.error
      };
      if (!data2.reply) return {
        error: "No response generated"
      };
      return {
        reply: data2.reply,
        prompt_length: prompt.length
      };
    } catch (e) {
      return {
        error: `API error: ${e.message}`
      };
    }
  }
  if (intent === "save_correction") {
    const correctionType = form.get("correction_type") || "exact";
    const inboundText = form.get("inbound_text") || (correctionType === "instruction" ? "System rule" : "");
    const priority = correctionType === "instruction" ? 20 : 10;
    await supabase.from("msg_training_examples").insert({
      client_id: client.id,
      scenario: form.get("scenario") || null,
      inbound_text: inboundText,
      bad_response: form.get("bad_response") || null,
      correct_response: form.get("correct_response"),
      correction_type: correctionType,
      conversation_stage: form.get("conversation_stage") || "general",
      priority,
      notes: form.get("notes") || null,
      profile: form.get("profile") || "shared",
      source: form.get("source") || "sandbox",
      is_active: true
    });
    return {
      saved: true
    };
  }
  if (intent === "delete_example") {
    await supabase.from("msg_training_examples").delete().eq("id", form.get("id"));
    return {
      deleted: true
    };
  }
  if (intent === "update_example") {
    const id = form.get("id");
    const updates = {};
    if (form.get("inbound_text")) updates.inbound_text = form.get("inbound_text");
    if (form.get("correct_response")) updates.correct_response = form.get("correct_response");
    if (form.get("correction_type")) updates.correction_type = form.get("correction_type");
    if (form.get("notes") !== null) updates.notes = form.get("notes") || null;
    if (form.get("profile")) updates.profile = form.get("profile");
    updates.requires_location = (form.get("correct_response") || "").toString().includes("[booking_link]");
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    const res = await fetch(`${SB_URL}/rest/v1/msg_training_examples?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_SERVICE_KEY}`,
        "apikey": SB_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) return {
      error: "Failed to update"
    };
    return {
      updated: true
    };
  }
  if (intent === "rate_production") {
    const logId = form.get("log_id");
    const rating = form.get("rating");
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    const reviewStatus = rating === "bad" ? "corrected" : rating === "dismissed" ? "dismissed" : "good";
    await fetch(`${SB_URL}/rest/v1/msg_conversation_logs?id=eq.${logId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${SB_SERVICE_KEY}`,
        "apikey": SB_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        review_status: reviewStatus
      })
    });
    if (rating === "bad") {
      await fetch(`${SB_URL}/rest/v1/msg_training_examples`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SB_SERVICE_KEY}`,
          "apikey": SB_SERVICE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: client.id,
          inbound_text: form.get("inbound_text"),
          bad_response: form.get("bad_response"),
          correct_response: form.get("correct_response"),
          correction_type: form.get("correction_type") || "exact",
          conversation_stage: "general",
          priority: 10,
          requires_location: (form.get("correct_response") || "").toString().includes("[booking_link]"),
          notes: form.get("notes") || null,
          source: "production",
          is_active: true
        })
      });
    }
    return {
      rated: true
    };
  }
  return {};
}
const _app_hub_$slug_training = UNSAFE_withComponentProps(function Training() {
  const {
    allClientData
  } = useOutletContext();
  const {
    slug
  } = useParams();
  const data2 = allClientData[slug] || {};
  const client = data2.client || {};
  const locations = data2.locations || [];
  const conversations = data2.conversations?.logs || [];
  const fetcher = useFetcher();
  const [tab, setTab] = useState("sandbox");
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [contactName, setContactName] = useState("Sarah");
  const [selectedLocation, setSelectedLocation] = useState(locations[0]?.tag || "");
  const [channel, setChannel] = useState("SMS");
  const [testProfile, setTestProfile] = useState("promo");
  const [correcting, setCorrecting] = useState(null);
  const [reviewingLog, setReviewingLog] = useState(null);
  const chatEndRef = useRef(null);
  const [examples, setExamples] = useState([]);
  useFetcher();
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [chatHistory]);
  useEffect(() => {
    if (fetcher.data && fetcher.data.reply) {
      setChatHistory((prev) => [...prev, {
        role: "assistant",
        content: fetcher.data.reply
      }]);
    }
  }, [fetcher.data]);
  const sendTestMessage = () => {
    if (!inputMsg.trim()) return;
    const newHistory = [...chatHistory, {
      role: "user",
      content: inputMsg
    }];
    setChatHistory(newHistory);
    const formData = new FormData();
    formData.set("intent", "test_message");
    formData.set("message", inputMsg);
    formData.set("contact_name", contactName);
    formData.set("location", selectedLocation);
    formData.set("channel", channel);
    formData.set("profile", testProfile);
    formData.set("history", JSON.stringify(chatHistory));
    fetcher.submit(formData, {
      method: "post"
    });
    setInputMsg("");
  };
  const resetChat = () => {
    setChatHistory([]);
    setCorrecting(null);
  };
  const saveCorrection = (idx, correctResponse, notes) => {
    const userMsg = chatHistory[idx - 1]?.content || "";
    const badResponse = chatHistory[idx]?.content || "";
    const formData = new FormData();
    formData.set("intent", "save_correction");
    formData.set("inbound_text", userMsg);
    formData.set("bad_response", badResponse);
    formData.set("correct_response", correctResponse);
    formData.set("notes", notes);
    formData.set("scenario", `${selectedLocation} | ${channel}`);
    formData.set("source", "sandbox");
    fetcher.submit(formData, {
      method: "post"
    });
    setCorrecting(null);
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      maxWidth: 800,
      width: "100%"
    },
    children: [/* @__PURE__ */ jsx("h1", {
      style: {
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 700,
        fontSize: 24,
        color: "#3b3b3b",
        margin: 0
      },
      children: "AI Training"
    }), /* @__PURE__ */ jsx("p", {
      style: {
        color: "#8a8478",
        fontSize: 13,
        margin: "4px 0 24px"
      },
      children: client.name
    }), /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        gap: 4,
        marginBottom: 24,
        background: "#eee8dc",
        borderRadius: 8,
        padding: 4
      },
      children: [{
        key: "sandbox",
        label: "Test Sandbox"
      }, {
        key: "examples",
        label: "Knowledge Base"
      }, {
        key: "rules",
        label: "System Rules"
      }, {
        key: "review",
        label: "Review Responses"
      }].map((t) => /* @__PURE__ */ jsx("button", {
        onClick: () => setTab(t.key),
        style: {
          flex: 1,
          padding: "10px 16px",
          borderRadius: 6,
          border: "none",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Montserrat', sans-serif",
          background: tab === t.key ? "#3b3b3b" : "transparent",
          color: tab === t.key ? "#f5f0e8" : "#5a5a5a",
          transition: "all 0.15s"
        },
        children: t.label
      }, t.key))
    }), tab === "sandbox" && /* @__PURE__ */ jsxs("div", {
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 11,
            fontWeight: 600,
            color: "#8a8478",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 10
          },
          children: "Test Scenario"
        }), /* @__PURE__ */ jsxs("div", {
          className: "hub-grid-3",
          style: {
            gap: 12
          },
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSm,
              children: "Lead Name"
            }), /* @__PURE__ */ jsx("input", {
              value: contactName,
              onChange: (e) => setContactName(e.target.value),
              style: inputSm
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSm,
              children: "Location"
            }), /* @__PURE__ */ jsxs("select", {
              value: selectedLocation,
              onChange: (e) => setSelectedLocation(e.target.value),
              style: inputSm,
              children: [locations.map((l) => /* @__PURE__ */ jsx("option", {
                value: l.tag,
                children: l.name
              }, l.tag)), locations.length === 0 && /* @__PURE__ */ jsx("option", {
                value: "",
                children: "No locations"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSm,
              children: "Channel"
            }), /* @__PURE__ */ jsxs("select", {
              value: channel,
              onChange: (e) => setChannel(e.target.value),
              style: inputSm,
              children: [/* @__PURE__ */ jsx("option", {
                value: "SMS",
                children: "SMS"
              }), /* @__PURE__ */ jsx("option", {
                value: "FB",
                children: "Facebook DM"
              }), /* @__PURE__ */ jsx("option", {
                value: "IG",
                children: "Instagram DM"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSm,
              children: "Profile"
            }), /* @__PURE__ */ jsxs("select", {
              value: testProfile,
              onChange: (e) => {
                setTestProfile(e.target.value);
                setChatHistory([]);
              },
              style: {
                ...inputSm,
                background: testProfile === "general" ? "#e8f5e9" : "#e3f2fd"
              },
              children: [/* @__PURE__ */ jsx("option", {
                value: "promo",
                children: "Promo Lead"
              }), /* @__PURE__ */ jsx("option", {
                value: "general",
                children: "General Enquiry"
              })]
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          minHeight: 400
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1,
            padding: 20,
            overflowY: "auto",
            maxHeight: 500
          },
          children: [chatHistory.length === 0 && /* @__PURE__ */ jsxs("div", {
            style: {
              textAlign: "center",
              color: "#b0a89a",
              fontSize: 13,
              padding: 40
            },
            children: ["Type a message below to test how the AI responds.", /* @__PURE__ */ jsx("br", {}), "Try different scenarios to check the responses are correct."]
          }), chatHistory.map((msg, i) => /* @__PURE__ */ jsxs("div", {
            style: {
              marginBottom: 16
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
              },
              children: /* @__PURE__ */ jsx("div", {
                style: {
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.5,
                  background: msg.role === "user" ? "#3b3b3b" : "#f5f0e8",
                  color: msg.role === "user" ? "#f5f0e8" : "#3b3b3b",
                  borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                  borderBottomLeftRadius: msg.role === "user" ? 12 : 4
                },
                children: msg.content
              })
            }), msg.role === "assistant" && /* @__PURE__ */ jsx("div", {
              style: {
                display: "flex",
                gap: 8,
                marginTop: 6,
                justifyContent: "flex-start"
              },
              children: correcting === i ? null : /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx("button", {
                  onClick: () => {
                  },
                  style: rateBtn,
                  title: "Good response",
                  children: /* @__PURE__ */ jsx("span", {
                    style: {
                      fontSize: 14
                    },
                    children: "👍"
                  })
                }), /* @__PURE__ */ jsx("button", {
                  onClick: () => setCorrecting(i),
                  style: rateBtn,
                  title: "Needs correction",
                  children: /* @__PURE__ */ jsx("span", {
                    style: {
                      fontSize: 14
                    },
                    children: "👎"
                  })
                })]
              })
            }), correcting === i && /* @__PURE__ */ jsx(CorrectionForm, {
              onSave: (correct, notes, correctionType) => saveCorrection(i, correct, notes),
              onCancel: () => setCorrecting(null),
              badResponse: msg.content
            })]
          }, i)), fetcher.state === "submitting" && chatHistory[chatHistory.length - 1]?.role === "user" && /* @__PURE__ */ jsx("div", {
            style: {
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: 16
            },
            children: /* @__PURE__ */ jsx("div", {
              style: {
                padding: "10px 14px",
                borderRadius: 12,
                background: "#f5f0e8",
                fontSize: 13,
                color: "#b0a89a",
                borderBottomLeftRadius: 4
              },
              children: "Typing..."
            })
          }), /* @__PURE__ */ jsx("div", {
            ref: chatEndRef
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            borderTop: "1px solid #eee8dc",
            padding: 16,
            display: "flex",
            gap: 8
          },
          children: [/* @__PURE__ */ jsx("input", {
            value: inputMsg,
            onChange: (e) => setInputMsg(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendTestMessage();
              }
            },
            placeholder: `Message as ${contactName}...`,
            style: {
              flex: 1,
              padding: "10px 14px",
              border: "1px solid #ddd5c4",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "'Montserrat', sans-serif",
              outline: "none"
            },
            disabled: fetcher.state === "submitting"
          }), /* @__PURE__ */ jsx("button", {
            onClick: sendTestMessage,
            disabled: fetcher.state === "submitting",
            style: {
              padding: "10px 20px",
              background: "#3b3b3b",
              color: "#f5f0e8",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif",
              opacity: fetcher.state === "submitting" ? 0.5 : 1
            },
            children: "Send"
          }), /* @__PURE__ */ jsx("button", {
            onClick: resetChat,
            style: {
              padding: "10px 14px",
              background: "#eee8dc",
              color: "#3b3b3b",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif"
            },
            children: "Reset"
          })]
        })]
      }), fetcher.data?.saved && /* @__PURE__ */ jsx("div", {
        style: {
          marginTop: 12,
          padding: 12,
          background: "#e8f5e9",
          borderRadius: 8,
          fontSize: 13,
          color: "#2e7d32",
          fontWeight: 600
        },
        children: "Correction saved as a training example. The AI will learn from this."
      })]
    }), tab === "examples" && /* @__PURE__ */ jsx(TrainingExamples, {
      slug
    }), tab === "rules" && /* @__PURE__ */ jsx(SystemRules, {
      slug
    }), tab === "review" && /* @__PURE__ */ jsx(ReviewResponses, {
      conversations,
      fetcher,
      reviewingLog,
      setReviewingLog
    })]
  });
});
function ReviewResponses({
  conversations,
  fetcher,
  reviewingLog,
  setReviewingLog
}) {
  const [reviewProfile, setReviewProfile] = useState("all");
  const profileColors = {
    promo: {
      bg: "#e3f2fd",
      color: "#1565c0",
      label: "PROMO"
    },
    general: {
      bg: "#e8f5e9",
      color: "#2e7d32",
      label: "GENERAL"
    },
    unknown: {
      bg: "#f5f5f5",
      color: "#999",
      label: "LEGACY"
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsx("p", {
      style: {
        fontSize: 13,
        color: "#8a8478",
        marginBottom: 16
      },
      children: "Review real AI responses and flag ones that need correction. Corrections become training examples."
    }), /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        gap: 4,
        marginBottom: 16,
        background: "#eee8dc",
        borderRadius: 8,
        padding: 4
      },
      children: [{
        key: "all",
        label: "All"
      }, {
        key: "promo",
        label: "Promo"
      }, {
        key: "general",
        label: "General"
      }].map((t) => /* @__PURE__ */ jsxs("button", {
        onClick: () => setReviewProfile(t.key),
        style: {
          flex: 1,
          padding: "6px 10px",
          borderRadius: 6,
          border: "none",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Montserrat', sans-serif",
          background: reviewProfile === t.key ? "#3b3b3b" : "transparent",
          color: reviewProfile === t.key ? "#f5f0e8" : "#5a5a5a"
        },
        children: [t.label, " (", conversations.filter((l) => l.action === "responded" && l.outbound_text && !l.review_status && (t.key === "all" || (l.profile || "unknown") === t.key)).length, ")"]
      }, t.key))
    }), (() => {
      const allUnreviewed = conversations.filter((l) => l.action === "responded" && l.outbound_text && !l.review_status);
      const unreviewed = reviewProfile === "all" ? allUnreviewed : allUnreviewed.filter((l) => (l.profile || "unknown") === reviewProfile);
      if (unreviewed.length === 0) return /* @__PURE__ */ jsx("div", {
        style: {
          background: "white",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        },
        children: /* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 13,
            color: "#8a8478"
          },
          children: "All responses have been reviewed. New responses will appear here as the engine handles leads."
        })
      });
      return /* @__PURE__ */ jsxs(Fragment, {
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            fontSize: 12,
            color: "#8a8478",
            marginBottom: 12
          },
          children: [unreviewed.length, " response", unreviewed.length !== 1 ? "s" : "", " to review"]
        }), unreviewed.map((log) => /* @__PURE__ */ jsxs("div", {
          style: {
            background: "white",
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              fontSize: 11,
              color: "#8a8478",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap"
            },
            children: [/* @__PURE__ */ jsxs("span", {
              children: [log.contact_name, " | ", log.location_tag, " | ", (log.channel || "").replace("TYPE_", ""), " | ", new Date(log.created_at).toLocaleString("en-AU", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
              })]
            }), (() => {
              const pc = profileColors[log.profile || "unknown"] || profileColors.unknown;
              return /* @__PURE__ */ jsx("span", {
                style: {
                  padding: "1px 6px",
                  borderRadius: 8,
                  fontSize: 9,
                  fontWeight: 600,
                  background: pc.bg,
                  color: pc.color
                },
                children: pc.label
              });
            })()]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              background: "#faf8f5",
              borderRadius: 8,
              padding: 12,
              marginBottom: 8
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 12,
                color: "#8a8478",
                marginBottom: 2
              },
              children: "Lead:"
            }), /* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 13,
                color: "#3b3b3b"
              },
              children: log.inbound_text
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              background: "#f0f7f0",
              borderRadius: 8,
              padding: 12,
              marginBottom: 8
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 12,
                color: "#8a8478",
                marginBottom: 2
              },
              children: "AI replied:"
            }), /* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 13,
                color: "#3b3b3b"
              },
              children: log.outbound_text
            })]
          }), reviewingLog === log.id ? /* @__PURE__ */ jsx(CorrectionForm, {
            onSave: (correct, notes, correctionType) => {
              const formData = new FormData();
              formData.set("intent", "rate_production");
              formData.set("log_id", log.id);
              formData.set("rating", "bad");
              formData.set("inbound_text", log.inbound_text);
              formData.set("bad_response", log.outbound_text);
              formData.set("correct_response", correct);
              formData.set("correction_type", correctionType);
              formData.set("notes", notes);
              fetcher.submit(formData, {
                method: "post"
              });
              setReviewingLog(null);
            },
            onCancel: () => setReviewingLog(null),
            badResponse: log.outbound_text
          }) : /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 8
            },
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => {
                const formData = new FormData();
                formData.set("intent", "rate_production");
                formData.set("log_id", log.id);
                formData.set("rating", "good");
                fetcher.submit(formData, {
                  method: "post"
                });
              },
              style: {
                ...rateBtn,
                fontSize: 12,
                padding: "6px 12px",
                background: "#e8f5e9",
                color: "#2e7d32"
              },
              title: "Good response",
              children: "Good"
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => setReviewingLog(log.id),
              style: {
                ...rateBtn,
                fontSize: 12,
                padding: "6px 12px",
                background: "#ffebee",
                color: "#c62828"
              },
              title: "Needs correction",
              children: "Needs Correction"
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => {
                const formData = new FormData();
                formData.set("intent", "rate_production");
                formData.set("log_id", log.id);
                formData.set("rating", "dismissed");
                fetcher.submit(formData, {
                  method: "post"
                });
              },
              style: {
                ...rateBtn,
                fontSize: 12,
                padding: "6px 12px",
                background: "#f5f5f5",
                color: "#999"
              },
              title: "Ignore this response",
              children: "Ignore"
            })]
          })]
        }, log.id))]
      });
    })()]
  });
}
function CorrectionForm({
  onSave,
  onCancel,
  badResponse
}) {
  const [correct, setCorrect] = useState("");
  const [notes, setNotes] = useState("");
  const [correctionType, setCorrectionType] = useState("exact");
  const toggleStyle = (active) => ({
    flex: 1,
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Montserrat', sans-serif",
    transition: "all 0.15s",
    background: active ? "#3b3b3b" : "transparent",
    color: active ? "#f5f0e8" : "#8a8478"
  });
  return /* @__PURE__ */ jsxs("div", {
    style: {
      background: "#fff8f0",
      borderRadius: 8,
      padding: 14,
      marginTop: 8,
      border: "1px solid #ffe0b2"
    },
    children: [/* @__PURE__ */ jsx("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: "#ef6c00",
        marginBottom: 8
      },
      children: "What should the AI have said instead?"
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        gap: 2,
        marginBottom: 10,
        background: "#eee8dc",
        borderRadius: 6,
        padding: 3
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => setCorrectionType("exact"),
        style: toggleStyle(correctionType === "exact"),
        children: "Exact Response"
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => setCorrectionType("instruction"),
        style: toggleStyle(correctionType === "instruction"),
        children: "Instruction"
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: {
        fontSize: 11,
        color: "#8a8478",
        marginBottom: 6
      },
      children: correctionType === "exact" ? "Type the exact response the AI should use (word for word)." : "Give the AI guidance on what to do differently (e.g. don't mention deposits, keep it shorter, etc)."
    }), /* @__PURE__ */ jsx("textarea", {
      value: correct,
      onChange: (e) => setCorrect(e.target.value),
      placeholder: correctionType === "exact" ? "Type the correct response..." : "e.g. Keep the response shorter and don't repeat the offer details...",
      rows: 3,
      style: {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #ddd5c4",
        borderRadius: 6,
        fontSize: 13,
        fontFamily: "'Montserrat', sans-serif",
        background: "white",
        boxSizing: "border-box",
        resize: "vertical",
        marginBottom: 8
      }
    }), /* @__PURE__ */ jsx("input", {
      value: notes,
      onChange: (e) => setNotes(e.target.value),
      placeholder: "Why is this better? (optional)",
      style: {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #ddd5c4",
        borderRadius: 6,
        fontSize: 13,
        fontFamily: "'Montserrat', sans-serif",
        background: "white",
        boxSizing: "border-box",
        marginBottom: 8
      }
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        gap: 8
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => {
          if (correct.trim()) onSave(correct.trim(), notes.trim(), correctionType);
        },
        style: {
          padding: "8px 16px",
          background: "#2e7d32",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Montserrat', sans-serif"
        },
        children: "Save Correction"
      }), /* @__PURE__ */ jsx("button", {
        onClick: onCancel,
        style: {
          padding: "8px 16px",
          background: "#f5f5f5",
          color: "#666",
          border: "none",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Montserrat', sans-serif"
        },
        children: "Cancel"
      })]
    })]
  });
}
function TrainingExamples({
  slug
}) {
  const {
    allClientData
  } = useOutletContext();
  const data2 = allClientData[slug] || {};
  const allExamples = data2.trainingExamples || [];
  const examples = allExamples.filter((e) => e.correction_type !== "instruction");
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [profileFilter, setProfileFilter] = useState("all");
  const filteredExamples = profileFilter === "all" ? examples : examples.filter((e) => e.profile === profileFilter);
  const sourceLabels = {
    sandbox: {
      bg: "#e3f2fd",
      color: "#1565c0",
      label: "Sandbox"
    },
    production: {
      bg: "#fff3e0",
      color: "#ef6c00",
      label: "Review"
    },
    manual: {
      bg: "#eee8dc",
      color: "#3b3b3b",
      label: "Manual"
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16
      },
      children: [/* @__PURE__ */ jsx("p", {
        style: {
          fontSize: 13,
          color: "#8a8478",
          flex: 1,
          marginRight: 16
        },
        children: "Training examples teach the AI how to respond correctly. Each correction you make in the sandbox or from reviewing production responses appears here."
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => setShowAdd(!showAdd),
        style: {
          ...btnPrimary,
          whiteSpace: "nowrap"
        },
        children: showAdd ? "Cancel" : "Add Example"
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        gap: 4,
        marginBottom: 16,
        background: "#eee8dc",
        borderRadius: 8,
        padding: 4
      },
      children: [{
        key: "all",
        label: "All"
      }, {
        key: "shared",
        label: "Shared"
      }, {
        key: "promo",
        label: "Promo"
      }, {
        key: "general",
        label: "General"
      }].map((t) => /* @__PURE__ */ jsx("button", {
        onClick: () => setProfileFilter(t.key),
        style: {
          flex: 1,
          padding: "6px 10px",
          borderRadius: 6,
          border: "none",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Montserrat', sans-serif",
          background: profileFilter === t.key ? "#3b3b3b" : "transparent",
          color: profileFilter === t.key ? "#f5f0e8" : "#5a5a5a"
        },
        children: t.label
      }, t.key))
    }), showAdd && /* @__PURE__ */ jsx("div", {
      style: {
        background: "white",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      },
      children: /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        onSubmit: () => setShowAdd(false),
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "save_correction"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "source",
          value: "manual"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSm,
            children: "Type"
          }), /* @__PURE__ */ jsxs("select", {
            name: "correction_type",
            defaultValue: "exact",
            style: inputFull,
            onChange: (e) => {
              const trigger = document.getElementById("kb-trigger-field");
              const respLabel = document.getElementById("kb-response-label");
              const respInput = document.getElementById("kb-response-input");
              if (trigger) trigger.style.display = e.target.value === "instruction" ? "none" : "block";
              if (respLabel) respLabel.textContent = e.target.value === "escalate" ? "Reason (optional)" : e.target.value === "instruction" ? "Instruction" : "Response";
              if (respInput) {
                respInput.required = e.target.value !== "escalate";
                respInput.rows = e.target.value === "escalate" ? 1 : 3;
                respInput.placeholder = e.target.value === "escalate" ? "e.g. Medical question, Sensitive topic" : e.target.value === "instruction" ? "e.g. Keep responses under 160 characters for SMS" : "Type the exact response...";
              }
            },
            children: [/* @__PURE__ */ jsx("option", {
              value: "exact",
              children: "Exact Response (when lead says X, respond with Y)"
            }), /* @__PURE__ */ jsx("option", {
              value: "escalate",
              children: "Escalate (do not reply, escalate to owner)"
            }), /* @__PURE__ */ jsx("option", {
              value: "instruction",
              children: "Instruction (general rule for the AI to follow)"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          id: "kb-trigger-field",
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSm,
            children: "When the lead says"
          }), /* @__PURE__ */ jsx("input", {
            name: "inbound_text",
            placeholder: 'e.g. "How much does it cost?"',
            style: inputFull
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            id: "kb-response-label",
            style: labelSm,
            children: "Response"
          }), /* @__PURE__ */ jsx("textarea", {
            id: "kb-response-input",
            name: "correct_response",
            required: true,
            rows: 3,
            placeholder: "Type the exact response...",
            style: {
              ...inputFull,
              resize: "vertical"
            }
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSm,
            children: "Notes (optional)"
          }), /* @__PURE__ */ jsx("input", {
            name: "notes",
            placeholder: "Why this response or rule exists",
            style: inputFull
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSm,
            children: "Profile"
          }), /* @__PURE__ */ jsxs("select", {
            name: "profile",
            defaultValue: "shared",
            style: inputFull,
            children: [/* @__PURE__ */ jsx("option", {
              value: "shared",
              children: "Shared (both profiles)"
            }), /* @__PURE__ */ jsx("option", {
              value: "promo",
              children: "Promo only"
            }), /* @__PURE__ */ jsx("option", {
              value: "general",
              children: "General only"
            })]
          })]
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          style: {
            ...btnPrimary,
            background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b",
            transition: "all 0.3s"
          },
          children: fetcher.state === "submitting" ? "Saving..." : "Save"
        })]
      })
    }), filteredExamples.length === 0 && /* @__PURE__ */ jsx("div", {
      style: {
        background: "white",
        borderRadius: 12,
        padding: 40,
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      },
      children: /* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 13,
          color: "#8a8478"
        },
        children: "No training examples yet. Use the sandbox to test responses and correct any that need fixing."
      })
    }), filteredExamples.map((ex) => {
      const src = sourceLabels[ex.source] || sourceLabels.manual;
      if (editingId === ex.id) {
        return /* @__PURE__ */ jsx("div", {
          style: {
            background: "#faf8f5",
            borderRadius: 12,
            padding: 20,
            marginBottom: 10,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "2px solid #c4a882"
          },
          children: /* @__PURE__ */ jsxs(fetcher.Form, {
            method: "post",
            onSubmit: () => setEditingId(null),
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "update_example"
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "id",
              value: ex.id
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 10
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSm,
                children: "When the lead says"
              }), /* @__PURE__ */ jsx("input", {
                name: "inbound_text",
                defaultValue: ex.inbound_text,
                style: inputFull
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 10
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSm,
                children: "Type"
              }), /* @__PURE__ */ jsxs("select", {
                name: "correction_type",
                defaultValue: ex.correction_type || "exact",
                style: inputFull,
                children: [/* @__PURE__ */ jsx("option", {
                  value: "exact",
                  children: "Exact Response"
                }), /* @__PURE__ */ jsx("option", {
                  value: "escalate",
                  children: "Escalate"
                }), /* @__PURE__ */ jsx("option", {
                  value: "instruction",
                  children: "Instruction"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 10
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSm,
                children: "Response / Instruction"
              }), /* @__PURE__ */ jsx("textarea", {
                name: "correct_response",
                defaultValue: ex.correct_response,
                rows: 3,
                style: {
                  ...inputFull,
                  resize: "vertical"
                }
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 10
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSm,
                children: "Notes (optional)"
              }), /* @__PURE__ */ jsx("input", {
                name: "notes",
                defaultValue: ex.notes || "",
                style: inputFull
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSm,
                children: "Profile"
              }), /* @__PURE__ */ jsxs("select", {
                name: "profile",
                defaultValue: ex.profile || "shared",
                style: inputFull,
                children: [/* @__PURE__ */ jsx("option", {
                  value: "shared",
                  children: "Shared (both profiles)"
                }), /* @__PURE__ */ jsx("option", {
                  value: "promo",
                  children: "Promo only"
                }), /* @__PURE__ */ jsx("option", {
                  value: "general",
                  children: "General only"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("button", {
                type: "submit",
                style: {
                  ...btnPrimary,
                  background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b",
                  transition: "all 0.3s"
                },
                children: fetcher.state === "submitting" ? "Saving..." : "Save"
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                onClick: () => setEditingId(null),
                style: {
                  ...btnPrimary,
                  background: "#eee8dc",
                  color: "#3b3b3b"
                },
                children: "Cancel"
              })]
            })]
          })
        }, ex.id);
      }
      return /* @__PURE__ */ jsxs("div", {
        style: {
          background: "white",
          borderRadius: 12,
          padding: 16,
          marginBottom: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          borderLeft: "3px solid #c4a882"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                background: src.bg,
                color: src.color
              },
              children: src.label
            }), /* @__PURE__ */ jsx("span", {
              style: {
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                background: ex.profile === "promo" ? "#e3f2fd" : ex.profile === "general" ? "#e8f5e9" : "#eee8dc",
                color: ex.profile === "promo" ? "#1565c0" : ex.profile === "general" ? "#2e7d32" : "#3b3b3b"
              },
              children: (ex.profile || "shared").toUpperCase()
            }), ex.correction_type === "escalate" && /* @__PURE__ */ jsx("span", {
              style: {
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                background: "#fff3e0",
                color: "#ef6c00"
              },
              children: "ESCALATE"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 10
            },
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => setEditingId(ex.id),
              style: {
                padding: "6px 12px",
                border: "none",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Montserrat', sans-serif",
                background: "#e3f2fd",
                color: "#1565c0"
              },
              children: "Edit"
            }), /* @__PURE__ */ jsxs(fetcher.Form, {
              method: "post",
              style: {
                display: "inline"
              },
              onSubmit: (e) => {
                if (!confirm("Delete this training example?")) e.preventDefault();
              },
              children: [/* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "intent",
                value: "delete_example"
              }), /* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "id",
                value: ex.id
              }), /* @__PURE__ */ jsx("button", {
                type: "submit",
                style: {
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  background: "#ffebee",
                  color: "#c62828"
                },
                children: "Delete"
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 8
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 11,
              color: "#8a8478",
              marginBottom: 2
            },
            children: "Lead says:"
          }), /* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 13,
              color: "#3b3b3b",
              fontWeight: 500
            },
            children: ex.inbound_text
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 4
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 11,
              color: ex.correction_type === "instruction" ? "#7b1fa2" : ex.correction_type === "escalate" ? "#ef6c00" : "#2e7d32",
              marginBottom: 2
            },
            children: ex.correction_type === "instruction" ? "Instruction:" : ex.correction_type === "escalate" ? "Escalate reason:" : "Correct response:"
          }), /* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 13,
              color: "#3b3b3b",
              fontStyle: ex.correction_type === "instruction" ? "italic" : "normal"
            },
            children: ex.correct_response
          })]
        }), ex.notes && /* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 12,
            color: "#8a8478",
            marginTop: 6,
            fontStyle: "italic"
          },
          children: ex.notes
        })]
      }, ex.id);
    })]
  });
}
function SystemRules({
  slug
}) {
  const {
    allClientData
  } = useOutletContext();
  const data2 = allClientData[slug] || {};
  const examples = data2.trainingExamples || [];
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const rules = examples.filter((e) => e.correction_type === "instruction");
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16
      },
      children: [/* @__PURE__ */ jsx("p", {
        style: {
          fontSize: 13,
          color: "#8a8478",
          flex: 1,
          marginRight: 16
        },
        children: 'System rules control how the AI behaves. These are behavioural instructions that override other responses. Use these for things like "never mention deposits unless asked" or "always escalate sensitive topics".'
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => setShowAdd(!showAdd),
        style: {
          ...btnPrimary,
          whiteSpace: "nowrap"
        },
        children: showAdd ? "Cancel" : "Add Rule"
      })]
    }), showAdd && /* @__PURE__ */ jsx("div", {
      style: {
        background: "white",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      },
      children: /* @__PURE__ */ jsxs(fetcher.Form, {
        method: "post",
        onSubmit: () => setShowAdd(false),
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "save_correction"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "source",
          value: "manual"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "correction_type",
          value: "instruction"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "conversation_stage",
          value: "general"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "priority",
          value: "20"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "inbound_text",
          value: "System rule"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSm,
            children: "Rule"
          }), /* @__PURE__ */ jsx("textarea", {
            name: "correct_response",
            required: true,
            rows: 3,
            placeholder: "e.g. Never mention deposits unless the lead specifically asks about payment...",
            style: {
              ...inputFull,
              resize: "vertical"
            }
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSm,
            children: "Notes (optional)"
          }), /* @__PURE__ */ jsx("input", {
            name: "notes",
            placeholder: "Why this rule exists",
            style: inputFull
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 12
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSm,
            children: "Profile"
          }), /* @__PURE__ */ jsxs("select", {
            name: "profile",
            defaultValue: "shared",
            style: inputFull,
            children: [/* @__PURE__ */ jsx("option", {
              value: "shared",
              children: "Shared (both profiles)"
            }), /* @__PURE__ */ jsx("option", {
              value: "promo",
              children: "Promo only"
            }), /* @__PURE__ */ jsx("option", {
              value: "general",
              children: "General only"
            })]
          })]
        }), /* @__PURE__ */ jsx("button", {
          type: "submit",
          style: {
            ...btnPrimary,
            background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b",
            transition: "all 0.3s"
          },
          children: fetcher.state === "submitting" ? "Saving..." : "Save Rule"
        })]
      })
    }), rules.length === 0 && !showAdd && /* @__PURE__ */ jsx("div", {
      style: {
        background: "white",
        borderRadius: 12,
        padding: 40,
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      },
      children: /* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 13,
          color: "#8a8478"
        },
        children: "No system rules yet. Add rules to control how the AI behaves."
      })
    }), rules.map((rule) => {
      if (editingId === rule.id) {
        return /* @__PURE__ */ jsx("div", {
          style: {
            background: "#faf8f5",
            borderRadius: 12,
            padding: 20,
            marginBottom: 10,
            border: "2px solid #7b1fa2"
          },
          children: /* @__PURE__ */ jsxs(fetcher.Form, {
            method: "post",
            onSubmit: () => setEditingId(null),
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "update_example"
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "id",
              value: rule.id
            }), /* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "correction_type",
              value: "instruction"
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 10
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSm,
                children: "Rule"
              }), /* @__PURE__ */ jsx("textarea", {
                name: "correct_response",
                defaultValue: rule.correct_response,
                rows: 3,
                style: {
                  ...inputFull,
                  resize: "vertical"
                }
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                marginBottom: 12
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSm,
                children: "Notes"
              }), /* @__PURE__ */ jsx("input", {
                name: "notes",
                defaultValue: rule.notes || "",
                style: inputFull
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("button", {
                type: "submit",
                style: {
                  ...btnPrimary,
                  background: fetcher.state === "submitting" ? "#2e7d32" : "#3b3b3b",
                  transition: "all 0.3s"
                },
                children: fetcher.state === "submitting" ? "Saving..." : "Save"
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                onClick: () => setEditingId(null),
                style: {
                  ...btnPrimary,
                  background: "#eee8dc",
                  color: "#3b3b3b"
                },
                children: "Cancel"
              })]
            })]
          })
        }, rule.id);
      }
      return /* @__PURE__ */ jsx("div", {
        style: {
          background: "white",
          borderRadius: 12,
          padding: 16,
          marginBottom: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          borderLeft: "3px solid #7b1fa2"
        },
        children: /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              flex: 1
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 13,
                color: "#3b3b3b",
                fontStyle: "italic"
              },
              children: rule.correct_response
            }), rule.notes && /* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 12,
                color: "#8a8478",
                marginTop: 6
              },
              children: rule.notes
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              gap: 10,
              flexShrink: 0,
              marginLeft: 12
            },
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => setEditingId(rule.id),
              style: {
                padding: "6px 12px",
                border: "none",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Montserrat', sans-serif",
                background: "#e3f2fd",
                color: "#1565c0"
              },
              children: "Edit"
            }), /* @__PURE__ */ jsxs(fetcher.Form, {
              method: "post",
              style: {
                display: "inline"
              },
              onSubmit: (e) => {
                if (!confirm("Delete this rule?")) e.preventDefault();
              },
              children: [/* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "intent",
                value: "delete_example"
              }), /* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "id",
                value: rule.id
              }), /* @__PURE__ */ jsx("button", {
                type: "submit",
                style: {
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  background: "#ffebee",
                  color: "#c62828"
                },
                children: "Delete"
              })]
            })]
          })]
        })
      }, rule.id);
    })]
  });
}
const labelSm = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#8a8478",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: 0.5
};
const inputSm = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ddd5c4",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif",
  background: "#faf8f5",
  boxSizing: "border-box"
};
const inputFull = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd5c4",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif",
  background: "#faf8f5",
  boxSizing: "border-box"
};
const rateBtn = {
  padding: "4px 8px",
  background: "#eee8dc",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Montserrat', sans-serif"
};
const btnPrimary = {
  padding: "10px 20px",
  background: "#3b3b3b",
  color: "#f5f0e8",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Montserrat', sans-serif"
};
const route23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: _app_hub_$slug_training
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-_WNw5omH.js", "imports": ["/assets/jsx-runtime-u17CrQMm.js", "/assets/chunk-EPOLDU6W-Dso2WXXj.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-BxTLzb_L.js", "imports": ["/assets/jsx-runtime-u17CrQMm.js", "/assets/chunk-EPOLDU6W-Dso2WXXj.js"], "css": ["/assets/root-Se2Osxsi.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-CvwOX8fM.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-CMDWm654.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.callback": { "id": "routes/auth.callback", "parentId": "root", "path": "auth/callback", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/auth.callback-7Qyn3esX.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.generate-link": { "id": "routes/api.generate-link", "parentId": "root", "path": "api/generate-link", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.generate-link-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app": { "id": "routes/_app", "parentId": "root", "path": void 0, "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app-CYnFnnWC.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.admin": { "id": "routes/_app.admin", "parentId": "routes/_app", "path": "admin", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.admin-oNw11gOH.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.admin.index": { "id": "routes/_app.admin.index", "parentId": "routes/_app.admin", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.admin.index-R_-T53Ew.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.admin.clients": { "id": "routes/_app.admin.clients", "parentId": "routes/_app.admin", "path": "clients", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.admin.clients-BbQhyvWB.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.admin.clients.$slug": { "id": "routes/_app.admin.clients.$slug", "parentId": "routes/_app.admin", "path": "clients/:slug", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.admin.clients._slug-B5R-TA57.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.admin.invite": { "id": "routes/_app.admin.invite", "parentId": "routes/_app.admin", "path": "invite", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.admin.invite-DRfvWVQ9.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.dashboard": { "id": "routes/_app.dashboard", "parentId": "routes/_app", "path": "dashboard/:slug?", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.dashboard-DLgg30Sl.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub": { "id": "routes/_app.hub", "parentId": "routes/_app", "path": "hub", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub-BoY3rBTJ.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub._index": { "id": "routes/_app.hub._index", "parentId": "routes/_app.hub", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._index-B2WpucbJ.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.admin.clients": { "id": "routes/_app.hub.admin.clients", "parentId": "routes/_app.hub", "path": "admin/clients", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub.admin.clients-BNiNdPz8.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.admin.onboarding": { "id": "routes/_app.hub.admin.onboarding", "parentId": "routes/_app.hub", "path": "admin/onboarding", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub.admin.onboarding-C-8izXBw.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.$slug.brand": { "id": "routes/_app.hub.$slug.brand", "parentId": "routes/_app.hub", "path": ":slug/brand", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._slug.brand-imN_19U8.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.$slug.settings": { "id": "routes/_app.hub.$slug.settings", "parentId": "routes/_app.hub", "path": ":slug/settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._slug.settings-Bf_OfS0c.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.$slug.offers": { "id": "routes/_app.hub.$slug.offers", "parentId": "routes/_app.hub", "path": ":slug/offers", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._slug.offers-CkzZChDM.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.$slug.faqs": { "id": "routes/_app.hub.$slug.faqs", "parentId": "routes/_app.hub", "path": ":slug/faqs", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._slug.faqs-rmDE1wZh.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.$slug.locations": { "id": "routes/_app.hub.$slug.locations", "parentId": "routes/_app.hub", "path": ":slug/locations", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._slug.locations-BtJ4SPk_.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.$slug.conversations": { "id": "routes/_app.hub.$slug.conversations", "parentId": "routes/_app.hub", "path": ":slug/conversations", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._slug.conversations-6Cv43Z9o.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.$slug.escalations": { "id": "routes/_app.hub.$slug.escalations", "parentId": "routes/_app.hub", "path": ":slug/escalations", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._slug.escalations-B-g7Wk1R.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_app.hub.$slug.training": { "id": "routes/_app.hub.$slug.training", "parentId": "routes/_app.hub", "path": ":slug/training", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_app.hub._slug.training-CFioUkfX.js", "imports": ["/assets/chunk-EPOLDU6W-Dso2WXXj.js", "/assets/jsx-runtime-u17CrQMm.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-8136f21f.js", "version": "8136f21f", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/auth.callback": {
    id: "routes/auth.callback",
    parentId: "root",
    path: "auth/callback",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/api.generate-link": {
    id: "routes/api.generate-link",
    parentId: "root",
    path: "api/generate-link",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/_app": {
    id: "routes/_app",
    parentId: "root",
    path: void 0,
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/_app.admin": {
    id: "routes/_app.admin",
    parentId: "routes/_app",
    path: "admin",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/_app.admin.index": {
    id: "routes/_app.admin.index",
    parentId: "routes/_app.admin",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route7
  },
  "routes/_app.admin.clients": {
    id: "routes/_app.admin.clients",
    parentId: "routes/_app.admin",
    path: "clients",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/_app.admin.clients.$slug": {
    id: "routes/_app.admin.clients.$slug",
    parentId: "routes/_app.admin",
    path: "clients/:slug",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/_app.admin.invite": {
    id: "routes/_app.admin.invite",
    parentId: "routes/_app.admin",
    path: "invite",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/_app.dashboard": {
    id: "routes/_app.dashboard",
    parentId: "routes/_app",
    path: "dashboard/:slug?",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/_app.hub": {
    id: "routes/_app.hub",
    parentId: "routes/_app",
    path: "hub",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/_app.hub._index": {
    id: "routes/_app.hub._index",
    parentId: "routes/_app.hub",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route13
  },
  "routes/_app.hub.admin.clients": {
    id: "routes/_app.hub.admin.clients",
    parentId: "routes/_app.hub",
    path: "admin/clients",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/_app.hub.admin.onboarding": {
    id: "routes/_app.hub.admin.onboarding",
    parentId: "routes/_app.hub",
    path: "admin/onboarding",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/_app.hub.$slug.brand": {
    id: "routes/_app.hub.$slug.brand",
    parentId: "routes/_app.hub",
    path: ":slug/brand",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/_app.hub.$slug.settings": {
    id: "routes/_app.hub.$slug.settings",
    parentId: "routes/_app.hub",
    path: ":slug/settings",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/_app.hub.$slug.offers": {
    id: "routes/_app.hub.$slug.offers",
    parentId: "routes/_app.hub",
    path: ":slug/offers",
    index: void 0,
    caseSensitive: void 0,
    module: route18
  },
  "routes/_app.hub.$slug.faqs": {
    id: "routes/_app.hub.$slug.faqs",
    parentId: "routes/_app.hub",
    path: ":slug/faqs",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/_app.hub.$slug.locations": {
    id: "routes/_app.hub.$slug.locations",
    parentId: "routes/_app.hub",
    path: ":slug/locations",
    index: void 0,
    caseSensitive: void 0,
    module: route20
  },
  "routes/_app.hub.$slug.conversations": {
    id: "routes/_app.hub.$slug.conversations",
    parentId: "routes/_app.hub",
    path: ":slug/conversations",
    index: void 0,
    caseSensitive: void 0,
    module: route21
  },
  "routes/_app.hub.$slug.escalations": {
    id: "routes/_app.hub.$slug.escalations",
    parentId: "routes/_app.hub",
    path: ":slug/escalations",
    index: void 0,
    caseSensitive: void 0,
    module: route22
  },
  "routes/_app.hub.$slug.training": {
    id: "routes/_app.hub.$slug.training",
    parentId: "routes/_app.hub",
    path: ":slug/training",
    index: void 0,
    caseSensitive: void 0,
    module: route23
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
