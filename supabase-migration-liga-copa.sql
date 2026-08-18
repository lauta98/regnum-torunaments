-- Formato "Liga + Copa": fase de liga (round robin) seguida de una fase de
-- copa (eliminatoria) armada con los mejores puestos de la tabla, generada
-- aparte cuando el organizador confirma que la liga terminó.

ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_bracket_type_check;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_bracket_type_check
  CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin', 'league_cup'));

ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS playoff_cupo integer;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS playoff_bracket_type text
  CHECK (playoff_bracket_type IN ('single_elimination', 'double_elimination'));

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_bracket_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_bracket_check
  CHECK (bracket IN ('main', 'losers', 'grand_final', 'league'));
