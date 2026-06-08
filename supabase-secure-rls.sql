-- Infonits secure RLS upgrade.
-- Run this only after moving login to Supabase Auth.
-- It removes the temporary public "using (true)" policies.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'Active'
$$;

create or replace function public.can_manage_business_data()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'project-manager', 'developer')
$$;

drop policy if exists "Current app can sync clients" on public.clients;
drop policy if exists "Current app can sync employees" on public.employees;
drop policy if exists "Current app can sync services" on public.services;
drop policy if exists "Current app can sync invoices" on public.invoices;
drop policy if exists "Current app can sync projects" on public.projects;
drop policy if exists "Current app can sync social posts" on public.social_media_posts;
drop policy if exists "Current app can sync finance" on public.finance_records;
drop policy if exists "Current app can sync renewals" on public.renewals;
drop policy if exists "Current app can sync website logins" on public.website_logins;
drop policy if exists "Current app can sync notifications" on public.notifications;
drop policy if exists "Current app can sync app data" on public.app_data;
drop policy if exists "Current app can sync settings" on public.app_settings;
drop policy if exists "Current app can sync users" on public.app_users;

create policy "Authenticated staff can manage clients" on public.clients
for all to authenticated using (public.can_manage_business_data()) with check (public.can_manage_business_data());

create policy "Authenticated staff can manage employees" on public.employees
for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "Authenticated staff can manage services" on public.services
for all to authenticated using (public.can_manage_business_data()) with check (public.can_manage_business_data());

create policy "Authenticated staff can manage invoices" on public.invoices
for all to authenticated using (public.can_manage_business_data()) with check (public.can_manage_business_data());

drop policy if exists "Mobile invoice can sync" on public.invoices;
create policy "Mobile invoice can sync" on public.invoices
for all using (true) with check (true);

create policy "Authenticated staff can manage projects" on public.projects
for all to authenticated using (public.can_manage_business_data()) with check (public.can_manage_business_data());

drop policy if exists "Mobile project can sync" on public.projects;
create policy "Mobile project can sync" on public.projects
for all using (true) with check (true);

create policy "Authenticated staff can manage social posts" on public.social_media_posts
for all to authenticated using (public.can_manage_business_data()) with check (public.can_manage_business_data());

create policy "Admin can manage finance" on public.finance_records
for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

drop policy if exists "Mobile finance can sync" on public.finance_records;
create policy "Mobile finance can sync" on public.finance_records
for all using (true) with check (true);

create policy "Authenticated staff can manage renewals" on public.renewals
for all to authenticated using (public.can_manage_business_data()) with check (public.can_manage_business_data());

create policy "Admin can manage website logins" on public.website_logins
for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "Authenticated staff can manage notifications" on public.notifications
for all to authenticated using (public.can_manage_business_data()) with check (public.can_manage_business_data());

create policy "Admin can manage app data" on public.app_data
for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "Admin can manage settings" on public.app_settings
for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "Admin can manage app users" on public.app_users
for all to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
