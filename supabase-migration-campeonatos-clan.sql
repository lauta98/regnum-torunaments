-- Distingue campeones individuales de campeones de clan (equipos 7v7 tipo
-- WINTER CUP), para no mostrar 5 trofeos "🏆 CAMPEÓN" idénticos como si
-- fueran logros 1v1 separados cuando en realidad es un solo logro colectivo.
alter table public.campeonatos
  add column if not exists tipo text not null default 'individual' check (tipo in ('individual', 'equipo')),
  add column if not exists equipo_nombre text;
