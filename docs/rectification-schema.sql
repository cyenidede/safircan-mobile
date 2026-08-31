-- Tasarım taslağıdır; production veritabanına bu görevde uygulanmamıştır.
create table public.rectification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'completed')),
  birth_date date not null,
  birth_city text not null,
  birth_district text,
  birth_detail text,
  known_time_period text,
  known_time_start time,
  known_time_end time,
  birth_method text,
  birth_notes jsonb not null default '{}'::jsonb,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rectification_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rectification_requests(id) on delete cascade,
  category text not null,
  event_type text not null,
  event_date date,
  event_year integer,
  event_month integer,
  is_approximate boolean not null default false,
  end_date date,
  description text,
  created_at timestamptz not null default now()
);

alter table public.rectification_requests enable row level security;
alter table public.rectification_events enable row level security;

create policy "Users manage own rectification requests" on public.rectification_requests
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage events of own requests" on public.rectification_events
for all to authenticated
using (exists (select 1 from public.rectification_requests r where r.id = request_id and r.user_id = (select auth.uid())))
with check (exists (select 1 from public.rectification_requests r where r.id = request_id and r.user_id = (select auth.uid())));
