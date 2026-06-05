-- Companion count function for find_venues_nearby so the API can
-- return the real total (not just the current page size).
create or replace function public.count_venues_nearby(
  p_lat       numeric,
  p_lng       numeric,
  p_radius_km numeric,
  p_sport     text default null,
  p_status    text default null
)
returns bigint
language sql
stable
as $$
  select count(*)
  from public.venues v
  where
    st_dwithin(
      v.geom,
      st_makepoint(p_lng, p_lat)::geography,
      p_radius_km * 1000
    )
    and (p_sport  is null or v.type   = p_sport)
    and (p_status is null or v.status = p_status);
$$;
