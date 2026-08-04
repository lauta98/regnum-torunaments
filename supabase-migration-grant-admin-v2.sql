-- Version corregida: el nickname vive en personajes, no en players.
-- Busca la cuenta (players) a traves del personaje "Jose Armando".
UPDATE public.players
SET role = 'admin'
WHERE id = (
  SELECT player_id FROM public.personajes
  WHERE nickname_juego ILIKE 'Jose Armando'
  LIMIT 1
);

-- Verificación: debería devolver 1 fila con role = 'admin'.
SELECT p.id, p.discord_username, p.role, pj.nickname_juego
FROM public.players p
JOIN public.personajes pj ON pj.player_id = p.id
WHERE pj.nickname_juego ILIKE 'Jose Armando';
