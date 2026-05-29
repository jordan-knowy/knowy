alter table public.profiles
  add column if not exists sync_calendar boolean not null default true,
  add column if not exists sync_email boolean not null default true,
  add column if not exists sync_enrichment boolean not null default false;
