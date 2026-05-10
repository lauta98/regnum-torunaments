-- ═══════════════════════════════════════════════════
-- CoR TOURNAMENT STATS — Schema Supabase
-- ═══════════════════════════════════════════════════

-- ── Players (extiende auth.users con datos del juego) ─────────────
create table if not exists public.players (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade unique,
  nickname_juego    text not null unique,
  reino             text not null check (reino in ('Syrtis', 'Ignis', 'Alsius')),
  clase_principal   text not null check (clase_principal in ('Bárbaro','Caballero','Conjurador','Brujo','Tirador','Cazador')),
  mmr_global        integer not null default 1200,
  winrate           numeric(5,2) not null default 0,
  partidas_jugadas  integer not null default 0,
  partidas_ganadas  integer not null default 0,
  role              text not null default 'player' check (role in ('player','organizer','admin')),
  bio               text,
  discord_username  text,
  discord_avatar    text,
  created_at        timestamptz not null default now()
);

-- ── Tournaments ────────────────────────────────────────────────────
create table if not exists public.tournaments (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid references public.players(id) on delete set null,
  nombre       text not null,
  descripcion  text,
  formato      text not null check (formato in ('1v1','2v2','3v3','7v7')),
  estado       text not null default 'draft' check (estado in ('draft','inscripciones','live','finalizado')),
  fecha_inicio date not null,
  fecha_fin    date,
  imagen_url   text,
  max_equipos  integer not null default 16,
  premio       text,
  reglamento   text,
  destacado    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ── Teams ──────────────────────────────────────────────────────────
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  logo_url    text,
  capitan_id  uuid references public.players(id) on delete cascade,
  tipo        text not null check (tipo in ('1v1','2v2','3v3','7v7')),
  created_at  timestamptz not null default now()
);

