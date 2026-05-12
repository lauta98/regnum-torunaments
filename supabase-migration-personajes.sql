-- =====================================================
-- CoR Tournament Stats — Migración v2: Personajes
-- Ejecutar en Supabase SQL Editor del proyecto nuevo
-- =====================================================

-- ── 1. TABLA PERSONAJES ───────────────────────────────
CREATE TABLE public.personajes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  nickname_juego   text NOT NULL,
  reino            text NOT NULL,
  clase            text NOT NULL,
  mmr              integer NOT NULL DEFAULT 1200,
  winrate          numeric NOT NULL DEFAULT 0,
  partidas_jugadas integer NOT NULL DEFAULT 0,
  partidas_ganadas integer NOT NULL DEFAULT 0,
  winstreak        integer NOT NULL DEFAULT 0,
  verificado       boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Índice único case-insensitive para nicknames
CREATE UNIQUE INDEX personajes_nickname_lower_idx ON public.personajes (LOWER(nickname_juego));

-- ── 2. MIGRAR DATOS DE PLAYERS → PERSONAJES ──────────
INSERT INTO public.personajes (
  player_id, nickname_juego, reino, clase,
  mmr, winrate, partidas_jugadas, partidas_ganadas, winstreak
)
SELECT
  id,
  nickname_juego,
  reino,
  clase_principal,
  COALESCE(mmr_global, 1200),
  COALESCE(winrate, 0),
  COALESCE(partidas_jugadas, 0),
  COALESCE(partidas_ganadas, 0),
  COALESCE(winstreak, 0)
FROM public.players
WHERE nickname_juego IS NOT NULL AND nickname_juego != '';

-- ── 3. AGREGAR personaje_id A team_members ────────────
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS personaje_id uuid REFERENCES public.personajes(id) ON DELETE SET NULL;

-- ── 4. AGREGAR personaje_id A mmr_history ─────────────
ALTER TABLE public.mmr_history
  ADD COLUMN IF NOT EXISTS personaje_id uuid REFERENCES public.personajes(id) ON DELETE CASCADE;

-- Migrar mmr_history: asociar a personaje por player_id
UPDATE public.mmr_history mh
SET personaje_id = p.id
FROM public.personajes p
WHERE p.player_id = mh.player_id;

-- ── 5. TABLA NICKNAME_REPORTS ─────────────────────────
CREATE TABLE public.nickname_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid REFERENCES public.players(id) ON DELETE SET NULL,
  personaje_id uuid NOT NULL REFERENCES public.personajes(id) ON DELETE CASCADE,
  motivo       text NOT NULL,
  estado       text NOT NULL DEFAULT 'pendiente',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 6. RLS ────────────────────────────────────────────
ALTER TABLE public.personajes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nickname_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read personajes"        ON public.personajes       FOR SELECT USING (true);
CREATE POLICY "public read reports"           ON public.nickname_reports FOR SELECT USING (true);

CREATE POLICY "players manage own personajes" ON public.personajes
  FOR ALL USING (
    player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
  );

CREATE POLICY "players insert reports"  ON public.nickname_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "service full access personajes" ON public.personajes       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service full access reports"    ON public.nickname_reports FOR ALL USING (auth.role() = 'service_role');
