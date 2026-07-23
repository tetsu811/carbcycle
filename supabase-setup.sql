-- 碳循環熱量計算 — Supabase 設定
-- 在 Supabase Dashboard → SQL Editor 貼上執行一次即可

-- 資料表：每個使用者以 key-value 方式存資料
-- key 例如: 'settings', 'lib', 'day:2026-07-23'
create table if not exists public.carbcycle (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.carbcycle enable row level security;

-- 只有本人能讀寫自己的資料
create policy "carbcycle select own" on public.carbcycle
  for select using (auth.uid() = user_id);

create policy "carbcycle insert own" on public.carbcycle
  for insert with check (auth.uid() = user_id);

create policy "carbcycle update own" on public.carbcycle
  for update using (auth.uid() = user_id);

create policy "carbcycle delete own" on public.carbcycle
  for delete using (auth.uid() = user_id);
