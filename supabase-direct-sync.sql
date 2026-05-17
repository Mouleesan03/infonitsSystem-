-- Infonits direct Supabase table sync for the current HTML app.
-- Run this in Supabase SQL Editor.
-- This lets the current Vercel frontend save each section into Supabase tables.
-- Important: this mode uses the public anon key. Upgrade to Supabase Auth later for stronger security.

create table if not exists public.app_data (
  collection text not null,
  app_id text not null,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (collection, app_id)
);

alter table public.clients add column if not exists app_id text unique;
alter table public.clients add column if not exists payload jsonb not null default '{}';
alter table public.clients add column if not exists updated_at timestamptz not null default now();
update public.clients set client_code = null where client_code = '';

alter table public.employees add column if not exists app_id text unique;
alter table public.employees add column if not exists payload jsonb not null default '{}';
alter table public.employees add column if not exists updated_at timestamptz not null default now();

alter table public.services add column if not exists app_id text unique;
alter table public.services add column if not exists payload jsonb not null default '{}';
alter table public.services add column if not exists updated_at timestamptz not null default now();

alter table public.invoices add column if not exists app_id text unique;
alter table public.invoices add column if not exists payload jsonb not null default '{}';
alter table public.invoices add column if not exists updated_at timestamptz not null default now();

alter table public.projects add column if not exists app_id text unique;
alter table public.projects add column if not exists payload jsonb not null default '{}';
alter table public.projects add column if not exists updated_at timestamptz not null default now();

alter table public.social_media_posts add column if not exists app_id text unique;
alter table public.social_media_posts add column if not exists payload jsonb not null default '{}';
alter table public.social_media_posts add column if not exists updated_at timestamptz not null default now();

alter table public.finance_records add column if not exists app_id text unique;
alter table public.finance_records add column if not exists payload jsonb not null default '{}';
alter table public.finance_records add column if not exists updated_at timestamptz not null default now();

alter table public.renewals add column if not exists app_id text unique;
alter table public.renewals add column if not exists payload jsonb not null default '{}';
alter table public.renewals add column if not exists updated_at timestamptz not null default now();

alter table public.website_logins add column if not exists app_id text unique;
alter table public.website_logins add column if not exists payload jsonb not null default '{}';
alter table public.website_logins add column if not exists updated_at timestamptz not null default now();

alter table public.notifications add column if not exists app_id text unique;
alter table public.notifications add column if not exists updated_at timestamptz not null default now();

alter table public.app_data enable row level security;

drop policy if exists "Current app can sync app data" on public.app_data;
create policy "Current app can sync app data"
on public.app_data for all
using (true)
with check (true);

drop policy if exists "Current app can sync clients" on public.clients;
create policy "Current app can sync clients" on public.clients for all using (true) with check (true);

drop policy if exists "Current app can sync employees" on public.employees;
create policy "Current app can sync employees" on public.employees for all using (true) with check (true);

drop policy if exists "Current app can sync services" on public.services;
create policy "Current app can sync services" on public.services for all using (true) with check (true);

drop policy if exists "Current app can sync invoices" on public.invoices;
create policy "Current app can sync invoices" on public.invoices for all using (true) with check (true);

drop policy if exists "Current app can sync projects" on public.projects;
create policy "Current app can sync projects" on public.projects for all using (true) with check (true);

drop policy if exists "Current app can sync social posts" on public.social_media_posts;
create policy "Current app can sync social posts" on public.social_media_posts for all using (true) with check (true);

drop policy if exists "Current app can sync finance" on public.finance_records;
create policy "Current app can sync finance" on public.finance_records for all using (true) with check (true);

drop policy if exists "Current app can sync renewals" on public.renewals;
create policy "Current app can sync renewals" on public.renewals for all using (true) with check (true);

drop policy if exists "Current app can sync website logins" on public.website_logins;
create policy "Current app can sync website logins" on public.website_logins for all using (true) with check (true);

drop policy if exists "Current app can sync notifications" on public.notifications;
create policy "Current app can sync notifications" on public.notifications for all using (true) with check (true);

drop policy if exists "Current app can sync settings" on public.app_settings;
create policy "Current app can sync settings" on public.app_settings for all using (true) with check (true);
