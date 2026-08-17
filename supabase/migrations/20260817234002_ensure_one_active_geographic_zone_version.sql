-- Keep historical versions for auditability, but resolve against one active
-- version per source layer. This does not delete or overwrite old geometries.
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

  update public.coverage_zones
  set active = false,
      updated_at = now()
  where source_layer = p_source_layer
    and source_version is distinct from p_source_version
    and active;

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
