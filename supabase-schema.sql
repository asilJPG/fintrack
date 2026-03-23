-- FinTrack Supabase Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- CATEGORIES
-- =====================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text default '📦',
  color text default '#6c63ff',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Insert default categories (shared for all users, user_id = null)
insert into categories (name, icon, color, is_default) values
  ('Еда', '🍔', '#ff9f43', true),
  ('Транспорт', '🚗', '#00b4d8', true),
  ('Покупки', '🛍️', '#f72585', true),
  ('Развлечения', '🎮', '#7209b7', true),
  ('Подписки', '📺', '#4cc9f0', true),
  ('Аренда', '🏠', '#6c63ff', true),
  ('Здоровье', '💊', '#00d68f', true),
  ('Зарплата', '💰', '#00d68f', true),
  ('Другое', '📦', '#888899', true)
on conflict do nothing;

-- =====================
-- EXPENSES
-- =====================
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(12,2) not null,
  type text check (type in ('expense','income')) default 'expense',
  category_id uuid references categories(id),
  category_name text,
  note text,
  date date default current_date,
  receipt_url text,
  created_at timestamptz default now()
);

-- Index for performance
create index if not exists expenses_user_id_idx on expenses(user_id);
create index if not exists expenses_date_idx on expenses(date);

-- =====================
-- GOALS
-- =====================
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text default '🎯',
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) default 0,
  monthly_contribution numeric(12,2) default 0,
  deadline date,
  completed boolean default false,
  created_at timestamptz default now()
);

-- =====================
-- ACHIEVEMENTS
-- =====================
create table if not exists achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_key)
);

-- =====================
-- USER PROFILES (extends auth.users)
-- =====================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  monthly_income numeric(12,2) default 0,
  currency text default 'USD',
  avatar_url text,
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table expenses enable row level security;
alter table goals enable row level security;
alter table achievements enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;

-- Expenses: users see only their own
create policy "expenses_own" on expenses for all using (auth.uid() = user_id);

-- Goals
create policy "goals_own" on goals for all using (auth.uid() = user_id);

-- Achievements
create policy "achievements_own" on achievements for all using (auth.uid() = user_id);

-- Profiles
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- Categories: see default ones + own
create policy "categories_read" on categories for select
  using (is_default = true or auth.uid() = user_id);
create policy "categories_write" on categories for insert
  with check (auth.uid() = user_id);
create policy "categories_update" on categories for update
  using (auth.uid() = user_id);
create policy "categories_delete" on categories for delete
  using (auth.uid() = user_id);

-- =====================
-- STORAGE for receipts
-- =====================
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
on conflict do nothing;

create policy "receipts_own" on storage.objects for all
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- =====================
-- REALTIME
-- =====================
-- Enable realtime for expenses table
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table goals;
