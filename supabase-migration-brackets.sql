-- =====================================================
-- CoR — Migración: inscripción + generación de brackets
-- Ejecutar en el SQL Editor de Supabase (proyecto de Market,
-- uwxzumlzuwcnvzsztdnh — el mismo donde ya corrieron las dos
-- migraciones anteriores de Torneos).
-- =====================================================

-- ── Tipo de cuadro por torneo ──────────────────────────
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS bracket_type text NOT NULL DEFAULT 'single_elimination'
    CHECK (bracket_type IN ('single_elimination','double_elimination','round_robin'));

-- ── Subclases habilitadas a participar (NULL/vacío = todas) ──
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS subclases_permitidas text[];

-- ── Distinguir llave principal / perdedores / final en eliminación doble ──
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS bracket text NOT NULL DEFAULT 'main'
    CHECK (bracket IN ('main','losers','grand_final'));

-- ── Self-registro: cualquier jugador autenticado puede crear su
--    equipo e inscribirse mientras el torneo está en "inscripciones" ──
DROP POLICY IF EXISTS "teams_insert_self" ON public.teams;
CREATE POLICY "teams_insert_self" ON public.teams FOR INSERT
  WITH CHECK (
    capitan_id = (SELECT id FROM public.players WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "team_members_insert_self" ON public.team_members;
CREATE POLICY "team_members_insert_self" ON public.team_members FOR INSERT
  WITH CHECK (
    player_id = (SELECT id FROM public.players WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.capitan_id = (SELECT id FROM public.players WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "registrations_insert_self" ON public.tournament_registrations;
CREATE POLICY "registrations_insert_self" ON public.tournament_registrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.capitan_id = (SELECT id FROM public.players WHERE user_id = auth.uid())
    )
  );

-- ── Organizador/admin puede insertar y actualizar matches (generar cuadro) ──
DROP POLICY IF EXISTS "matches_insert_org" ON public.matches;
CREATE POLICY "matches_insert_org" ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      JOIN public.players p ON p.user_id = auth.uid()
      WHERE t.id = torneo_id AND (t.creator_id = p.id OR p.role = 'admin')
    )
  );
