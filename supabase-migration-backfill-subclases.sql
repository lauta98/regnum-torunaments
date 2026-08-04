-- Completa subclases_permitidas en los 9 torneos históricos según
-- lo que indica su propio nombre, para que el dropdown de subclase
-- en /torneos tenga datos reales desde el arranque. Los torneos
-- nuevos ya lo cargan solos desde el formulario de creación.

UPDATE public.tournaments SET subclases_permitidas = ARRAY['Bárbaro']
  WHERE nombre ILIKE '%BÁRBAROS%' OR nombre ILIKE '%BARBAROS%';

UPDATE public.tournaments SET subclases_permitidas = ARRAY['Brujo']
  WHERE nombre ILIKE '%BRUJOS%' OR nombre ILIKE '%BRUJO 1V1%';

UPDATE public.tournaments SET subclases_permitidas = ARRAY['Tirador']
  WHERE nombre ILIKE '%TIRADORES%' AND nombre NOT ILIKE '%MIXTOS%';

UPDATE public.tournaments SET subclases_permitidas = ARRAY['Tirador','Cazador']
  WHERE nombre ILIKE '%ARQUEROS%';

UPDATE public.tournaments SET subclases_permitidas = ARRAY['Brujo','Conjurador']
  WHERE nombre ILIKE '%MAGOS%';

UPDATE public.tournaments SET subclases_permitidas = ARRAY['Bárbaro','Caballero']
  WHERE nombre ILIKE '%GUERREROS%';

-- WINTER CUP (formato clanes/7v7) queda sin restricción de subclase a propósito.
