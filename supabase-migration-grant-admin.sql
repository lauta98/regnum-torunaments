-- Te hace admin (podés crear torneos, cargar resultados, y otorgar
-- roles a otros desde /admin más adelante). Ajustá el nickname si
-- hace falta.
UPDATE public.players SET role = 'admin' WHERE nickname_juego = 'Jose Armando';
