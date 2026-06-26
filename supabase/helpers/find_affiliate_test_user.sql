select
  user_id,
  affiliate_id,
  display_name,
  updated_at
from public.profiles
where affiliate_id is not null
order by updated_at desc nulls last
limit 10;
