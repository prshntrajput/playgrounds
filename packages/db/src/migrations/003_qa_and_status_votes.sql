-- ================================================================
-- STATUS VOTES  (community "is it open right now?" votes)
-- ================================================================
create table if not exists public.venue_status_votes (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues(id) on delete cascade,
  user_id    text,                         -- Supabase auth UID stored as text (no FK)
  vote       text not null check (vote in ('OPEN', 'CLOSED')),
  created_at timestamptz not null default now()
);

create index if not exists idx_venue_status_votes_venue_created
  on public.venue_status_votes(venue_id, created_at desc);

-- ================================================================
-- Q&A
-- ================================================================
create table if not exists public.venue_questions (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues(id) on delete cascade,
  user_id    text,
  question   text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_venue_questions_venue
  on public.venue_questions(venue_id, created_at desc);

create table if not exists public.venue_answers (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.venue_questions(id) on delete cascade,
  user_id       text,
  answer        text not null,
  helpful_count integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_venue_answers_question
  on public.venue_answers(question_id, created_at asc);
