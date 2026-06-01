create or replace function public.soft_delete_community_post(target_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.community_posts
  set
    is_hidden = true,
    updated_at = now()
  where id = target_post_id
    and user_id = auth.uid();

  return found;
end;
$$;

grant execute on function public.soft_delete_community_post(uuid) to authenticated;

notify pgrst, 'reload schema';
