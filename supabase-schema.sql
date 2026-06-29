create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) <= 280),
  updated_at timestamptz not null default now()
);

alter table public.ideas enable row level security;

drop policy if exists "Anyone can read ideas" on public.ideas;
create policy "Anyone can read ideas"
on public.ideas
for select
to anon
using (true);

drop policy if exists "Anyone can create ideas" on public.ideas;
create policy "Anyone can create ideas"
on public.ideas
for insert
to anon
with check (true);

drop policy if exists "Anyone can edit ideas" on public.ideas;
create policy "Anyone can edit ideas"
on public.ideas
for update
to anon
using (true)
with check (true);

drop policy if exists "Anyone can delete ideas" on public.ideas;
create policy "Anyone can delete ideas"
on public.ideas
for delete
to anon
using (true);
