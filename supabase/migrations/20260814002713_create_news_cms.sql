-- Reconstructed from the live catalog on 2026-08-15.
-- This file restores the migration that originally created the news CMS.
create table if not exists public.news_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  category text not null,
  excerpt text not null,
  lead text not null,
  content text not null,
  highlight text,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_admins enable row level security;
alter table public.news_articles enable row level security;

revoke all on public.news_admins, public.news_articles from anon, authenticated;
grant select on public.news_articles to anon, authenticated;
grant insert, update, delete on public.news_articles to authenticated;
grant select on public.news_admins to authenticated;
grant all on public.news_admins, public.news_articles to service_role;

create or replace function public.is_news_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.news_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.set_news_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists news_articles_updated_at on public.news_articles;
create trigger news_articles_updated_at
before insert or update on public.news_articles
for each row execute function public.set_news_updated_at();

create policy "admins can read admin list"
on public.news_admins for select to authenticated
using (public.is_news_admin());

create policy "public can read published news"
on public.news_articles for select to public
using (status = 'published' or public.is_news_admin());

create policy "admins can insert news"
on public.news_articles for insert to authenticated
with check (public.is_news_admin());

create policy "admins can update news"
on public.news_articles for update to authenticated
using (public.is_news_admin()) with check (public.is_news_admin());

create policy "admins can delete news"
on public.news_articles for delete to authenticated
using (public.is_news_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public can read news images"
on storage.objects for select to public
using (bucket_id = 'news-images');

create policy "admins can upload news images"
on storage.objects for insert to authenticated
with check (bucket_id = 'news-images' and public.is_news_admin());

create policy "admins can update news images"
on storage.objects for update to authenticated
using (bucket_id = 'news-images' and public.is_news_admin())
with check (bucket_id = 'news-images' and public.is_news_admin());

create policy "admins can delete news images"
on storage.objects for delete to authenticated
using (bucket_id = 'news-images' and public.is_news_admin());
