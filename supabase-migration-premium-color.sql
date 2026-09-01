-- =====================================================
-- CoR Tournament Stats — Premium: color libre + fondo separado
-- Reemplaza los 7 temas prearmados (premium_theme) por un color
-- elegido libremente (premium_color, hex) y un estilo de fondo
-- independiente (premium_bg). Ejecutar en Supabase SQL Editor.
-- =====================================================

-- 1. Sacar el constraint viejo primero — si no, el UPDATE de abajo
--    (que escribe un color hex) choca contra la whitelist de los 7
--    temas prearmados que todavía está activa en este punto.
ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS premium_theme_valido,
  DROP CONSTRAINT IF EXISTS premium_theme_requiere_premium;

-- 2. Convertir los 7 temas prearmados viejos a su color hex
--    equivalente (y cualquier otro valor inesperado a NULL).
UPDATE public.players SET premium_theme = CASE premium_theme
  WHEN 'dorado'     THEN '#d4af37'
  WHEN 'cian'       THEN '#00d4ff'
  WHEN 'purpura'    THEN '#b060ff'
  WHEN 'legendario' THEN '#ff6b35'
  WHEN 'syrtis'     THEN '#4CAF50'
  WHEN 'ignis'      THEN '#F44336'
  WHEN 'alsius'     THEN '#2196F3'
  ELSE NULL
END
WHERE premium_theme IS NOT NULL;

ALTER TABLE public.players
  RENAME COLUMN premium_theme TO premium_color;

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS premium_bg text;

ALTER TABLE public.players
  ADD CONSTRAINT premium_color_valido CHECK (
    premium_color IS NULL OR premium_color ~ '^#[0-9a-fA-F]{6}$'
  ),
  ADD CONSTRAINT premium_color_requiere_premium CHECK (
    premium_color IS NULL OR es_premium = true
  ),
  ADD CONSTRAINT premium_bg_valido CHECK (
    premium_bg IS NULL OR premium_bg IN ('ninguno','sutil','intenso','neon')
  ),
  ADD CONSTRAINT premium_bg_requiere_premium CHECK (
    premium_bg IS NULL OR es_premium = true
  );
