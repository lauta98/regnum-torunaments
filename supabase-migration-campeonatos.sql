-- =====================================================
-- CoR — Salón de la Fama: tabla de campeonatos
-- Ejecutar en el SQL Editor de Supabase (proyecto uwxzumlzuwcnvzsztdnh)
-- =====================================================

create table if not exists public.campeonatos (
  id           uuid primary key default gen_random_uuid(),
  torneo_id    uuid not null references public.tournaments(id) on delete cascade,
  personaje_id uuid not null references public.personajes(id) on delete cascade,
  player_id    uuid references public.players(id) on delete set null,
  foto_url     text,
  created_at   timestamptz not null default now(),
  unique (torneo_id, personaje_id)
);

alter table public.campeonatos enable row level security;

drop policy if exists "campeonatos_read_all" on public.campeonatos;
drop policy if exists "campeonatos_manage_org" on public.campeonatos;
drop policy if exists "service_all_campeonatos" on public.campeonatos;

create policy "campeonatos_read_all" on public.campeonatos for select using (true);

-- El organizador del torneo (o un admin) puede subir/editar la foto del
-- campeón y, si hace falta, agregar/corregir manualmente un campeonato.
create policy "campeonatos_manage_org" on public.campeonatos for all using (
  exists (
    select 1 from public.tournaments t
    join public.players p on p.user_id = auth.uid()
    where t.id = torneo_id and (t.creator_id = p.id or p.role = 'admin')
  )
);

create policy "service_all_campeonatos" on public.campeonatos for all using (auth.role() = 'service_role');

create index if not exists idx_campeonatos_torneo on public.campeonatos(torneo_id);
create index if not exists idx_campeonatos_personaje on public.campeonatos(personaje_id);

-- Bucket de Storage para las fotos (torneo + campeón). Si ya existe un
-- bucket llamado 'tournament-photos' este insert no hace nada (on conflict).
insert into storage.buckets (id, name, public)
values ('tournament-photos', 'tournament-photos', true)
on conflict (id) do nothing;

drop policy if exists "tournament_photos_read_all" on storage.objects;
drop policy if exists "tournament_photos_write_org" on storage.objects;

create policy "tournament_photos_read_all" on storage.objects for select
  using (bucket_id = 'tournament-photos');

-- Cualquier usuario autenticado puede subir (el chequeo fino de "sos
-- organizador de ESTE torneo" ya lo hace la UI antes de mostrar el botón,
-- y el path incluye el torneo_id para que quede prolijo en el bucket).
create policy "tournament_photos_write_org" on storage.objects for insert
  with check (bucket_id = 'tournament-photos' and auth.uid() is not null);

create policy "tournament_photos_update_org" on storage.objects for update
  using (bucket_id = 'tournament-photos' and auth.uid() is not null);

-- =====================================================
-- Personaje principal (el "main" que se muestra como
-- nombre de usuario en el ranking por cuenta y demás
-- lugares donde hoy se usa discord_username)
-- =====================================================
alter table public.players
  add column if not exists personaje_principal_id uuid references public.personajes(id) on delete set null;
-- No hace falta politica nueva: "players_update_own" ya permite que cada
-- uno edite su propia fila (de donde sale este campo).

