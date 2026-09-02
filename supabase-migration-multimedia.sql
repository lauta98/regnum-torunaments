-- =====================================================
-- CoR Tournament Stats — Multimedia (compartir contenido + en vivo)
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Canal de Twitch: campo de perfil (uno por jugador, como el avatar),
-- no un post — se define una vez y listo.
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS twitch_username text;

-- `highlights` ya existe del schema original (id, titulo, descripcion,
-- video_url, thumbnail_url, jugador_id, torneo_id, likes, created_at),
-- con RLS habilitada y sin usar en ningún lado del código todavía.
-- Le suma el tipo de contenido para distinguir YouTube de Kick.
ALTER TABLE public.highlights ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'youtube';
ALTER TABLE public.highlights ADD CONSTRAINT highlights_tipo_valido CHECK (tipo IN ('youtube','kick'));

-- El read público ya está puesto en el bootstrap original ("highs_read_all").
-- Repone las policies de escritura por si no llegaron a cargarse en su momento.
DROP POLICY IF EXISTS "highlights_insert_own" ON public.highlights;
CREATE POLICY "highlights_insert_own" ON public.highlights FOR INSERT
  WITH CHECK (jugador_id = (SELECT id FROM public.players WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "highlights_delete_own" ON public.highlights;
CREATE POLICY "highlights_delete_own" ON public.highlights FOR DELETE
  USING (jugador_id = (SELECT id FROM public.players WHERE user_id = auth.uid()));
