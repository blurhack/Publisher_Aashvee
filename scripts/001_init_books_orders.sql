-- Create books and orders tables (Postgres / Supabase)
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  total_positions int not null check (total_positions > 0),
  available_positions int not null check (available_positions >= 0),
  price_per_position numeric(12,2) not null check (price_per_position >= 0),
  cover_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid references auth.users(id),
  email text not null,
  phone text not null,
  bio text,
  image_url text,
  count int not null check (count > 0),
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'created', -- created|paid|failed|cancelled
  phonepe_txn_id text,
  merchant_txn_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simple updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_books_updated on public.books;
create trigger trg_books_updated before update on public.books
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
for each row execute function public.set_updated_at();

-- RLS recommended (enable and add policies)
alter table public.books enable row level security;
alter table public.orders enable row level security;

-- Allow read for all on books
create policy if not exists books_read_all on public.books
for select using (true);

-- Allow insert/update for authenticated users on orders (own rows)
create policy if not exists orders_insert_auth on public.orders
for insert to authenticated with check (auth.uid() = user_id);

create policy if not exists orders_select_own on public.orders
for select to authenticated using (auth.uid() = user_id);

-- Admin (optional): use a role or service key on server to manage books/orders fully