-- ── Team members (many-to-many) ────────────────────────────────────
create table if not exists public.team_members (
  team_id    uuid references public.teams(id) on delete cascade,
  player_id  uuid references public.players(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (team_id, player_id)
);

-- ── Tournament registrations ───────────────────────────────────────
create table if not exists public.tournament_registrations (
  tournament_id  uuid references public.tournaments(id) on delete cascade,
  team_id        uuid references public.teams(id) on delete cascade,
  seed           integer,
  registered_at  timestamptz not null default now(),
  primary key (tournament_id, team_id)
);

-- ── Matches ────────────────────────────────────────────────────────
create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  torneo_id     uuid references public.tournaments(id) on delete cascade,
  ronda         text not null,          -- 'Cuartos de Final', 'Semifinal', 'Final'
  ronda_numero  integer not null default 1,
  posicion      integer not null default 1,
  equipo_a_id   uuid references public.teams(id) on delete set null,
  equipo_b_id   uuid references public.teams(id) on delete set null,
  resultado     text,                   -- '2-1', '3-0', etc.
  ganador_id    uuid references public.teams(id) on delete set null,
  estado        text not null default 'pendiente' check (estado in ('pendiente','jugado','disputa')),
  scheduled_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ── MMR History ────────────────────────────────────────────────────
create table if not exists public.mmr_history (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid references public.players(id) on delete cascade,
  match_id     uuid references public.matches(id) on delete cascade,
  torneo_id    uuid references public.tournaments(id) on delete set null,
  mmr_antes    integer not null,
  mmr_despues  integer not null,
  delta        integer generated always as (mmr_despues - mmr_antes) stored,
  gano         boolean not null,
  created_at   timestamptz not null default now()
);

-- ── Highlights ────────────────────────────────────────────────────
create table if not exists public.highlights (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  descripcion    text,
  video_url      text not null,
  thumbnail_url  text,
  jugador_id     uuid references public.players(id) on delete cascade,
  torneo_id      uuid references public.tournaments(id) on delete set null,
  likes          integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ── Leaderboard view ──────────────────────────────────────────────
create or replace view public.leaderboard_view as
  select
    p.id,
    p.nickname_juego,
    p.reino,
    p.clase_principal,
    p.mmr_global,
    p.winrate,
    p.partidas_jugadas,
    p.partidas_ganadas,
    row_number() over (order by p.mmr_global desc) as ranking
  from public.players p
  order by p.mmr_global desc;

-- ═══════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════

alter table public.players                enable row level security;
alter table public.tournaments             enable row level security;
alter table public.teams                   enable row level security;
alter table public.team_members            enable row level security;
alter table public.tournament_registrations enable row level security;
alter table public.matches                 enable row level security;
alter table public.mmr_history             enable row level security;
alter table public.highlights              enable row level security;

-- Read: todo público
create policy "players_read_all"  on public.players  for select using (true);
create policy "tourns_read_all"   on public.tournaments for select using (true);
create policy "teams_read_all"    on public.teams    for select using (true);
create policy "members_read_all"  on public.team_members for select using (true);
create policy "regs_read_all"     on public.tournament_registrations for select using (true);
create policy "matches_read_all"  on public.matches  for select using (true);
create policy "mmr_read_all"      on public.mmr_history for select using (true);
create policy "highs_read_all"    on public.highlights for select using (true);

-- Write: usuarios autenticados propios datos
create policy "players_insert_own" on public.players for insert
  with check (auth.uid() = user_id);

create policy "players_update_own" on public.players for update
  using (auth.uid() = user_id);

create policy "tourns_insert_org" on public.tournaments for insert
  with check (
    exists (select 1 from public.players where user_id = auth.uid() and role in ('organizer','admin'))
  );

create policy "tourns_update_creator" on public.tournaments for update
  using (
    creator_id = (select id from public.players where user_id = auth.uid())
    or exists (select 1 from public.players where user_id = auth.uid() and role = 'admin')
  );

create policy "matches_update_org" on public.matches for update
  using (
    exists (
      select 1 from public.tournaments t
      join public.players p on p.user_id = auth.uid()
      where t.id = torneo_id and (t.creator_id = p.id or p.role = 'admin')
    )
  );

-- ═══════════════════════════════════════════════════
-- Función: actualizar stats del jugador post-match
-- ═══════════════════════════════════════════════════
create or replace function public.update_player_stats(
  p_player_id uuid,
  p_match_id  uuid,
  p_torneo_id uuid,
  p_gano      boolean,
  p_mmr_delta integer
) returns void language plpgsql security definer as $$
declare
  v_mmr_actual integer;
  v_mmr_nuevo  integer;
begin
  select mmr_global into v_mmr_actual from public.players where id = p_player_id;

  v_mmr_nuevo := v_mmr_actual + p_mmr_delta;
  if v_mmr_nuevo < 100 then v_mmr_nuevo := 100; end if;

  update public.players set
    mmr_global       = v_mmr_nuevo,
    partidas_jugadas = partidas_jugadas + 1,
    partidas_ganadas = partidas_ganadas + (case when p_gano then 1 else 0 end),
    winrate          = round(
      (partidas_ganadas + (case when p_gano then 1 else 0 end))::numeric /
      (partidas_jugadas + 1) * 100, 2
    )
  where id = p_player_id;

  insert into public.mmr_history (player_id, match_id, torneo_id, mmr_antes, mmr_despues, gano)
  values (p_player_id, p_match_id, p_torneo_id, v_mmr_actual, v_mmr_nuevo, p_gano);
end;
$$;

-- ── Indexes ───────────────────────────────────────────────────────
create index if not exists idx_players_mmr       on public.players(mmr_global desc);
create index if not exists idx_players_user_id   on public.players(user_id);
create index if not exists idx_tourns_estado      on public.tournaments(estado);
create index if not exists idx_matches_torneo     on public.matches(torneo_id);
create index if not exists idx_mmr_player        on public.mmr_history(player_id);
