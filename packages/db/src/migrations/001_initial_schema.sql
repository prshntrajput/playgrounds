-- Enable PostGIS
create extension if not exists postgis;

-- ================================================================
-- USERS
-- ================================================================
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  avatar      text,
  role        text not null default 'USER' check (role in ('GUEST','USER','ADMIN')),
  created_at  timestamptz not null default now()
);

-- ================================================================
-- VENUES
-- ================================================================
create table if not exists public.venues (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  type              text not null,
  latitude          numeric(10,7) not null,
  longitude         numeric(10,7) not null,
  geom              geography(Point, 4326) generated always as (
                      st_makepoint(longitude, latitude)::geography
                    ) stored,
  address           text,
  city              text,
  country           text,
  description       text,
  status            text not null default 'UNKNOWN'
                      check (status in ('OPEN','CLOSED','RENOVATION','UNKNOWN')),
  reliability_score numeric(4,3) not null default 0.5
                      check (reliability_score >= 0 and reliability_score <= 1),
  last_verified_at  timestamptz,
  source            text not null default 'COMMUNITY'
                      check (source in ('OSM','COMMUNITY','OFFICIAL')),
  external_ref      text,
  created_at        timestamptz not null default now()
);

create index if not exists venues_geom_gist on public.venues using gist(geom);
create index if not exists venues_status_idx on public.venues(status);
create index if not exists venues_type_idx on public.venues(type);
create index if not exists venues_reliability_idx on public.venues(reliability_score desc);

-- ================================================================
-- VENUE AMENITIES
-- ================================================================
create table if not exists public.venue_amenities (
  venue_id  uuid not null references public.venues(id) on delete cascade,
  amenity   text not null,
  primary key (venue_id, amenity)
);

-- ================================================================
-- VENUE IMAGES
-- ================================================================
create table if not exists public.venue_images (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  image_url   text not null,
  created_at  timestamptz not null default now()
);

-- ================================================================
-- VENUE REVIEWS
-- ================================================================
create table if not exists public.venue_reviews (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  rating      smallint not null check (rating >= 1 and rating <= 5),
  review      text not null,
  sentiment   text check (sentiment in ('positive','negative','neutral')),
  issues      text[],
  created_at  timestamptz not null default now()
);

create index if not exists reviews_venue_id_idx on public.venue_reviews(venue_id);
create index if not exists reviews_created_at_idx on public.venue_reviews(created_at desc);

-- ================================================================
-- VENUE REPORTS
-- ================================================================
create table if not exists public.venue_reports (
  id                uuid primary key default gen_random_uuid(),
  venue_id          uuid not null references public.venues(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  report_type       text not null,
  ai_classification text,
  created_at        timestamptz not null default now()
);

create index if not exists reports_venue_id_idx on public.venue_reports(venue_id);
create index if not exists reports_created_at_idx on public.venue_reports(created_at desc);

-- ================================================================
-- CROWD REPORTS
-- ================================================================
create table if not exists public.crowd_reports (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  level       text not null check (level in ('LOW','MEDIUM','HIGH')),
  created_at  timestamptz not null default now()
);

create index if not exists crowd_venue_created_idx on public.crowd_reports(venue_id, created_at desc);

-- ================================================================
-- FAVORITES
-- ================================================================
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  venue_id    uuid not null references public.venues(id) on delete cascade,
  unique (user_id, venue_id)
);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null check (type in (
                'VENUE_REOPENED','STATUS_CHANGED','NEW_REVIEW','RELIABILITY_DROP'
              )),
  payload     jsonb not null default '{}',
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, read, created_at desc);

-- ================================================================
-- AI SUMMARIES
-- ================================================================
create table if not exists public.ai_summaries (
  venue_id      uuid primary key references public.venues(id) on delete cascade,
  summary       text not null,
  model         text not null,
  generated_at  timestamptz not null default now()
);

-- ================================================================
-- PostGIS FUNCTION: find_venues_nearby
-- ================================================================
create or replace function public.find_venues_nearby(
  p_lat       numeric,
  p_lng       numeric,
  p_radius_km numeric,
  p_sport     text default null,
  p_status    text default null,
  p_limit     integer default 20,
  p_offset    integer default 0
)
returns setof public.venues
language sql
stable
as $$
  select v.*
  from public.venues v
  where
    st_dwithin(
      v.geom,
      st_makepoint(p_lng, p_lat)::geography,
      p_radius_km * 1000
    )
    and (p_sport is null or v.type = p_sport)
    and (p_status is null or v.status = p_status)
  order by
    st_distance(v.geom, st_makepoint(p_lng, p_lat)::geography),
    v.reliability_score desc
  limit p_limit
  offset p_offset;
$$;
