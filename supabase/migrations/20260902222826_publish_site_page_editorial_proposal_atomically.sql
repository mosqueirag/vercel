-- 4G.7.2D: site-page publication is an explicit, atomic editorial action.
-- It deliberately leaves copy untouched and is callable only by service_role.
alter table public.content_editorial_proposals
  drop constraint if exists content_editorial_proposals_status_check;

alter table public.content_editorial_proposals
  add constraint content_editorial_proposals_status_check
  check (status in ('generated', 'needs_validation', 'approved', 'rejected', 'applied', 'stale', 'published'));

create or replace function public.publish_site_page_editorial_proposal(
  p_proposal_id uuid,
  p_page_id uuid,
  p_actor_email text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_proposal public.content_editorial_proposals%rowtype;
  v_page public.site_pages%rowtype;
begin
  if p_proposal_id is null or p_page_id is null or coalesce(btrim(p_actor_email), '') = '' then
    raise exception 'site_page_publication_invalid_input' using errcode = 'P0001';
  end if;

  select * into v_proposal
  from public.content_editorial_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'site_page_publication_proposal_not_found' using errcode = 'P0001';
  end if;

  if v_proposal.entity_type <> 'site_page' or v_proposal.entity_id <> p_page_id then
    raise exception 'site_page_publication_target_mismatch' using errcode = 'P0001';
  end if;

  select * into v_page
  from public.site_pages
  where id = p_page_id
  for update;

  if not found then
    raise exception 'site_page_publication_page_not_found' using errcode = 'P0001';
  end if;

  -- A repeated successful request is a no-op. It cannot add a second audit row.
  if v_proposal.status = 'published' then
    if v_page.status <> 'published' then
      raise exception 'site_page_publication_inconsistent_state' using errcode = 'P0001';
    end if;
    return v_proposal.id;
  end if;

  if v_proposal.status <> 'applied' then
    raise exception 'site_page_publication_proposal_not_applied' using errcode = 'P0001';
  end if;

  if v_proposal.risk_level <> 'low' then
    raise exception 'site_page_publication_risk_not_low' using errcode = 'P0001';
  end if;

  if jsonb_array_length(v_proposal.validation_flags) <> 0 then
    raise exception 'site_page_publication_validation_flags_present' using errcode = 'P0001';
  end if;

  if v_page.status <> 'draft' then
    raise exception 'site_page_publication_page_not_draft' using errcode = 'P0001';
  end if;

  update public.site_pages
  set status = 'published'
  where id = v_page.id;

  update public.content_editorial_proposals
  set status = 'published', reviewed_at = now(), reviewed_by = p_actor_email
  where id = v_proposal.id;

  insert into public.content_editorial_proposal_audit (
    proposal_id,
    action,
    actor_email,
    metadata
  ) values (
    v_proposal.id,
    'published',
    p_actor_email,
    jsonb_build_object(
      'entity_type', 'site_page',
      'previous_status', 'draft',
      'new_status', 'published'
    )
  );

  return v_proposal.id;
end;
$$;

revoke all on function public.publish_site_page_editorial_proposal(uuid, uuid, text) from public;
revoke all on function public.publish_site_page_editorial_proposal(uuid, uuid, text) from anon, authenticated;
grant execute on function public.publish_site_page_editorial_proposal(uuid, uuid, text) to service_role;
