alter table public.content_editorial_proposal_audit
  drop constraint if exists content_editorial_proposal_audit_action_check;
alter table public.content_editorial_proposal_audit
  add constraint content_editorial_proposal_audit_action_check
  check (action in ('approved', 'rejected', 'needs_validation', 'applied', 'stale', 'published', 'publication_blocked', 'human_edited'));

create or replace function public.apply_editorial_human_edit(
  p_proposal_id uuid, p_actor_email text, p_title text, p_summary text, p_content text,
  p_before_hash text, p_after_hash text
) returns uuid language plpgsql security invoker set search_path = public as $$
declare v_proposal public.content_editorial_proposals%rowtype; v_article public.help_articles%rowtype;
begin
  select * into v_proposal from public.content_editorial_proposals where id=p_proposal_id for update;
  if not found or v_proposal.status <> 'applied' or v_proposal.entity_type <> 'help_article' then raise exception 'human_edit_not_allowed' using errcode='P0001'; end if;
  select * into v_article from public.help_articles where id=v_proposal.entity_id and status='draft' for update;
  if not found then raise exception 'human_edit_target_not_draft' using errcode='P0001'; end if;
  update public.help_articles set title=p_title, summary=p_summary, content=p_content where id=v_article.id;
  update public.content_editorial_proposals set proposal=coalesce(proposal,'{}'::jsonb)||jsonb_build_object('rewritten_title',p_title,'rewritten_summary',p_summary,'rewritten_content',p_content), updated_at=now() where id=v_proposal.id;
  insert into public.content_editorial_proposal_audit(proposal_id,action,actor_email,metadata) values (v_proposal.id,'human_edited',p_actor_email,jsonb_build_object('entity_type','help_article','changed_fields',jsonb_build_array('title','summary','content'),'before_hash',p_before_hash,'after_hash',p_after_hash));
  return v_proposal.id;
end $$;
revoke all on function public.apply_editorial_human_edit(uuid,text,text,text,text,text,text) from public;
revoke all on function public.apply_editorial_human_edit(uuid,text,text,text,text,text,text) from anon, authenticated;
grant execute on function public.apply_editorial_human_edit(uuid,text,text,text,text,text,text) to service_role;
