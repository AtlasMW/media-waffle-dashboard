import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  layout("routes/_app.tsx", [
    route("admin", "routes/_app.admin.tsx", [
      index("routes/_app.admin.index.tsx"),
      route("clients", "routes/_app.admin.clients.tsx"),
      route("clients/:slug", "routes/_app.admin.clients.$slug.tsx"),
      route("invite", "routes/_app.admin.invite.tsx"),
    ]),
    route("dashboard", "routes/_app.dashboard.tsx"),
  ]),
] satisfies RouteConfig;
