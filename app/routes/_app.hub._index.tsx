import type { Route } from "./+types/_app.hub._index";

export function loader({ request }: Route.LoaderArgs) {
  return Response.redirect(new URL("/hub/admin/clients", request.url).toString());
}

export default function HubIndex() {
  return null;
}
