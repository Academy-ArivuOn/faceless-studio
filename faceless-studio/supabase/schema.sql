-- ============================================================
-- Studio AI — Supabase Schema
-- Run this ONCE in the Supabase SQL Editor: Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- One row per user — mirrors auth.users, stores creator preferences
-- ============================================================
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text,
  full_name            text,
  avatar_url           text,
  creator_type         text,                             -- youtuber | podcaster | blogger | reels | educator | coach | agency
  primary_niche        text,
  primary_platform     text,
  primary_language     text default 'English',
  streak_count         int  default 0 not null,
  last_generation_date date,
  onboarding_complete  boolean default false not null,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

-- ============================================================
-- TABLE: user_usage
-- Tracks plan + monthly generation count per user
-- ============================================================
create table if not exists public.user_usage (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid unique not null references auth.users(id) on delete cascade,
  plan                 text default 'free' not null,          -- free | pro | studio
  generations_count    int  default 0 not null,               -- resets monthly
  total_generations    int  default 0 not null,               -- lifetime, never resets
  reset_date           timestamptz,                           -- next monthly reset date
  lemon_squeezy_id     text,                                  -- LS customer ID for reference
  plan_activated_at    timestamptz,                           -- when paid plan started
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

-- ============================================================
-- TABLE: generations
-- Stores every complete content pack generated
-- ============================================================
create table if not exists public.generations (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  niche                    text not null,
  platform                 text not null,
  tone                     text default 'Educational',
  language                 text default 'English',
  creator_type             text,
  chosen_topic             text,
  chosen_hook              text,
  research_output          jsonb,                             -- full research agent output
  creator_output           jsonb,                             -- full creator agent output
  publisher_output         jsonb,                             -- full publisher agent output
  generation_duration_ms   int,
  generated_at             timestamptz default now() not null
);

-- ============================================================
-- TABLE: sprints
-- 7-day content sprints (optional gamification feature)
-- ============================================================
create table if not exists public.sprints (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  niche            text,
  platform         text,
  status           text default 'active' not null,            -- active | completed | abandoned
  completed_days   int[]  default '{}' not null,              -- array of completed day numbers [1,2,3]
  generation_ids   uuid[] default '{}' not null,              -- linked generation IDs
  created_at       timestamptz default now() not null,
  completed_at     timestamptz
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_gen_user_date    on public.generations (user_id, generated_at desc);
create index if not exists idx_usage_user       on public.user_usage   (user_id);
create index if not exists idx_profiles_email   on public.profiles     (email);
create index if not exists idx_sprints_user     on public.sprints      (user_id, status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================================

-- profiles
alter table public.profiles     enable row level security;
alter table public.user_usage   enable row level security;
alter table public.generations  enable row level security;
alter table public.sprints      enable row level security;

-- profiles policies
create policy "profiles: user can view own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: user can update own row"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: user can insert own row"
  on public.profiles for insert
  with check (auth.uid() = id);

-- user_usage policies
create policy "usage: user can view own row"
  on public.user_usage for select
  using (auth.uid() = user_id);

create policy "usage: user can insert own row"
  on public.user_usage for insert
  with check (auth.uid() = user_id);

-- generations policies
create policy "generations: user can view own"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "generations: user can insert own"
  on public.generations for insert
  with check (auth.uid() = user_id);

-- sprints policies
create policy "sprints: user can view own"
  on public.sprints for select
  using (auth.uid() = user_id);

create policy "sprints: user can insert own"
  on public.sprints for insert
  with check (auth.uid() = user_id);

create policy "sprints: user can update own"
  on public.sprints for update
  using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: handle_new_user
-- Auto-creates profile + user_usage row when a new user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create profile row
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Create usage row with reset_date set to 1st of next month
  insert into public.user_usage (
    user_id,
    plan,
    generations_count,
    total_generations,
    reset_date
  )
  values (
    new.id,
    'free',
    0,
    0,
    date_trunc('month', now()) + interval '1 month'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Attach trigger to auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNCTION: increment_usage
-- Atomic increment of generation counters — prevents race conditions
-- when multiple requests fire at the same time
-- ============================================================
create or replace function public.increment_usage(uid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.user_usage
  set
    generations_count = generations_count + 1,
    total_generations = total_generations + 1,
    updated_at        = now()
  where user_id = uid;

  -- If no row exists yet (edge case), create one
  if not found then
    insert into public.user_usage (user_id, plan, generations_count, total_generations, reset_date)
    values (
      uid,
      'free',
      1,
      1,
      date_trunc('month', now()) + interval '1 month'
    )
    on conflict (user_id) do update
    set
      generations_count = public.user_usage.generations_count + 1,
      total_generations = public.user_usage.total_generations + 1,
      updated_at        = now();
  end if;
end;
$$;