-- =====================================================
-- CoR — Fix: la tabla players quedó exigiendo nickname_juego/
-- reino/clase_principal como obligatorios y únicos, pero esos
-- datos ahora viven en `personajes` (un jugador puede tener
-- varios personajes). Esto rompía la creación de cuenta nueva
-- ("Error creando tu cuenta") en /completar-perfil.
-- =====================================================

ALTER TABLE public.players ALTER COLUMN nickname_juego DROP NOT NULL;
ALTER TABLE public.players ALTER COLUMN reino            DROP NOT NULL;
ALTER TABLE public.players ALTER COLUMN clase_principal  DROP NOT NULL;

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_nickname_juego_key;
