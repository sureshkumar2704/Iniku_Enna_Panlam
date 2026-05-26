create table if not exists public.tasks (
  id text primary key,
  user_id text,
  "dateKey" text,
  items jsonb not null default '[]'::jsonb
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'userId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'user_id'
  ) then
    execute 'alter table public.tasks rename column "userId" to user_id';
  end if;
end $$;

alter table if exists public.tasks
  alter column user_id type text using user_id::text;

create table if not exists public.backlog (
  id text primary key,
  user_id text,
  "text" text not null,
  done boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.sessions (
  id text primary key,
  user_id text,
  "dateKey" text,
  "startTime" text,
  "endTime" text
);

create table if not exists public.destination (
  id text primary key,
  user_id text,
  date text
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, "dateKey");
create index if not exists backlog_user_idx on public.backlog (user_id);
create index if not exists sessions_user_date_idx on public.sessions (user_id, "dateKey");
create index if not exists destination_user_idx on public.destination (user_id);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'backlog'
      and column_name = 'ownerId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'backlog'
      and column_name = 'user_id'
  ) then
    execute 'alter table public.backlog rename column "ownerId" to user_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'userId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'user_id'
  ) then
    execute 'alter table public.sessions rename column "userId" to user_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'destination'
      and column_name = 'userId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'destination'
      and column_name = 'user_id'
  ) then
    execute 'alter table public.destination rename column "userId" to user_id';
  end if;
end $$;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.tasks to anon, authenticated;
grant select, insert, update, delete on table public.backlog to anon, authenticated;
grant select, insert, update, delete on table public.sessions to anon, authenticated;
grant select, insert, update, delete on table public.destination to anon, authenticated;

alter table public.tasks enable row level security;
alter table public.backlog enable row level security;
alter table public.sessions enable row level security;
alter table public.destination enable row level security;

drop policy if exists tasks_allow_all on public.tasks;

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks" on public.tasks
  for insert
  to authenticated
  with check (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks" on public.tasks
  for select
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks" on public.tasks
  for update
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks" on public.tasks
  for delete
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists backlog_allow_all on public.backlog;

drop policy if exists "Users can insert their own backlog items" on public.backlog;
create policy "Users can insert their own backlog items" on public.backlog
  for insert
  to authenticated
  with check (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can view their own backlog items" on public.backlog;
create policy "Users can view their own backlog items" on public.backlog
  for select
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can update their own backlog items" on public.backlog;
create policy "Users can update their own backlog items" on public.backlog
  for update
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can delete their own backlog items" on public.backlog;
create policy "Users can delete their own backlog items" on public.backlog
  for delete
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists sessions_allow_all on public.sessions;

drop policy if exists "Users can insert their own sessions" on public.sessions;
create policy "Users can insert their own sessions" on public.sessions
  for insert
  to authenticated
  with check (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can view their own sessions" on public.sessions;
create policy "Users can view their own sessions" on public.sessions
  for select
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can update their own sessions" on public.sessions;
create policy "Users can update their own sessions" on public.sessions
  for update
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can delete their own sessions" on public.sessions;
create policy "Users can delete their own sessions" on public.sessions
  for delete
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists destination_allow_all on public.destination;

drop policy if exists "Users can insert their own destination" on public.destination;
create policy "Users can insert their own destination" on public.destination
  for insert
  to authenticated
  with check (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can view their own destination" on public.destination;
create policy "Users can view their own destination" on public.destination
  for select
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can update their own destination" on public.destination;
create policy "Users can update their own destination" on public.destination
  for update
  to authenticated
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can delete their own destination" on public.destination;
create policy "Users can delete their own destination" on public.destination
  for delete
  to authenticated
  using (auth.jwt()->>'sub' = user_id);