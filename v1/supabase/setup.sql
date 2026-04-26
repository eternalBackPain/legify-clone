create table public.legislation (
  id text primary key,
  entry_created_datetime timestamptz not null default now(),
  source text not null,
  jurisdiction text not null,
  title text not null,
  year integer,
  url text not null,
  type text not null
);

create index legislation_title_idx on public.legislation (title);
create index legislation_jurisdiction_idx on public.legislation (jurisdiction);
create index legislation_type_idx on public.legislation (type);

alter table public.legislation enable row level security;

create policy "Public can read legislation"
on public.legislation
for select
to anon
using (true);
