import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("api/generate-link", "routes/api.generate-link.tsx"),
  layout("routes/_app.tsx", [
    route("admin", "routes/_app.admin.tsx", [
      index("routes/_app.admin.index.tsx"),
      route("clients", "routes/_app.admin.clients.tsx"),
      route("clients/:slug", "routes/_app.admin.clients.$slug.tsx"),
      route("invite", "routes/_app.admin.invite.tsx"),
    ]),
    route("dashboard", "routes/_app.dashboard.tsx"),
    route("hub", "routes/_app.hub.tsx", [
      index("routes/_app.hub._index.tsx"),
      route("admin/clients", "routes/_app.hub.admin.clients.tsx"),
      route("admin/onboarding", "routes/_app.hub.admin.onboarding.tsx"),
      route(":slug/brand", "routes/_app.hub.$slug.brand.tsx"),
      route(":slug/settings", "routes/_app.hub.$slug.settings.tsx"),
      route(":slug/offers", "routes/_app.hub.$slug.offers.tsx"),
      route(":slug/faqs", "routes/_app.hub.$slug.faqs.tsx"),
      route(":slug/locations", "routes/_app.hub.$slug.locations.tsx"),
      route(":slug/conversations", "routes/_app.hub.$slug.conversations.tsx"),
      route(":slug/escalations", "routes/_app.hub.$slug.escalations.tsx"),
      route(":slug/training", "routes/_app.hub.$slug.training.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
