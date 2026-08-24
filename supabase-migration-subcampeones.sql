-- Medalla de plata: registrar también al subcampeón (2do puesto) de cada
-- torneo, no solo al campeón. Reutiliza la tabla campeonatos existente con
-- un campo `puesto` (1 = campeón, 2 = subcampeón) en vez de una tabla
-- nueva -- el mismo unique(torneo_id, personaje_id) sigue siendo válido
-- porque un personaje solo puede tener UN puesto por torneo.

alter table public.campeonatos
  add column if not exists puesto integer not null default 1 check (puesto in (1, 2));
