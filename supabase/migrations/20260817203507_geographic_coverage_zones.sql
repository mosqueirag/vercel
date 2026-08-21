-- Phase 3C: private geographic coverage zones.
-- This is additive: it never deletes existing coverage guidance or address records.
create extension if not exists postgis with schema extensions;

alter table public.coverage_zones
  add column if not exists source_layer text,
  add column if not exists source_label text,
  add column if not exists technologies text[],
  add column if not exists geometry extensions.geometry(MultiPolygon, 4326),
  add column if not exists source text,
  add column if not exists source_version text,
  add column if not exists active boolean not null default false;

alter table public.coverage_zones
  add constraint coverage_zones_technologies_allowed_check
  check (
    technologies is null
    or (
      cardinality(technologies) > 0
      and technologies <@ array['FTTH', 'ADSL', 'WIRELESS']::text[]
    )
  ) not valid;
alter table public.coverage_zones validate constraint coverage_zones_technologies_allowed_check;

alter table public.coverage_zones
  add constraint coverage_zones_geometry_srid_check
  check (geometry is null or extensions.st_srid(geometry) = 4326) not valid;
alter table public.coverage_zones validate constraint coverage_zones_geometry_srid_check;

create unique index if not exists coverage_zones_source_layer_version_key
  on public.coverage_zones (source_layer, source_version)
  where source_layer is not null and source_version is not null;
create index if not exists coverage_zones_active_geometry_gist
  on public.coverage_zones using gist (geometry)
  where active and geometry is not null;

-- Geographic geometry is operational data. It is intentionally never exposed
-- to browser roles; the backend returns only a derived coverage result.
drop policy if exists "published coverage zones are public" on public.coverage_zones;
drop policy if exists "news admins manage coverage zones" on public.coverage_zones;
revoke all on public.coverage_zones from anon, authenticated;

create or replace function public.resolve_coverage_zones(
  p_longitude double precision,
  p_latitude double precision
)
returns table (zone_id uuid, technologies text[])
language sql
stable
security invoker
set search_path = ''
as $$
  select zone.id, zone.technologies
  from public.coverage_zones as zone
  where zone.active
    and zone.geometry is not null
    and extensions.st_covers(
      zone.geometry,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)
    )
  order by zone.zone_name asc, zone.id asc;
$$;

revoke all on function public.resolve_coverage_zones(double precision, double precision) from public, anon, authenticated;
grant execute on function public.resolve_coverage_zones(double precision, double precision) to service_role;

create or replace function public.upsert_geographic_coverage_zone(
  p_source_layer text,
  p_source_label text,
  p_technologies text[],
  p_geometry jsonb,
  p_source text,
  p_source_version text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_geometry extensions.geometry(MultiPolygon, 4326);
  v_id uuid;
begin
  if p_source_layer is null or length(btrim(p_source_layer)) = 0
    or p_source_version is null or length(btrim(p_source_version)) = 0 then
    raise exception 'source layer and source version are required' using errcode = '22023';
  end if;
  if p_technologies is null or cardinality(p_technologies) = 0
    or not (p_technologies <@ array['FTTH', 'ADSL', 'WIRELESS']::text[]) then
    raise exception 'unsupported coverage technology' using errcode = '22023';
  end if;

  v_geometry := extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson(p_geometry::text), 4326));
  if extensions.geometrytype(v_geometry) <> 'MULTIPOLYGON' or not extensions.st_isvalid(v_geometry) then
    raise exception 'coverage geometry must be a valid Polygon or MultiPolygon' using errcode = '22023';
  end if;

  insert into public.coverage_zones (
    zone_name, technology, availability, status, source_layer, source_label,
    technologies, geometry, source, source_version, active
  ) values (
    p_source_layer, null, 'evaluation', 'draft', p_source_layer, p_source_label,
    p_technologies, v_geometry, p_source, p_source_version, true
  )
  on conflict (source_layer, source_version) where source_layer is not null and source_version is not null
  do update set
    source_label = excluded.source_label,
    technologies = excluded.technologies,
    geometry = excluded.geometry,
    source = excluded.source,
    active = true,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_geographic_coverage_zone(text, text, text[], jsonb, text, text) from public, anon, authenticated;
grant execute on function public.upsert_geographic_coverage_zone(text, text, text[], jsonb, text, text) to service_role;

comment on table public.coverage_zones is 'Private operational geographic coverage zones. Browser roles cannot read geometry; the server resolves derived availability only.';
