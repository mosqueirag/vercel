-- Additive hardening for the existing news CMS.
-- The helper remains usable by RLS but is no longer exposed as a public RPC.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_news_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.news_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function private.is_news_admin() from public, anon;
grant execute on function private.is_news_admin() to authenticated, service_role;

drop policy if exists "admins can read admin list" on public.news_admins;
create policy "admins can read admin list"
on public.news_admins for select to authenticated
using ((select private.is_news_admin()));

drop policy if exists "public can read published news" on public.news_articles;
create policy "public can read published news"
on public.news_articles for select to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

create policy "admins can read all news"
on public.news_articles for select to authenticated
using ((select private.is_news_admin()));

drop policy if exists "admins can insert news" on public.news_articles;
create policy "admins can insert news"
on public.news_articles for insert to authenticated
with check ((select private.is_news_admin()));

drop policy if exists "admins can update news" on public.news_articles;
create policy "admins can update news"
on public.news_articles for update to authenticated
using ((select private.is_news_admin()))
with check ((select private.is_news_admin()));

drop policy if exists "admins can delete news" on public.news_articles;
create policy "admins can delete news"
on public.news_articles for delete to authenticated
using ((select private.is_news_admin()));

drop policy if exists "admins can upload news images" on storage.objects;
create policy "admins can upload news images"
on storage.objects for insert to authenticated
with check (bucket_id = 'news-images' and (select private.is_news_admin()));

drop policy if exists "admins can update news images" on storage.objects;
create policy "admins can update news images"
on storage.objects for update to authenticated
using (bucket_id = 'news-images' and (select private.is_news_admin()))
with check (bucket_id = 'news-images' and (select private.is_news_admin()));

drop policy if exists "admins can delete news images" on storage.objects;
create policy "admins can delete news images"
on storage.objects for delete to authenticated
using (bucket_id = 'news-images' and (select private.is_news_admin()));

create or replace function public.set_news_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

revoke execute on function public.set_news_updated_at() from public, anon, authenticated;

revoke execute on function public.is_news_admin() from public, anon, authenticated;
drop function public.is_news_admin();
