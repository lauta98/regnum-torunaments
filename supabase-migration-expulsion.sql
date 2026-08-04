-- =====================================================
-- CoR — Migración: expulsar equipos/jugadores de un torneo
-- =====================================================

ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo','expulsado'));

ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS motivo_expulsion text;

ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS expulsado_por uuid REFERENCES public.players(id) ON DELETE SET NULL;

ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS expulsado_at timestamptz;

-- Organizador/admin del torneo puede actualizar la inscripción (expulsar)
DROP POLICY IF EXISTS "registrations_update_org" ON public.tournament_registrations;
CREATE POLICY "registrations_update_org" ON public.tournament_registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      JOIN public.players p ON p.user_id = auth.uid()
      WHERE t.id = tournament_id AND (t.creator_id = p.id OR p.role = 'admin')
    )
  );
