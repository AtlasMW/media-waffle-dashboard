-- Drop ALL existing policies
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can do everything with clients" on public.clients;
drop policy if exists "Clients can view own client" on public.clients;

-- Recreate non-recursive policies for profiles
-- Users can always read their own profile (no recursion)
-- Admins can read all profiles using a direct auth.uid() check with security definer function

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());

-- This won't recurse because is_admin() is security definer (bypasses RLS)
create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

create policy "Admins can update all profiles" on public.profiles
  for update using (public.is_admin());

-- Clients table policies using the safe function
create policy "Admins can do everything with clients" on public.clients
  for all using (public.is_admin());

create policy "Clients can view own client" on public.clients
  for select using (
    slug = (select client_slug from public.profiles where id = auth.uid())
  );
