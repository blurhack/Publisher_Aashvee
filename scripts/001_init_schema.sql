-- Create enum for app roles
do $$ begin
  create type public.app_role as enum ('admin', 'author', 'user');
exception
  when duplicate_object then null;
end $$;

-- Users' roles
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

-- Profiles (basic info)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upcoming books (admin managed)
create table if not exists public.upcoming_books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  genre text,
  cover_image_url text,
  publication_date date,
  total_author_positions int not null check (total_author_positions >= 0),
  available_positions int not null check (available_positions >= 0),
  price_per_position int not null check (price_per_position >= 0),
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Purchases (created by users, updated on payment callback)
create table if not exists public.authorship_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  upcoming_book_id uuid not null references public.upcoming_books(id) on delete cascade,
  positions_purchased int not null check (positions_purchased > 0),
  total_amount int not null check (total_amount >= 0),
  payment_status text not null default 'pending', -- pending|success|failed|cancelled
  payment_id text,
  phone_number text,
  bio text,
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- has_role helper
create or replace function public.has_role(_role public.app_role, _user_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id and ur.role = _role
  );
$$;

-- Indexes
create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_profiles_user on public.profiles(user_id);
create index if not exists idx_books_slug on public.upcoming_books(slug);
create index if not exists idx_purchases_user on public.authorship_purchases(user_id);
create index if not exists idx_purchases_book on public.authorship_purchases(upcoming_book_id);

-- Enable RLS
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.upcoming_books enable row level security;
alter table public.authorship_purchases enable row level security;

-- RLS: user_roles (only admins can read/write roles)
do $$ begin
  drop policy if exists user_roles_admin_all on public.user_roles;
exception when undefined_object then null; end $$;
create policy user_roles_admin_all on public.user_roles
  using (auth.uid() is not null and public.has_role('admin', auth.uid()))
  with check (auth.uid() is not null and public.has_role('admin', auth.uid()));

-- RLS: profiles (owner read/write)
do $$ begin
  drop policy if exists profiles_owner_select on public.profiles;
  drop policy if exists profiles_owner_upsert on public.profiles;
exception when undefined_object then null; end $$;
create policy profiles_owner_select on public.profiles
  for select using (auth.uid() = user_id);
create policy profiles_owner_upsert on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS: upcoming_books
do $$ begin
  drop policy if exists books_public_select on public.upcoming_books;
  drop policy if exists books_admin_cud on public.upcoming_books;
exception when undefined_object then null; end $$;
create policy books_public_select on public.upcoming_books
  for select using (true);
create policy books_admin_cud on public.upcoming_books
  for all using (public.has_role('admin', auth.uid()))
  with check (public.has_role('admin', auth.uid()));

-- RLS: authorship_purchases
do $$ begin
  drop policy if exists purchases_owner_select on public.authorship_purchases;
  drop policy if exists purchases_owner_insert on public.authorship_purchases;
  drop policy if exists purchases_admin_update on public.authorship_purchases;
exception when undefined_object then null; end $$;
create policy purchases_owner_select on public.authorship_purchases
  for select using (auth.uid() = user_id or public.has_role('admin', auth.uid()));
create policy purchases_owner_insert on public.authorship_purchases
  for insert with check (auth.uid() = user_id);
create policy purchases_admin_update on public.authorship_purchases
  for update using (public.has_role('admin', auth.uid()));

-- Seed: ensure the first admin by email (optional manual step handled by application)
-- To grant admin to a user, insert into user_roles(user_id, role) after the user signs up.
