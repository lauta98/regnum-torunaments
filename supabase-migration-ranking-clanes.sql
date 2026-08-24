-- Ranking de clanes: entidad persistente "clan" con su propio ELO/MMR,
-- separado del MMR individual de personajes. Un mismo clan puede volver a
-- inscribirse en futuros torneos de clanes (equipos "teams" nuevos por
-- torneo) y arrastrar su ELO entre ediciones vía esta tabla.

CREATE TABLE IF NOT EXISTS public.clanes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  logo_url text,
  mmr integer NOT NULL DEFAULT 1200,
  partidos_jugados integer NOT NULL DEFAULT 0,
  partidos_ganados integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vincula cada "teams" (equipo de un torneo puntual) con el clan
-- persistente al que representa, cuando corresponde.
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS clan_id uuid REFERENCES public.clanes(id);

-- Roster de un clan en un torneo puntual (el roster puede variar entre
-- ediciones, por eso queda atado a torneo_id, no solo a clan_id).
CREATE TABLE IF NOT EXISTS public.clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clanes(id) ON DELETE CASCADE,
  torneo_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  nombre_jugador text NOT NULL,
  subclase text CHECK (subclase IN ('Bárbaro','Caballero','Conjurador','Brujo','Tirador','Cazador')),
  titular boolean NOT NULL DEFAULT true,
  es_capitan boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Historial de ELO de clanes, análogo a mmr_history pero por clan.
CREATE TABLE IF NOT EXISTS public.clan_mmr_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clanes(id) ON DELETE CASCADE,
  torneo_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  rival_clan_id uuid REFERENCES public.clanes(id),
  mmr_antes integer NOT NULL,
  mmr_despues integer NOT NULL,
  gano boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON public.clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_torneo ON public.clan_members(torneo_id);
CREATE INDEX IF NOT EXISTS idx_clan_mmr_history_clan ON public.clan_mmr_history(clan_id);

ALTER TABLE public.clanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_mmr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clanes_select_all" ON public.clanes FOR SELECT USING (true);
CREATE POLICY "clan_members_select_all" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "clan_mmr_history_select_all" ON public.clan_mmr_history FOR SELECT USING (true);
