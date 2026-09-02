-- =====================================================
-- CoR Tournament Stats — Moderación de contenido en Multimedia
-- Mismo criterio que avatares reportados: no se oculta solo, un admin
-- decide (quitar o descartar). Ejecutar en Supabase SQL Editor.
-- =====================================================

ALTER TABLE public.highlights ADD COLUMN IF NOT EXISTS reportado boolean NOT NULL DEFAULT false;
ALTER TABLE public.highlights ADD COLUMN IF NOT EXISTS reporte_motivo text;
