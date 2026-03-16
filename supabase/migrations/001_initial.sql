-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client')),
  display_name text,
  client_slug text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());

create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

-- Clients table
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  google_sheet_id text,
  ghl_location_id text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Admins can do everything with clients" on public.clients
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Clients can view own client" on public.clients
  for select using (
    slug = (select client_slug from public.profiles where id = auth.uid())
  );

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'client', coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
