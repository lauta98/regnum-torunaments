-- =====================================================
-- CoR Tournament Stats — Canales de YouTube y Kick en el perfil
-- (Twitch ya existía desde la migración de multimedia)
-- Ejecutar en Supabase SQL Editor
-- =====================================================

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS youtube_channel text;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS kick_username text;
