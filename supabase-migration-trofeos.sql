-- Copas personalizadas: cada organizador puede diseñar (nombre + color +
-- ícono, de un set curado) una copa propia y asignarla a sus torneos, en
-- vez del trofeo genérico por defecto. Privadas de quien las crea — no
-- hay biblioteca compartida entre organizadores.

create table if not exists public.trofeos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  icono       text not null,
  color       text not null,
  creado_por  uuid not null references public.players(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.tournaments
  add column if not exists trofeo_id uuid references public.trofeos(id) on delete set null;

alter table public.trofeos enable row level security;

drop policy if exists "trofeos_read_all" on public.trofeos;
drop policy if exists "trofeos_insert_own" on public.trofeos;
drop policy if exists "trofeos_update_own" on public.trofeos;
drop policy if exists "trofeos_delete_own" on public.trofeos;

-- Lectura pública: hace falta para mostrar la copa en el perfil/ranking
-- de cualquier visitante, no solo de quien la creó.
create policy "trofeos_read_all" on public.trofeos for select using (true);

create policy "trofeos_insert_own" on public.trofeos for insert
  with check (
    creado_por = (select id from public.players where user_id = auth.uid())
    and exists (select 1 from public.players where user_id = auth.uid() and role in ('organizer', 'admin'))
  );

create policy "trofeos_update_own" on public.trofeos for update
  using (
    creado_por = (select id from public.players where user_id = auth.uid())
    or exists (select 1 from public.players where user_id = auth.uid() and role = 'admin')
  );

create policy "trofeos_delete_own" on public.trofeos for delete
  using (
    creado_por = (select id from public.players where user_id = auth.uid())
    or exists (select 1 from public.players where user_id = auth.uid() and role = 'admin')
  );

create index if not exists idx_trofeos_creado_por on public.trofeos(creado_por);
create index if not exists idx_tournaments_trofeo on public.tournaments(trofeo_id);
