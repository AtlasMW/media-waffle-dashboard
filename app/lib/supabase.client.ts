import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient(url: string, anonKey: string) {
  if (client) return client;
  client = createBrowserClient(url, anonKey);
  return client;
}
