-- =====================================================
-- CoR — Backfill: copiar los jugadores/personajes existentes
-- de `players` (esquema viejo) a la tabla `personajes` (nueva,
-- soporta varios personajes por jugador).
--
-- Correr DESPUÉS de supabase-migration-torneos-en-market.sql,
-- en el mismo proyecto. Es seguro re-ejecutar: no duplica filas
-- ya migradas (usa el nickname para detectar si ya existe).
-- =====================================================

INSERT INTO public.personajes (
  player_id, nickname_juego, reino, clase,
  mmr, winrate, partidas_jugadas, partidas_ganadas
)
SELECT
  id,
  nickname_juego,
  reino,
  clase_principal,
  COALESCE(mmr_global, 1200),
  COALESCE(winrate, 0),
  COALESCE(partidas_jugadas, 0),
  COALESCE(partidas_ganadas, 0)
FROM public.players
WHERE nickname_juego IS NOT NULL
  AND nickname_juego != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.personajes pj
    WHERE lower(pj.nickname_juego) = lower(public.players.nickname_juego)
  );

-- Vincular team_members.personaje_id para las inscripciones ya
-- existentes, matcheando por player_id (un jugador → su personaje
-- recién migrado).
UPDATE public.team_members tm
SET personaje_id = p.id
FROM public.personajes p
WHERE p.player_id = tm.player_id
  AND tm.personaje_id IS NULL;
