-- DRAFT — not applied. Owner must approve before `supabase db push`.
-- One free NihongoLife (Edu game) account per website account.
create table if not exists public.edu_game_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade, -- UNIQUE = one per user
  game_username text not null unique,
  link_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  status text not null default 'active' check (status in ('active','suspended')),
  plan text not null default 'free',
  game_progress_reset_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.edu_game_accounts enable row level security;
drop policy if exists "own edu account read" on public.edu_game_accounts;
create policy "own edu account read" on public.edu_game_accounts for select using (auth.uid() = user_id);
-- No direct insert/update for clients; only via the RPC below.

create or replace function public.claim_edu_game_account(p_game_username text default null)
returns public.edu_game_accounts language plpgsql security definer set search_path = public as $$
declare r public.edu_game_accounts; base text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into r from edu_game_accounts where user_id = auth.uid();
  if found then return r; end if;
  base := coalesce(nullif(regexp_replace(lower(p_game_username),'[^a-z0-9_]','','g'),''), 'qd_'||substr(auth.uid()::text,1,8));
  insert into edu_game_accounts(user_id, game_username)
  values (auth.uid(), base || case when exists(select 1 from edu_game_accounts where game_username=base) then '_'||substr(md5(random()::text),1,4) else '' end)
  returning * into r;
  return r;
end $$;
grant execute on function public.claim_edu_game_account(text) to authenticated;

-- Game side: the Unity client signs in with Supabase auth (same project) or enters link_code;
-- an edge function / RPC `redeem_edu_link_code(code)` (to add) binds the device to the account.

-- Game device link: game (signed in to Supabase auth as the same user, or service role via edge fn) redeems link code.
alter table public.edu_game_accounts add column if not exists device_id text, add column if not exists linked_at timestamptz;
create or replace function public.redeem_edu_link_code(p_code text, p_device_id text)
returns public.edu_game_accounts language plpgsql security definer set search_path = public as $$
declare r public.edu_game_accounts;
begin
  update edu_game_accounts set device_id = p_device_id, linked_at = now()
   where link_code = upper(trim(p_code)) and status = 'active' returning * into r;
  if not found then raise exception 'invalid or inactive link code'; end if;
  return r;
end $$;
grant execute on function public.redeem_edu_link_code(text, text) to anon, authenticated;

-- Linked-account reset: owner of the account stamps a reset; the game wipes local progress when reset_at > its last sync.
create or replace function public.reset_my_edu_game_progress()
returns timestamptz language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  update edu_game_accounts set game_progress_reset_at = t where user_id = auth.uid();
  if not found then raise exception 'no edu game account'; end if;
  return t;
end $$;
grant execute on function public.reset_my_edu_game_progress() to authenticated;
