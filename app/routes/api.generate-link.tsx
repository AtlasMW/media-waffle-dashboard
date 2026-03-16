import { createSupabaseServerClient, createSupabaseServiceClient } from "~/lib/supabase.server";

export async function action({ request }: { request: Request }) {
  // Verify the requester is an admin
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return Response.json({ error: "Not authorised" }, { status: 403 });

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const clientSlug = formData.get("clientSlug") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !clientSlug || !displayName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const serviceClient = createSupabaseServiceClient();
  const origin = new URL(request.url).origin;

  // Check if user already exists
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === email);

  if (!existingUser) {
    // Create the user with a random password (they'll use magic link)
    const tempPassword = crypto.randomUUID();
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (createError) return Response.json({ error: createError.message }, { status: 500 });

    // Set their profile to client with the correct slug
    if (newUser?.user) {
      await serviceClient.from("profiles").upsert({
        id: newUser.user.id,
        role: "client",
        display_name: displayName,
        client_slug: clientSlug,
      });
    }
  } else {
    // Update existing user's profile slug if needed
    await serviceClient.from("profiles").upsert({
      id: existingUser.id,
      role: "client",
      display_name: displayName,
      client_slug: clientSlug,
    });
  }

  // Generate magic link
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (linkError) return Response.json({ error: linkError.message }, { status: 500 });

  // The generated link contains a token - construct the full URL
  // linkData.properties.hashed_token is the token
  const actionLink = linkData?.properties?.action_link;

  if (!actionLink) return Response.json({ error: "Failed to generate link" }, { status: 500 });

  return Response.json({ link: actionLink });
}
