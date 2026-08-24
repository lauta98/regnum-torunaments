-- Historial de nicknames: cuando un mismo personaje (mismo jugador,
-- mismo character) cambió de nombre a lo largo del tiempo y jugó
-- distintos torneos bajo cada nombre, esto permite "fusionar" esas
-- identidades en una sola sin perder el nombre histórico que se
-- mostraba en cada torneo (teams.nombre queda intacto, es independiente
-- de personajes.nickname_juego).

CREATE TABLE IF NOT EXISTS public.personaje_nicknames_anteriores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personaje_id uuid NOT NULL REFERENCES public.personajes(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personaje_nicknames_anteriores_personaje ON public.personaje_nicknames_anteriores(personaje_id);

ALTER TABLE public.personaje_nicknames_anteriores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personaje_nicknames_anteriores_select_all" ON public.personaje_nicknames_anteriores FOR SELECT USING (true);
