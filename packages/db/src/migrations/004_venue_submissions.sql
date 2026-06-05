-- ================================================================
-- VENUE SUBMISSIONS
-- Covers two cases:
--   1. New venue: venue_id IS NULL  → admin reviews and creates it
--   2. Claim:     venue_id IS NOT NULL → owner claiming existing venue
-- ================================================================
create table if not exists public.venue_submissions (
  id               uuid primary key default gen_random_uuid(),

  -- Who submitted
  user_id          uuid references public.users(id) on delete set null,
  owner_name       text not null,
  owner_email      text not null,
  contact_phone    text,
  contact_whatsapp text,

  -- Is this a claim of an existing venue?
  venue_id         uuid references public.venues(id) on delete cascade,

  -- Venue details (for new submissions; ignored for claims)
  name             text,
  type             text check (type in (
                     'BASKETBALL','TENNIS','BADMINTON','FOOTBALL','CRICKET',
                     'VOLLEYBALL','TABLE_TENNIS','SWIMMING','ATHLETICS','MULTI'
                   )),
  address          text,
  city             text,
  country          text,
  latitude         numeric(10,7),
  longitude        numeric(10,7),
  description      text,
  opening_hours    text,             -- free text: "Mon-Fri 6am-10pm, Sat-Sun 7am-9pm"
  price_per_hour   numeric(10,2),    -- INR
  amenities        text[] default '{}',

  -- For claims: proof of ownership
  proof_text       text,

  -- Admin workflow
  status           text not null default 'PENDING'
                     check (status in ('PENDING','APPROVED','REJECTED')),
  admin_notes      text,
  reviewed_by      uuid references public.users(id) on delete set null,
  reviewed_at      timestamptz,

  created_at       timestamptz not null default now()
);

create index if not exists submissions_status_idx on public.venue_submissions(status, created_at desc);
create index if not exists submissions_user_idx   on public.venue_submissions(user_id);
create index if not exists submissions_venue_idx  on public.venue_submissions(venue_id);
