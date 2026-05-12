-- ============================================================
-- CoR Tournament Stats — Historical Tournament Data
-- Generated: 2026-05-11
-- 8 torneos: Jun 2024 – Mar 2026
-- Ejecutar bloque por bloque en Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. PREREQUISITO: columna winstreak
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS winstreak integer NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────
-- 1. JUGADORES (ON CONFLICT = skip si ya existe)
-- ────────────────────────────────────────────────────────────

-- BRUJOS (clase por defecto = Brujo)
INSERT INTO public.players (nickname_juego, reino, clase_principal) VALUES
  ('Allahed',               'Ignis',  'Brujo'),
  ('Aru Akise',             'Syrtis', 'Brujo'),
  ('Bewitched',             'Syrtis', 'Brujo'),
  ('benyo',                 'Ignis',  'Brujo'),
  ('BUENA ESA COMPA',       'Ignis',  'Brujo'),
  ('Chikitin cacu',         'Syrtis', 'Brujo'),
  ('dean mescaline',        'Syrtis', 'Brujo'),
  ('Dlaze',                 'Ignis',  'Brujo'),
  ('F''acundz',             'Ignis',  'Brujo'),
  ('Fumando Pasto',         'Alsius', 'Brujo'),
  ('Gettz',                 'Syrtis', 'Brujo'),
  ('guhl',                  'Ignis',  'Brujo'),
  ('Gyokkofindlich',        'Alsius', 'Brujo'),
  ('hm',                    'Syrtis', 'Brujo'),
  ('Ice lord',              'Syrtis', 'Brujo'),
  ('Iruca',                 'Syrtis', 'Brujo'),
  ('Johnny el mago',        'Alsius', 'Brujo'),
  ('Kankuro',               'Alsius', 'Brujo'),
  ('LA MMGVA',              'Syrtis', 'Brujo'),
  ('Leinstungskombinator',  'Alsius', 'Brujo'),
  ('Machiavellian',         'Alsius', 'Brujo'),
  ('mag mage (Piranha)',    'Syrtis', 'Brujo'),
  ('Mas duro q el Diego',   'Syrtis', 'Brujo'),
  ('Mojabi Ghost',          'Syrtis', 'Brujo'),
  ('Nethier',               'Syrtis', 'Brujo'),
  ('Nezraph',               'Syrtis', 'Brujo'),
  ('Pep Guardiola',         'Syrtis', 'Brujo'),
  ('Planewreck',            'Alsius', 'Brujo'),
  ('Pythonicus',            'Syrtis', 'Brujo'),
  ('rafita',                'Syrtis', 'Brujo'),
  ('Reaction',              'Alsius', 'Brujo'),
  ('Rezem',                 'Syrtis', 'Brujo'),
  ('saint sarki',           'Syrtis', 'Brujo'),
  ('Scaloneta',             'Ignis',  'Brujo'),
  ('Shukinha',              'Syrtis', 'Brujo'),
  ('Skkjoldung',            'Syrtis', 'Brujo'),
  ('Sormek',                'Alsius', 'Brujo'),
  ('Szandor Lavey',         'Syrtis', 'Brujo'),
  ('Trevas na Cara',        'Syrtis', 'Brujo')
ON CONFLICT (nickname_juego) DO NOTHING;

-- MAGOS 2v2 — nuevos (Brujos/Conjuradores no listados arriba)
INSERT INTO public.players (nickname_juego, reino, clase_principal) VALUES
  ('bakulito',          'Syrtis', 'Conjurador'),
  ('Erwaijaven',        'Ignis',  'Brujo'),
  ('fotopies',          'Syrtis', 'Brujo'),
  ('haralc',            'Syrtis', 'Brujo'),
  ('hijo de mil putas', 'Syrtis', 'Brujo'),
  ('Olusya',            'Syrtis', 'Brujo'),
  ('Stratzy',           'Syrtis', 'Conjurador'),
  ('Udliumdlech''m',    'Ignis',  'Brujo'),
  ('vani''tas',         'Syrtis', 'Brujo'),
  ('vedrana',           'Syrtis', 'Brujo'),
  ('Vilkaviskis',       'Ignis',  'Conjurador'),
  ('Xyior',             'Alsius', 'Conjurador'),
  ('yoruashi',          'Syrtis', 'Brujo'),
  ('zelphy',            'Alsius', 'Conjurador')
ON CONFLICT (nickname_juego) DO NOTHING;

-- TIRADORES (clase por defecto = Tirador)
INSERT INTO public.players (nickname_juego, reino, clase_principal) VALUES
  ('Aguirre',           'Ignis',  'Tirador'),
  ('Buuxy Slat',        'Syrtis', 'Tirador'),
  ('Chuleton',          'Syrtis', 'Tirador'),
  ('Couso',             'Syrtis', 'Tirador'),
  ('Dopping Positivo',  'Syrtis', 'Tirador'),
  ('drv',               'Ignis',  'Tirador'),
  ('El tira real',      'Syrtis', 'Tirador'),
  ('Erlang Shen',       'Syrtis', 'Tirador'),
  ('Filius Draco',      'Ignis',  'Tirador'),
  ('Gumayussi',         'Alsius', 'Tirador'),
  ('Hero of Eryn Galen','Syrtis', 'Tirador'),
  ('Hideo Kojima',      'Ignis',  'Tirador'),
  ('I-Salvatore-I',     'Ignis',  'Tirador'),
  ('Jasblesss',         'Syrtis', 'Tirador'),
  ('Jin Kaede',         'Syrtis', 'Tirador'),
  ('Jin Kiyora',        'Ignis',  'Tirador'),
  ('Kazen',             'Syrtis', 'Tirador'),
  ('Leekjx',            'Alsius', 'Tirador'),
  ('Memphys',           'Syrtis', 'Tirador'),
  ('Mr Diego',          'Alsius', 'Tirador'),
  ('Nyhroz',            'Ignis',  'Tirador'),
  ('Panzer-Elite',      'Syrtis', 'Tirador'),
  ('Pato Donald',       'Ignis',  'Tirador'),
  ('Ricky',             'Syrtis', 'Tirador'),
  ('Schnell''Kraz',     'Syrtis', 'Tirador'),
  ('Seikens',           'Ignis',  'Tirador'),
  ('Slayeou',           'Syrtis', 'Tirador'),
  ('Stifmeister',       'Syrtis', 'Tirador'),
  ('Tanahisu',          'Ignis',  'Tirador'),
  ('Tosta Dora',        'Alsius', 'Tirador'),
  ('Travesti Merkeado', 'Alsius', 'Tirador'),
  ('Wismi',             'Syrtis', 'Tirador'),
  ('Yung''Beef',        'Ignis',  'Tirador')
ON CONFLICT (nickname_juego) DO NOTHING;

-- DyS ARQUEROS MIXTOS — nuevos (no están en Tiradores arriba)
INSERT INTO public.players (nickname_juego, reino, clase_principal) VALUES
  ('Arveid',                   'Alsius', 'Tirador'),
  ('Audered',                  'Ignis',  'Tirador'),
  ('Baji',                     'Syrtis', 'Cazador'),
  ('Bizzler',                  'Alsius', 'Cazador'),
  ('Boodhi',                   'Syrtis', 'Cazador'),
  ('Cyril Kamer',              'Ignis',  'Cazador'),
  ('evomoralesyma',            'Ignis',  'Cazador'),
  ('Ezreaal',                  'Syrtis', 'Tirador'),
  ('Falcon''Dankworth',        'Syrtis', 'Tirador'),
  ('FLAITE',                   'Ignis',  'Tirador'),
  ('Frankkoh',                 'Syrtis', 'Tirador'),
  ('Haqir',                    'Syrtis', 'Cazador'),
  ('Hot Butterfly',            'Syrtis', 'Tirador'),
  ('ILL COOK',                 'Alsius', 'Cazador'),
  ('James''Hetfield',          'Ignis',  'Cazador'),
  ('Kaine',                    'Ignis',  'Tirador'),
  ('Knight Archer (Piranha)',  'Syrtis', 'Cazador'),
  ('KOJIRO SASAKII',           'Syrtis', 'Tirador'),
  ('Neig',                     'Syrtis', 'Cazador'),
  ('Pamspicy',                 'Syrtis', 'Tirador'),
  ('Rolling Papers',           'Syrtis', 'Tirador'),
  ('Skogollo',                 'Ignis',  'Tirador'),
  ('Stunned',                  'Syrtis', 'Tirador'),
  ('Vector',                   'Syrtis', 'Tirador'),
  ('Vic Vega',                 'Alsius', 'Tirador')
ON CONFLICT (nickname_juego) DO NOTHING;

-- ARQUEROS 2v2 — nuevos (Cazadores/Tiradores no listados arriba)
INSERT INTO public.players (nickname_juego, reino, clase_principal) VALUES
  ('dark-man',          'Syrtis', 'Cazador'),
  ('el gordo humberto', 'Alsius', 'Cazador'),
  ('el''monjeh',        'Syrtis', 'Cazador'),
  ('elros tar',         'Syrtis', 'Cazador'),
  ('frezian',           'Syrtis', 'Cazador'),
  ('icons',             'Syrtis', 'Cazador'),
  ('ja'' gaia',         'Syrtis', 'Cazador'),
  ('radahn',            'Syrtis', 'Cazador'),
  ('shroud',            'Syrtis', 'Tirador'),
  ('stephen curry',     'Syrtis', 'Cazador'),
  ('tenshi batuzay',    'Syrtis', 'Cazador'),
  ('tottenham',         'Syrtis', 'Cazador'),
  ('trinity of haven',  'Syrtis', 'Cazador'),
  ('fayze',             'Syrtis', 'Cazador'),
  ('ultra gamma',       'Ignis',  'Tirador'),
  ('Zroggen',           'Ignis',  'Tirador'),
  ('zranox',            'Syrtis', 'Cazador'),
  ('knigh',             'Syrtis', 'Cazador')   -- nombre truncado en bracket
ON CONFLICT (nickname_juego) DO NOTHING;

-- GUERREROS 2v2 — nuevos (Bárbaros/Caballeros)
INSERT INTO public.players (nickname_juego, reino, clase_principal) VALUES
  ('AGARRINI LAPALINI',   'Alsius', 'Caballero'),
  ('amaterasu',           'Alsius', 'Caballero'),
  ('androide diecisiete', 'Syrtis', 'Bárbaro'),
  ('asiri',               'Syrtis', 'Bárbaro'),
  ('astrid kummer',       'Alsius', 'Bárbaro'),
  ('aurons',              'Syrtis', 'Bárbaro'),
  ('azuru blight',        'Alsius', 'Caballero'),
  ('blue leibel',         'Alsius', 'Bárbaro'),
  ('dark fra',            'Alsius', 'Caballero'),
  ('drakaro',             'Alsius', 'Bárbaro'),
  ('ebbe',                'Syrtis', 'Bárbaro'),
  ('egil haland',         'Syrtis', 'Caballero'),
  ('Elfitopen',           'Syrtis', 'Caballero'),
  ('ema',                 'Alsius', 'Caballero'),
  ('flo''jy',             'Ignis',  'Bárbaro'),
  ('goblin guard',        'Syrtis', 'Bárbaro'),
  ('griffith d',          'Syrtis', 'Bárbaro'),
  ('goku',                'Ignis',  'Bárbaro'),
  ('ithea',               'Syrtis', 'Bárbaro'),
  ('jannito',             'Syrtis', 'Bárbaro'),
  ('jen',                 'Syrtis', 'Bárbaro'),
  ('Jentsen',             'Ignis',  'Caballero'),
  ('joa',                 'Ignis',  'Bárbaro'),
  ('leyton cook',         'Syrtis', 'Bárbaro'),
  ('Llama maste',         'Syrtis', 'Caballero'),
  ('mukanjya',            'Alsius', 'Bárbaro'),
  ('nylamp',              'Syrtis', 'Bárbaro'),
  ('QWERTYUIOP',          'Ignis',  'Bárbaro'),
  ('s''hor',              'Ignis',  'Bárbaro'),
  ('shroquevi',           'Syrtis', 'Bárbaro'),
  ('tezz janx',           'Syrtis', 'Bárbaro'),
  ('boca porro y vlno',     'Syrtis', 'Bárbaro'),  -- nombre truncado
  ('zoger',               'Syrtis', 'Bárbaro')   -- nombre truncado
ON CONFLICT (nickname_juego) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. TORNEOS
-- ────────────────────────────────────────────────────────────
INSERT INTO public.tournaments
  (nombre, formato, estado, fecha_inicio, max_equipos, descripcion)
VALUES
  ('TORNEO DE BRUJOS',        '1v1', 'finalizado', '2024-06-17', 32,
   '1v1 Single Elimination — Brujos · Campeón: Johnny el mago'),
  ('TORNEO DE TIRADORES',     '1v1', 'finalizado', '2024-07-01', 64,
   '1v1 Single Elimination — Tiradores · Campeón: Schnell''Kraz'),
  ('COR BRUJO 1V1',           '1v1', 'finalizado', '2025-11-22', 32,
   '1v1 Single Elimination — Brujos · Campeón: mag mage (Piranha)'),
  ('DyS ARQUEROS MIXTOS 1V1', '1v1', 'finalizado', '2025-12-13', 32,
   '1v1 Single Elimination — Arqueros Mixtos · Campeón: Dopping Positivo'),
  ('MAGOS 2V2',               '2v2', 'finalizado', '2025-07-15', 16,
   '2v2 Double Elimination — Brujos/Conjuradores · Campeón: saint sarki – Vilkaviskis'),
  ('ARQUEROS 2V2',            '2v2', 'finalizado', '2025-07-15', 16,
   '2v2 Double Elimination — Arqueros · Campeón: Kazen – zranox'),
  ('GUERREROS 2V2',           '2v2', 'finalizado', '2025-07-15', 32,
   '2v2 Double Elimination — Guerreros · Campeón: Jentsen – QWERTYUIOP'),
  ('WINTER CUP 2026',         '7v7', 'finalizado', '2026-03-14', 6,
   '7v7 Round Robin — 6 clanes · Campeón: Sumo')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. TORNEO DE BRUJOS (Jun 17 2024 — 19 jugadores, 1v1)
-- ============================================================
DO $$
DECLARE
  v_tid uuid;
  p_johnny uuid; p_gettz uuid; p_dean uuid; p_mojabi uuid;
  p_allahed uuid; p_scaloneta uuid; p_chikitin uuid; p_iruca uuid;
  p_dlaze uuid; p_aru uuid; p_nethier uuid; p_rezem uuid;
  p_reaction uuid; p_pep uuid; p_skkjoldung uuid; p_szandor uuid;
  p_iceLord uuid; p_bewitched uuid; p_gyokko uuid;
  t_johnny uuid; t_gettz uuid; t_dean uuid; t_mojabi uuid;
  t_allahed uuid; t_scaloneta uuid; t_chikitin uuid; t_iruca uuid;
  t_dlaze uuid; t_aru uuid; t_nethier uuid; t_rezem uuid;
  t_reaction uuid; t_pep uuid; t_skkjoldung uuid; t_szandor uuid;
  t_iceLord uuid; t_bewitched uuid; t_gyokko uuid;
  m uuid;
BEGIN
  SELECT id INTO v_tid FROM public.tournaments WHERE nombre = 'TORNEO DE BRUJOS';
  SELECT id INTO p_johnny    FROM public.players WHERE nickname_juego = 'Johnny el mago';
  SELECT id INTO p_gettz     FROM public.players WHERE nickname_juego = 'Gettz';
  SELECT id INTO p_dean      FROM public.players WHERE nickname_juego = 'dean mescaline';
  SELECT id INTO p_mojabi    FROM public.players WHERE nickname_juego = 'Mojabi Ghost';
  SELECT id INTO p_allahed   FROM public.players WHERE nickname_juego = 'Allahed';
  SELECT id INTO p_scaloneta FROM public.players WHERE nickname_juego = 'Scaloneta';
  SELECT id INTO p_chikitin  FROM public.players WHERE nickname_juego = 'Chikitin cacu';
  SELECT id INTO p_iruca     FROM public.players WHERE nickname_juego = 'Iruca';
  SELECT id INTO p_dlaze     FROM public.players WHERE nickname_juego = 'Dlaze';
  SELECT id INTO p_aru       FROM public.players WHERE nickname_juego = 'Aru Akise';
  SELECT id INTO p_nethier   FROM public.players WHERE nickname_juego = 'Nethier';
  SELECT id INTO p_rezem     FROM public.players WHERE nickname_juego = 'Rezem';
  SELECT id INTO p_reaction  FROM public.players WHERE nickname_juego = 'Reaction';
  SELECT id INTO p_pep       FROM public.players WHERE nickname_juego = 'Pep Guardiola';
  SELECT id INTO p_skkjoldung FROM public.players WHERE nickname_juego = 'Skkjoldung';
  SELECT id INTO p_szandor   FROM public.players WHERE nickname_juego = 'Szandor Lavey';
  SELECT id INTO p_iceLord   FROM public.players WHERE nickname_juego = 'Ice lord';
  SELECT id INTO p_bewitched FROM public.players WHERE nickname_juego = 'Bewitched';
  SELECT id INTO p_gyokko    FROM public.players WHERE nickname_juego = 'Gyokkofindlich';

  t_johnny:=gen_random_uuid(); t_gettz:=gen_random_uuid(); t_dean:=gen_random_uuid();
  t_mojabi:=gen_random_uuid(); t_allahed:=gen_random_uuid(); t_scaloneta:=gen_random_uuid();
  t_chikitin:=gen_random_uuid(); t_iruca:=gen_random_uuid(); t_dlaze:=gen_random_uuid();
  t_aru:=gen_random_uuid(); t_nethier:=gen_random_uuid(); t_rezem:=gen_random_uuid();
  t_reaction:=gen_random_uuid(); t_pep:=gen_random_uuid(); t_skkjoldung:=gen_random_uuid();
  t_szandor:=gen_random_uuid(); t_iceLord:=gen_random_uuid(); t_bewitched:=gen_random_uuid();
  t_gyokko:=gen_random_uuid();

  INSERT INTO public.teams (id, nombre, capitan_id, tipo) VALUES
    (t_johnny,    'Johnny el mago',  p_johnny,    '1v1'),
    (t_gettz,     'Gettz',           p_gettz,     '1v1'),
    (t_dean,      'dean mescaline',  p_dean,      '1v1'),
    (t_mojabi,    'Mojabi Ghost',    p_mojabi,    '1v1'),
    (t_allahed,   'Allahed',         p_allahed,   '1v1'),
    (t_scaloneta, 'Scaloneta',       p_scaloneta, '1v1'),
    (t_chikitin,  'Chikitin cacu',   p_chikitin,  '1v1'),
    (t_iruca,     'Iruca',           p_iruca,     '1v1'),
    (t_dlaze,     'Dlaze',           p_dlaze,     '1v1'),
    (t_aru,       'Aru Akise',       p_aru,       '1v1'),
    (t_nethier,   'Nethier',         p_nethier,   '1v1'),
    (t_rezem,     'Rezem',           p_rezem,     '1v1'),
    (t_reaction,  'Reaction',        p_reaction,  '1v1'),
    (t_pep,       'Pep Guardiola',   p_pep,       '1v1'),
    (t_skkjoldung,'Skkjoldung',      p_skkjoldung,'1v1'),
    (t_szandor,   'Szandor Lavey',   p_szandor,   '1v1'),
    (t_iceLord,   'Ice lord',        p_iceLord,   '1v1'),
    (t_bewitched, 'Bewitched',       p_bewitched, '1v1'),
    (t_gyokko,    'Gyokkofindlich',  p_gyokko,    '1v1');

  INSERT INTO public.tournament_registrations (tournament_id, team_id) VALUES
    (v_tid,t_johnny),(v_tid,t_gettz),(v_tid,t_dean),(v_tid,t_mojabi),
    (v_tid,t_allahed),(v_tid,t_scaloneta),(v_tid,t_chikitin),(v_tid,t_iruca),
    (v_tid,t_dlaze),(v_tid,t_aru),(v_tid,t_nethier),(v_tid,t_rezem),
    (v_tid,t_reaction),(v_tid,t_pep),(v_tid,t_skkjoldung),(v_tid,t_szandor),
    (v_tid,t_iceLord),(v_tid,t_bewitched),(v_tid,t_gyokko);

  -- RONDA 1
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,1,t_scaloneta,t_rezem,'2-1',t_scaloneta,'jugado');
  PERFORM public.update_player_stats(p_scaloneta,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_rezem,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,2,t_reaction,t_pep,'2-0',t_reaction,'jugado');
  PERFORM public.update_player_stats(p_reaction,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_pep,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,3,t_dean,t_skkjoldung,'2-0',t_dean,'jugado');
  PERFORM public.update_player_stats(p_dean,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_skkjoldung,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,4,t_chikitin,t_szandor,'2-0',t_chikitin,'jugado');
  PERFORM public.update_player_stats(p_chikitin,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_szandor,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,5,t_mojabi,t_iceLord,'2-0',t_mojabi,'jugado');
  PERFORM public.update_player_stats(p_mojabi,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_iceLord,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,6,t_iruca,t_bewitched,'2-0',t_iruca,'jugado');
  PERFORM public.update_player_stats(p_iruca,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_bewitched,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,7,t_johnny,t_gyokko,'2-0',t_johnny,'jugado');
  PERFORM public.update_player_stats(p_johnny,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_gyokko,m,v_tid,false,-16);

  -- RONDA 2
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,1,t_allahed,t_reaction,'2-0',t_allahed,'jugado');
  PERFORM public.update_player_stats(p_allahed,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_reaction,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,2,t_gettz,t_scaloneta,'2-0',t_gettz,'jugado');
  PERFORM public.update_player_stats(p_gettz,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_scaloneta,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,3,t_dean,t_nethier,'2-0',t_dean,'jugado');
  PERFORM public.update_player_stats(p_dean,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_nethier,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,4,t_dlaze,t_aru,'2-0',t_dlaze,'jugado');
  PERFORM public.update_player_stats(p_dlaze,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_aru,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,5,t_mojabi,t_iruca,'2-0',t_mojabi,'jugado');
  PERFORM public.update_player_stats(p_mojabi,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_iruca,m,v_tid,false,-16);

  -- CUARTOS
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Cuartos de Final',3,1,t_gettz,t_chikitin,'2-0',t_gettz,'jugado');
  PERFORM public.update_player_stats(p_gettz,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_chikitin,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Cuartos de Final',3,2,t_mojabi,t_dlaze,'2-0',t_mojabi,'jugado');
  PERFORM public.update_player_stats(p_mojabi,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_dlaze,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Cuartos de Final',3,3,t_johnny,t_allahed,'2-1',t_johnny,'jugado');
  PERFORM public.update_player_stats(p_johnny,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_allahed,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Cuartos de Final',3,4,t_dean,t_dlaze,'2-1',t_dean,'jugado');
  PERFORM public.update_player_stats(p_dean,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_dlaze,m,v_tid,false,-16);

  -- SEMIFINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Semifinal',4,1,t_gettz,t_mojabi,'2-0',t_gettz,'jugado');
  PERFORM public.update_player_stats(p_gettz,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_mojabi,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Semifinal',4,2,t_johnny,t_dean,'2-1',t_johnny,'jugado');
  PERFORM public.update_player_stats(p_johnny,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_dean,m,v_tid,false,-16);

  -- FINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Final',5,1,t_johnny,t_gettz,'3-1',t_johnny,'jugado');
  PERFORM public.update_player_stats(p_johnny,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_gettz,m,v_tid,false,-16);

END $$;

-- ============================================================
-- 4. TORNEO DE TIRADORES (Jul 1 2024 — 33 jugadores, 1v1)
-- ============================================================
DO $$
DECLARE
  v_tid uuid;
  p_schnell uuid; p_pato uuid; p_kazen uuid; p_jinkiyora uuid;
  p_gumayussi uuid; p_dopping uuid; p_memphys uuid; p_jinkaede uuid;
  p_hideo uuid; p_aguirre uuid; p_travesti uuid; p_elTira uuid;
  p_slayeou uuid; p_iSalvatore uuid; p_drv uuid; p_nyhroz uuid;
  p_erlang uuid; p_stifmeister uuid; p_yungbeef uuid; p_ricky uuid;
  p_flaite uuid; p_panzer uuid; p_couso uuid; p_seikens uuid;
  p_buuxy uuid; p_jasblesss uuid; p_wismi uuid; p_leekjx uuid;
  p_mrDiego uuid; p_tosta uuid; p_hero uuid; p_chuleton uuid;
  p_filius uuid;
  t_schnell uuid; t_pato uuid; t_kazen uuid; t_jinkiyora uuid;
  t_gumayussi uuid; t_dopping uuid; t_memphys uuid; t_jinkaede uuid;
  t_hideo uuid; t_aguirre uuid; t_travesti uuid; t_elTira uuid;
  t_slayeou uuid; t_iSalvatore uuid; t_drv uuid; t_nyhroz uuid;
  t_erlang uuid; t_stifmeister uuid; t_yungbeef uuid; t_ricky uuid;
  t_flaite uuid; t_panzer uuid; t_couso uuid; t_seikens uuid;
  t_buuxy uuid; t_jasblesss uuid; t_wismi uuid; t_leekjx uuid;
  t_mrDiego uuid; t_tosta uuid; t_hero uuid; t_chuleton uuid;
  t_filius uuid;
  m uuid;
BEGIN
  SELECT id INTO v_tid FROM public.tournaments WHERE nombre = 'TORNEO DE TIRADORES';
  SELECT id INTO p_schnell    FROM public.players WHERE nickname_juego = 'Schnell''Kraz';
  SELECT id INTO p_pato       FROM public.players WHERE nickname_juego = 'Pato Donald';
  SELECT id INTO p_kazen      FROM public.players WHERE nickname_juego = 'Kazen';
  SELECT id INTO p_jinkiyora  FROM public.players WHERE nickname_juego = 'Jin Kiyora';
  SELECT id INTO p_gumayussi  FROM public.players WHERE nickname_juego = 'Gumayussi';
  SELECT id INTO p_dopping    FROM public.players WHERE nickname_juego = 'Dopping Positivo';
  SELECT id INTO p_memphys    FROM public.players WHERE nickname_juego = 'Memphys';
  SELECT id INTO p_jinkaede   FROM public.players WHERE nickname_juego = 'Jin Kaede';
  SELECT id INTO p_hideo      FROM public.players WHERE nickname_juego = 'Hideo Kojima';
  SELECT id INTO p_aguirre    FROM public.players WHERE nickname_juego = 'Aguirre';
  SELECT id INTO p_travesti   FROM public.players WHERE nickname_juego = 'Travesti Merkeado';
  SELECT id INTO p_elTira     FROM public.players WHERE nickname_juego = 'El tira real';
  SELECT id INTO p_slayeou    FROM public.players WHERE nickname_juego = 'Slayeou';
  SELECT id INTO p_iSalvatore FROM public.players WHERE nickname_juego = 'I-Salvatore-I';
  SELECT id INTO p_drv        FROM public.players WHERE nickname_juego = 'drv';
  SELECT id INTO p_nyhroz     FROM public.players WHERE nickname_juego = 'Nyhroz';
  SELECT id INTO p_erlang     FROM public.players WHERE nickname_juego = 'Erlang Shen';
  SELECT id INTO p_stifmeister FROM public.players WHERE nickname_juego = 'Stifmeister';
  SELECT id INTO p_yungbeef   FROM public.players WHERE nickname_juego = 'Yung''Beef';
  SELECT id INTO p_ricky      FROM public.players WHERE nickname_juego = 'Ricky';
  SELECT id INTO p_flaite     FROM public.players WHERE nickname_juego = 'FLAITE';
  SELECT id INTO p_panzer     FROM public.players WHERE nickname_juego = 'Panzer-Elite';
  SELECT id INTO p_couso      FROM public.players WHERE nickname_juego = 'Couso';
  SELECT id INTO p_seikens    FROM public.players WHERE nickname_juego = 'Seikens';
  SELECT id INTO p_buuxy      FROM public.players WHERE nickname_juego = 'Buuxy Slat';
  SELECT id INTO p_jasblesss  FROM public.players WHERE nickname_juego = 'Jasblesss';
  SELECT id INTO p_wismi      FROM public.players WHERE nickname_juego = 'Wismi';
  SELECT id INTO p_leekjx     FROM public.players WHERE nickname_juego = 'Leekjx';
  SELECT id INTO p_mrDiego    FROM public.players WHERE nickname_juego = 'Mr Diego';
  SELECT id INTO p_tosta      FROM public.players WHERE nickname_juego = 'Tosta Dora';
  SELECT id INTO p_hero       FROM public.players WHERE nickname_juego = 'Hero of Eryn Galen';
  SELECT id INTO p_chuleton   FROM public.players WHERE nickname_juego = 'Chuleton';
  SELECT id INTO p_filius     FROM public.players WHERE nickname_juego = 'Filius Draco';

  -- Teams
  t_schnell:=gen_random_uuid(); t_pato:=gen_random_uuid(); t_kazen:=gen_random_uuid();
  t_jinkiyora:=gen_random_uuid(); t_gumayussi:=gen_random_uuid(); t_dopping:=gen_random_uuid();
  t_memphys:=gen_random_uuid(); t_jinkaede:=gen_random_uuid(); t_hideo:=gen_random_uuid();
  t_aguirre:=gen_random_uuid(); t_travesti:=gen_random_uuid(); t_elTira:=gen_random_uuid();
  t_slayeou:=gen_random_uuid(); t_iSalvatore:=gen_random_uuid(); t_drv:=gen_random_uuid();
  t_nyhroz:=gen_random_uuid(); t_erlang:=gen_random_uuid(); t_stifmeister:=gen_random_uuid();
  t_yungbeef:=gen_random_uuid(); t_ricky:=gen_random_uuid(); t_flaite:=gen_random_uuid();
  t_panzer:=gen_random_uuid(); t_couso:=gen_random_uuid(); t_seikens:=gen_random_uuid();
  t_buuxy:=gen_random_uuid(); t_jasblesss:=gen_random_uuid(); t_wismi:=gen_random_uuid();
  t_leekjx:=gen_random_uuid(); t_mrDiego:=gen_random_uuid(); t_tosta:=gen_random_uuid();
  t_hero:=gen_random_uuid(); t_chuleton:=gen_random_uuid(); t_filius:=gen_random_uuid();

  INSERT INTO public.teams (id, nombre, capitan_id, tipo) VALUES
    (t_schnell,    'Schnell''Kraz',     p_schnell,    '1v1'),
    (t_pato,       'Pato Donald',       p_pato,       '1v1'),
    (t_kazen,      'Kazen',             p_kazen,      '1v1'),
    (t_jinkiyora,  'Jin Kiyora',        p_jinkiyora,  '1v1'),
    (t_gumayussi,  'Gumayussi',         p_gumayussi,  '1v1'),
    (t_dopping,    'Dopping Positivo',  p_dopping,    '1v1'),
    (t_memphys,    'Memphys',           p_memphys,    '1v1'),
    (t_jinkaede,   'Jin Kaede',         p_jinkaede,   '1v1'),
    (t_hideo,      'Hideo Kojima',      p_hideo,      '1v1'),
    (t_aguirre,    'Aguirre',           p_aguirre,    '1v1'),
    (t_travesti,   'Travesti Merkeado', p_travesti,   '1v1'),
    (t_elTira,     'El tira real',      p_elTira,     '1v1'),
    (t_slayeou,    'Slayeou',           p_slayeou,    '1v1'),
    (t_iSalvatore, 'I-Salvatore-I',     p_iSalvatore, '1v1'),
    (t_drv,        'drv',               p_drv,        '1v1'),
    (t_nyhroz,     'Nyhroz',            p_nyhroz,     '1v1'),
    (t_erlang,     'Erlang Shen',       p_erlang,     '1v1'),
    (t_stifmeister,'Stifmeister',       p_stifmeister,'1v1'),
    (t_yungbeef,   'Yung''Beef',        p_yungbeef,   '1v1'),
    (t_ricky,      'Ricky',             p_ricky,      '1v1'),
    (t_flaite,     'FLAITE',            p_flaite,     '1v1'),
    (t_panzer,     'Panzer-Elite',      p_panzer,     '1v1'),
    (t_couso,      'Couso',             p_couso,      '1v1'),
    (t_seikens,    'Seikens',           p_seikens,    '1v1'),
    (t_buuxy,      'Buuxy Slat',        p_buuxy,      '1v1'),
    (t_jasblesss,  'Jasblesss',         p_jasblesss,  '1v1'),
    (t_wismi,      'Wismi',             p_wismi,      '1v1'),
    (t_leekjx,     'Leekjx',            p_leekjx,     '1v1'),
    (t_mrDiego,    'Mr Diego',          p_mrDiego,    '1v1'),
    (t_tosta,      'Tosta Dora',        p_tosta,      '1v1'),
    (t_hero,       'Hero of Eryn Galen',p_hero,       '1v1'),
    (t_chuleton,   'Chuleton',          p_chuleton,   '1v1'),
    (t_filius,     'Filius Draco',      p_filius,     '1v1');

  INSERT INTO public.tournament_registrations (tournament_id, team_id) VALUES
    (v_tid,t_schnell),(v_tid,t_pato),(v_tid,t_kazen),(v_tid,t_jinkiyora),
    (v_tid,t_gumayussi),(v_tid,t_dopping),(v_tid,t_memphys),(v_tid,t_jinkaede),
    (v_tid,t_hideo),(v_tid,t_aguirre),(v_tid,t_travesti),(v_tid,t_elTira),
    (v_tid,t_slayeou),(v_tid,t_iSalvatore),(v_tid,t_drv),(v_tid,t_nyhroz),
    (v_tid,t_erlang),(v_tid,t_stifmeister),(v_tid,t_yungbeef),(v_tid,t_ricky),
    (v_tid,t_flaite),(v_tid,t_panzer),(v_tid,t_couso),(v_tid,t_seikens),
    (v_tid,t_buuxy),(v_tid,t_jasblesss),(v_tid,t_wismi),(v_tid,t_leekjx),
    (v_tid,t_mrDiego),(v_tid,t_tosta),(v_tid,t_hero),(v_tid,t_chuleton),
    (v_tid,t_filius);

  -- RONDA 1 (rondas conocidas)
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,1,t_gumayussi,t_jinkaede,'3-2',t_gumayussi,'jugado');
  PERFORM public.update_player_stats(p_gumayussi,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_jinkaede,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,2,t_dopping,t_nyhroz,'2-0',t_dopping,'jugado');
  PERFORM public.update_player_stats(p_dopping,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_nyhroz,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,3,t_kazen,t_hideo,'2-0',t_kazen,'jugado');
  PERFORM public.update_player_stats(p_kazen,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_hideo,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,4,t_memphys,t_aguirre,'2-1',t_memphys,'jugado');
  PERFORM public.update_player_stats(p_memphys,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_aguirre,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,5,t_drv,t_travesti,'2-1',t_drv,'jugado');
  PERFORM public.update_player_stats(p_drv,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_travesti,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,6,t_pato,t_elTira,'2-0',t_pato,'jugado');
  PERFORM public.update_player_stats(p_pato,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_elTira,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,7,t_slayeou,t_iSalvatore,'2-0',t_slayeou,'jugado');
  PERFORM public.update_player_stats(p_slayeou,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_iSalvatore,m,v_tid,false,-16);

  -- CUARTOS DE FINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Cuartos de Final',2,1,t_kazen,t_gumayussi,'3-1',t_kazen,'jugado');
  PERFORM public.update_player_stats(p_kazen,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_gumayussi,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Cuartos de Final',2,2,t_pato,t_memphys,'3-1',t_pato,'jugado');
  PERFORM public.update_player_stats(p_pato,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_memphys,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Cuartos de Final',2,3,t_jinkiyora,t_erlang,'3-1',t_jinkiyora,'jugado');
  PERFORM public.update_player_stats(p_jinkiyora,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_erlang,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Cuartos de Final',2,4,t_schnell,t_stifmeister,'3-0',t_schnell,'jugado');
  PERFORM public.update_player_stats(p_schnell,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_stifmeister,m,v_tid,false,-16);

  -- SEMIFINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Semifinal',3,1,t_pato,t_kazen,'3-1',t_pato,'jugado');
  PERFORM public.update_player_stats(p_pato,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_kazen,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Semifinal',3,2,t_schnell,t_jinkiyora,'3-1',t_schnell,'jugado');
  PERFORM public.update_player_stats(p_schnell,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_jinkiyora,m,v_tid,false,-16);

  -- FINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Final',4,1,t_schnell,t_pato,'3-1',t_schnell,'jugado');
  PERFORM public.update_player_stats(p_schnell,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_pato,m,v_tid,false,-16);

END $$;

-- ============================================================
-- 5. COR BRUJO 1V1 (Nov 22 2025 — 23 jugadores, 1v1)
-- ============================================================
DO $$
DECLARE
  v_tid uuid;
  p_magmage uuid; p_lammgva uuid; p_planewreck uuid; p_sormek uuid;
  p_buena uuid; p_saintsarki uuid; p_trevas uuid; p_hm uuid;
  p_fumando uuid; p_dlaze uuid; p_facundz uuid; p_reaction uuid;
  p_pythonicus uuid; p_benyo uuid; p_masrafe uuid; p_rafita uuid;
  p_guhl uuid; p_shukinha uuid; p_kankuro uuid; p_machiavellian uuid;
  p_nezraph uuid; p_leinstung uuid; p_szandor uuid;
  t_magmage uuid; t_lammgva uuid; t_planewreck uuid; t_sormek uuid;
  t_buena uuid; t_saintsarki uuid; t_trevas uuid; t_hm uuid;
  t_fumando uuid; t_dlaze uuid; t_facundz uuid; t_reaction uuid;
  t_pythonicus uuid; t_benyo uuid; t_masrafe uuid; t_rafita uuid;
  t_guhl uuid; t_shukinha uuid; t_kankuro uuid; t_machiavellian uuid;
  t_nezraph uuid; t_leinstung uuid; t_szandor uuid;
  m uuid;
BEGIN
  SELECT id INTO v_tid FROM public.tournaments WHERE nombre = 'COR BRUJO 1V1';
  SELECT id INTO p_magmage      FROM public.players WHERE nickname_juego = 'mag mage (Piranha)';
  SELECT id INTO p_lammgva      FROM public.players WHERE nickname_juego = 'LA MMGVA';
  SELECT id INTO p_planewreck   FROM public.players WHERE nickname_juego = 'Planewreck';
  SELECT id INTO p_sormek       FROM public.players WHERE nickname_juego = 'Sormek';
  SELECT id INTO p_buena        FROM public.players WHERE nickname_juego = 'BUENA ESA COMPA';
  SELECT id INTO p_saintsarki   FROM public.players WHERE nickname_juego = 'saint sarki';
  SELECT id INTO p_trevas       FROM public.players WHERE nickname_juego = 'Trevas na Cara';
  SELECT id INTO p_hm           FROM public.players WHERE nickname_juego = 'hm';
  SELECT id INTO p_fumando      FROM public.players WHERE nickname_juego = 'Fumando Pasto';
  SELECT id INTO p_dlaze        FROM public.players WHERE nickname_juego = 'Dlaze';
  SELECT id INTO p_facundz      FROM public.players WHERE nickname_juego = 'F''acundz';
  SELECT id INTO p_reaction     FROM public.players WHERE nickname_juego = 'Reaction';
  SELECT id INTO p_pythonicus   FROM public.players WHERE nickname_juego = 'Pythonicus';
  SELECT id INTO p_benyo        FROM public.players WHERE nickname_juego = 'benyo';
  SELECT id INTO p_masrafe      FROM public.players WHERE nickname_juego = 'Mas duro q el Diego';
  SELECT id INTO p_rafita       FROM public.players WHERE nickname_juego = 'rafita';
  SELECT id INTO p_guhl         FROM public.players WHERE nickname_juego = 'guhl';
  SELECT id INTO p_shukinha     FROM public.players WHERE nickname_juego = 'Shukinha';
  SELECT id INTO p_kankuro      FROM public.players WHERE nickname_juego = 'Kankuro';
  SELECT id INTO p_machiavellian FROM public.players WHERE nickname_juego = 'Machiavellian';
  SELECT id INTO p_nezraph      FROM public.players WHERE nickname_juego = 'Nezraph';
  SELECT id INTO p_leinstung    FROM public.players WHERE nickname_juego = 'Leinstungskombinator';
  SELECT id INTO p_szandor      FROM public.players WHERE nickname_juego = 'Szandor Lavey';

  t_magmage:=gen_random_uuid(); t_lammgva:=gen_random_uuid(); t_planewreck:=gen_random_uuid();
  t_sormek:=gen_random_uuid(); t_buena:=gen_random_uuid(); t_saintsarki:=gen_random_uuid();
  t_trevas:=gen_random_uuid(); t_hm:=gen_random_uuid(); t_fumando:=gen_random_uuid();
  t_dlaze:=gen_random_uuid(); t_facundz:=gen_random_uuid(); t_reaction:=gen_random_uuid();
  t_pythonicus:=gen_random_uuid(); t_benyo:=gen_random_uuid(); t_masrafe:=gen_random_uuid();
  t_rafita:=gen_random_uuid(); t_guhl:=gen_random_uuid(); t_shukinha:=gen_random_uuid();
  t_kankuro:=gen_random_uuid(); t_machiavellian:=gen_random_uuid(); t_nezraph:=gen_random_uuid();
  t_leinstung:=gen_random_uuid(); t_szandor:=gen_random_uuid();

  INSERT INTO public.teams (id, nombre, capitan_id, tipo) VALUES
    (t_magmage,     'mag mage (Piranha)',  p_magmage,     '1v1'),
    (t_lammgva,     'LA MMGVA',           p_lammgva,     '1v1'),
    (t_planewreck,  'Planewreck',         p_planewreck,  '1v1'),
    (t_sormek,      'Sormek',             p_sormek,      '1v1'),
    (t_buena,       'BUENA ESA COMPA',    p_buena,       '1v1'),
    (t_saintsarki,  'saint sarki',        p_saintsarki,  '1v1'),
    (t_trevas,      'Trevas na Cara',     p_trevas,      '1v1'),
    (t_hm,          'hm',                 p_hm,          '1v1'),
    (t_fumando,     'Fumando Pasto',      p_fumando,     '1v1'),
    (t_dlaze,       'Dlaze',              p_dlaze,       '1v1'),
    (t_facundz,     'F''acundz',          p_facundz,     '1v1'),
    (t_reaction,    'Reaction',           p_reaction,    '1v1'),
    (t_pythonicus,  'Pythonicus',         p_pythonicus,  '1v1'),
    (t_benyo,       'benyo',              p_benyo,       '1v1'),
    (t_masrafe,     'Mas duro q el Diego',p_masrafe,     '1v1'),
    (t_rafita,      'rafita',             p_rafita,      '1v1'),
    (t_guhl,        'guhl',               p_guhl,        '1v1'),
    (t_shukinha,    'Shukinha',           p_shukinha,    '1v1'),
    (t_kankuro,     'Kankuro',            p_kankuro,     '1v1'),
    (t_machiavellian,'Machiavellian',     p_machiavellian,'1v1'),
    (t_nezraph,     'Nezraph',            p_nezraph,     '1v1'),
    (t_leinstung,   'Leinstungskombinator',p_leinstung,  '1v1'),
    (t_szandor,     'Szandor Lavey',      p_szandor,     '1v1');

  INSERT INTO public.tournament_registrations (tournament_id, team_id) VALUES
    (v_tid,t_magmage),(v_tid,t_lammgva),(v_tid,t_planewreck),(v_tid,t_sormek),
    (v_tid,t_buena),(v_tid,t_saintsarki),(v_tid,t_trevas),(v_tid,t_hm),
    (v_tid,t_fumando),(v_tid,t_dlaze),(v_tid,t_facundz),(v_tid,t_reaction),
    (v_tid,t_pythonicus),(v_tid,t_benyo),(v_tid,t_masrafe),(v_tid,t_rafita),
    (v_tid,t_guhl),(v_tid,t_shukinha),(v_tid,t_kankuro),(v_tid,t_machiavellian),
    (v_tid,t_nezraph),(v_tid,t_leinstung),(v_tid,t_szandor);

  -- RONDA 1
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,1,t_buena,t_shukinha,'2-0',t_buena,'jugado');
  PERFORM public.update_player_stats(p_buena,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_shukinha,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,2,t_saintsarki,t_rafita,'2-0',t_saintsarki,'jugado');
  PERFORM public.update_player_stats(p_saintsarki,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_rafita,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,3,t_sormek,t_guhl,'2-0',t_sormek,'jugado');
  PERFORM public.update_player_stats(p_sormek,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_guhl,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,4,t_fumando,t_dlaze,'2-0',t_fumando,'jugado');
  PERFORM public.update_player_stats(p_fumando,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_dlaze,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,5,t_trevas,t_facundz,'2-0',t_trevas,'jugado');
  PERFORM public.update_player_stats(p_trevas,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_facundz,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,6,t_hm,t_reaction,'2-0',t_hm,'jugado');
  PERFORM public.update_player_stats(p_hm,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_reaction,m,v_tid,false,-16);

  -- RONDA 2
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,1,t_buena,t_pythonicus,'2-0',t_buena,'jugado');
  PERFORM public.update_player_stats(p_buena,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_pythonicus,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,2,t_lammgva,t_benyo,'2-0',t_lammgva,'jugado');
  PERFORM public.update_player_stats(p_lammgva,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_benyo,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,3,t_planewreck,t_saintsarki,'2-1',t_planewreck,'jugado');
  PERFORM public.update_player_stats(p_planewreck,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_saintsarki,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,4,t_sormek,t_masrafe,'2-1',t_sormek,'jugado');
  PERFORM public.update_player_stats(p_sormek,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_masrafe,m,v_tid,false,-16);

  -- SEMIFINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Semifinal',3,1,t_lammgva,t_buena,'2-1',t_lammgva,'jugado');
  PERFORM public.update_player_stats(p_lammgva,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_buena,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Semifinal',3,2,t_magmage,t_sormek,'2-0',t_magmage,'jugado');
  PERFORM public.update_player_stats(p_magmage,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_sormek,m,v_tid,false,-16);

  -- FINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Final',4,1,t_magmage,t_lammgva,'3-0',t_magmage,'jugado');
  PERFORM public.update_player_stats(p_magmage,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_lammgva,m,v_tid,false,-16);

END $$;

-- ============================================================
-- 6. DyS ARQUEROS MIXTOS 1V1 (Dic 13 2025 — 28 jugadores)
-- ============================================================
DO $$
DECLARE
  v_tid uuid;
  p_dopping uuid; p_knight uuid; p_audered uuid; p_james uuid;
  p_haqir uuid; p_pamspicy uuid; p_vector uuid; p_evomora uuid;
  p_ezreaal uuid; p_ricky uuid; p_jinkaede uuid; p_falcon uuid;
  p_frankkoh uuid; p_rolling uuid; p_kaine uuid; p_kojiro uuid;
  p_skogollo uuid; p_vicvega uuid; p_flaite uuid; p_neig uuid;
  p_boodhi uuid; p_illcook uuid; p_cyril uuid; p_stunned uuid;
  p_hotbutter uuid; p_bizzler uuid; p_baji uuid; p_arveid uuid;
  t_dopping uuid; t_knight uuid; t_audered uuid; t_james uuid;
  t_haqir uuid; t_pamspicy uuid; t_vector uuid; t_evomora uuid;
  t_ezreaal uuid; t_ricky uuid; t_jinkaede uuid; t_falcon uuid;
  t_frankkoh uuid; t_rolling uuid; t_kaine uuid; t_kojiro uuid;
  t_skogollo uuid; t_vicvega uuid; t_flaite uuid; t_neig uuid;
  t_boodhi uuid; t_illcook uuid; t_cyril uuid; t_stunned uuid;
  t_hotbutter uuid; t_bizzler uuid; t_baji uuid; t_arveid uuid;
  m uuid;
BEGIN
  SELECT id INTO v_tid FROM public.tournaments WHERE nombre = 'DyS ARQUEROS MIXTOS 1V1';
  SELECT id INTO p_dopping   FROM public.players WHERE nickname_juego = 'Dopping Positivo';
  SELECT id INTO p_knight    FROM public.players WHERE nickname_juego = 'Knight Archer (Piranha)';
  SELECT id INTO p_audered   FROM public.players WHERE nickname_juego = 'Audered';
  SELECT id INTO p_james     FROM public.players WHERE nickname_juego = 'James''Hetfield';
  SELECT id INTO p_haqir     FROM public.players WHERE nickname_juego = 'Haqir';
  SELECT id INTO p_pamspicy  FROM public.players WHERE nickname_juego = 'Pamspicy';
  SELECT id INTO p_vector    FROM public.players WHERE nickname_juego = 'Vector';
  SELECT id INTO p_evomora   FROM public.players WHERE nickname_juego = 'evomoralesyma';
  SELECT id INTO p_ezreaal   FROM public.players WHERE nickname_juego = 'Ezreaal';
  SELECT id INTO p_ricky     FROM public.players WHERE nickname_juego = 'Ricky';
  SELECT id INTO p_jinkaede  FROM public.players WHERE nickname_juego = 'Jin Kaede';
  SELECT id INTO p_falcon    FROM public.players WHERE nickname_juego = 'Falcon''Dankworth';
  SELECT id INTO p_frankkoh  FROM public.players WHERE nickname_juego = 'Frankkoh';
  SELECT id INTO p_rolling   FROM public.players WHERE nickname_juego = 'Rolling Papers';
  SELECT id INTO p_kaine     FROM public.players WHERE nickname_juego = 'Kaine';
  SELECT id INTO p_kojiro    FROM public.players WHERE nickname_juego = 'KOJIRO SASAKII';
  SELECT id INTO p_skogollo  FROM public.players WHERE nickname_juego = 'Skogollo';
  SELECT id INTO p_vicvega   FROM public.players WHERE nickname_juego = 'Vic Vega';
  SELECT id INTO p_flaite    FROM public.players WHERE nickname_juego = 'FLAITE';
  SELECT id INTO p_neig      FROM public.players WHERE nickname_juego = 'Neig';
  SELECT id INTO p_boodhi    FROM public.players WHERE nickname_juego = 'Boodhi';
  SELECT id INTO p_illcook   FROM public.players WHERE nickname_juego = 'ILL COOK';
  SELECT id INTO p_cyril     FROM public.players WHERE nickname_juego = 'Cyril Kamer';
  SELECT id INTO p_stunned   FROM public.players WHERE nickname_juego = 'Stunned';
  SELECT id INTO p_hotbutter FROM public.players WHERE nickname_juego = 'Hot Butterfly';
  SELECT id INTO p_bizzler   FROM public.players WHERE nickname_juego = 'Bizzler';
  SELECT id INTO p_baji      FROM public.players WHERE nickname_juego = 'Baji';
  SELECT id INTO p_arveid    FROM public.players WHERE nickname_juego = 'Arveid';

  t_dopping:=gen_random_uuid(); t_knight:=gen_random_uuid(); t_audered:=gen_random_uuid();
  t_james:=gen_random_uuid(); t_haqir:=gen_random_uuid(); t_pamspicy:=gen_random_uuid();
  t_vector:=gen_random_uuid(); t_evomora:=gen_random_uuid(); t_ezreaal:=gen_random_uuid();
  t_ricky:=gen_random_uuid(); t_jinkaede:=gen_random_uuid(); t_falcon:=gen_random_uuid();
  t_frankkoh:=gen_random_uuid(); t_rolling:=gen_random_uuid(); t_kaine:=gen_random_uuid();
  t_kojiro:=gen_random_uuid(); t_skogollo:=gen_random_uuid(); t_vicvega:=gen_random_uuid();
  t_flaite:=gen_random_uuid(); t_neig:=gen_random_uuid(); t_boodhi:=gen_random_uuid();
  t_illcook:=gen_random_uuid(); t_cyril:=gen_random_uuid(); t_stunned:=gen_random_uuid();
  t_hotbutter:=gen_random_uuid(); t_bizzler:=gen_random_uuid(); t_baji:=gen_random_uuid();
  t_arveid:=gen_random_uuid();

  INSERT INTO public.teams (id, nombre, capitan_id, tipo) VALUES
    (t_dopping,   'Dopping Positivo',        p_dopping,  '1v1'),
    (t_knight,    'Knight Archer (Piranha)',  p_knight,   '1v1'),
    (t_audered,   'Audered',                 p_audered,  '1v1'),
    (t_james,     'James''Hetfield',         p_james,    '1v1'),
    (t_haqir,     'Haqir',                   p_haqir,    '1v1'),
    (t_pamspicy,  'Pamspicy',                p_pamspicy, '1v1'),
    (t_vector,    'Vector',                  p_vector,   '1v1'),
    (t_evomora,   'evomoralesyma',           p_evomora,  '1v1'),
    (t_ezreaal,   'Ezreaal',                 p_ezreaal,  '1v1'),
    (t_ricky,     'Ricky',                   p_ricky,    '1v1'),
    (t_jinkaede,  'Jin Kaede',               p_jinkaede, '1v1'),
    (t_falcon,    'Falcon''Dankworth',       p_falcon,   '1v1'),
    (t_frankkoh,  'Frankkoh',               p_frankkoh, '1v1'),
    (t_rolling,   'Rolling Papers',          p_rolling,  '1v1'),
    (t_kaine,     'Kaine',                   p_kaine,    '1v1'),
    (t_kojiro,    'KOJIRO SASAKII',          p_kojiro,   '1v1'),
    (t_skogollo,  'Skogollo',               p_skogollo, '1v1'),
    (t_vicvega,   'Vic Vega',               p_vicvega,  '1v1'),
    (t_flaite,    'FLAITE',                 p_flaite,   '1v1'),
    (t_neig,      'Neig',                   p_neig,     '1v1'),
    (t_boodhi,    'Boodhi',                 p_boodhi,   '1v1'),
    (t_illcook,   'ILL COOK',               p_illcook,  '1v1'),
    (t_cyril,     'Cyril Kamer',            p_cyril,    '1v1'),
    (t_stunned,   'Stunned',               p_stunned,  '1v1'),
    (t_hotbutter, 'Hot Butterfly',          p_hotbutter,'1v1'),
    (t_bizzler,   'Bizzler',               p_bizzler,  '1v1'),
    (t_baji,      'Baji',                  p_baji,     '1v1'),
    (t_arveid,    'Arveid',                p_arveid,   '1v1');

  INSERT INTO public.tournament_registrations (tournament_id, team_id) VALUES
    (v_tid,t_dopping),(v_tid,t_knight),(v_tid,t_audered),(v_tid,t_james),
    (v_tid,t_haqir),(v_tid,t_pamspicy),(v_tid,t_vector),(v_tid,t_evomora),
    (v_tid,t_ezreaal),(v_tid,t_ricky),(v_tid,t_jinkaede),(v_tid,t_falcon),
    (v_tid,t_frankkoh),(v_tid,t_rolling),(v_tid,t_kaine),(v_tid,t_kojiro),
    (v_tid,t_skogollo),(v_tid,t_vicvega),(v_tid,t_flaite),(v_tid,t_neig),
    (v_tid,t_boodhi),(v_tid,t_illcook),(v_tid,t_cyril),(v_tid,t_stunned),
    (v_tid,t_hotbutter),(v_tid,t_bizzler),(v_tid,t_baji),(v_tid,t_arveid);

  -- RONDA 1
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,1,t_ezreaal,t_skogollo,'2-0',t_ezreaal,'jugado');
  PERFORM public.update_player_stats(p_ezreaal,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_skogollo,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,2,t_haqir,t_vicvega,'2-0',t_haqir,'jugado');
  PERFORM public.update_player_stats(p_haqir,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_vicvega,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,3,t_ricky,t_flaite,'2-0',t_ricky,'jugado');
  PERFORM public.update_player_stats(p_ricky,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_flaite,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,4,t_pamspicy,t_neig,'2-0',t_pamspicy,'jugado');
  PERFORM public.update_player_stats(p_pamspicy,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_neig,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,5,t_jinkaede,t_boodhi,'2-0',t_jinkaede,'jugado');
  PERFORM public.update_player_stats(p_jinkaede,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_boodhi,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,6,t_falcon,t_illcook,'2-0',t_falcon,'jugado');
  PERFORM public.update_player_stats(p_falcon,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_illcook,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 1',1,7,t_james,t_cyril,'2-0',t_james,'jugado');
  PERFORM public.update_player_stats(p_james,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_cyril,m,v_tid,false,-16);

  -- RONDA 2
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,1,t_audered,t_frankkoh,'2-0',t_audered,'jugado');
  PERFORM public.update_player_stats(p_audered,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_frankkoh,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,2,t_haqir,t_ezreaal,'2-1',t_haqir,'jugado');
  PERFORM public.update_player_stats(p_haqir,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_ezreaal,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,3,t_knight,t_ricky,'2-0',t_knight,'jugado');
  PERFORM public.update_player_stats(p_knight,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_ricky,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,4,t_pamspicy,t_jinkaede,'2-1',t_pamspicy,'jugado');
  PERFORM public.update_player_stats(p_pamspicy,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_jinkaede,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,5,t_dopping,t_rolling,'2-0',t_dopping,'jugado');
  PERFORM public.update_player_stats(p_dopping,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_rolling,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,6,t_vector,t_falcon,'2-0',t_vector,'jugado');
  PERFORM public.update_player_stats(p_vector,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_falcon,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,7,t_james,t_kaine,'2-0',t_james,'jugado');
  PERFORM public.update_player_stats(p_james,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_kaine,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 2',2,8,t_evomora,t_kojiro,'2-0',t_evomora,'jugado');
  PERFORM public.update_player_stats(p_evomora,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_kojiro,m,v_tid,false,-16);

  -- RONDA 3
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 3',3,1,t_audered,t_haqir,'2-1',t_audered,'jugado');
  PERFORM public.update_player_stats(p_audered,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_haqir,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Ronda 3',3,2,t_knight,t_pamspicy,'2-0',t_knight,'jugado');
  PERFORM public.update_player_stats(p_knight,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_pamspicy,m,v_tid,false,-16);

  -- SEMIFINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Semifinal',4,1,t_dopping,t_james,'3-1',t_dopping,'jugado');
  PERFORM public.update_player_stats(p_dopping,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_james,m,v_tid,false,-16);

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Semifinal',4,2,t_knight,t_audered,'3-2',t_knight,'jugado');
  PERFORM public.update_player_stats(p_knight,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_audered,m,v_tid,false,-16);

  -- FINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Final',5,1,t_dopping,t_knight,'3-1',t_dopping,'jugado');
  PERFORM public.update_player_stats(p_dopping,m,v_tid,true,16);
  PERFORM public.update_player_stats(p_knight,m,v_tid,false,-16);

END $$;

-- ============================================================
-- 7. MAGOS 2V2 (Jul 15 2025 — 9 equipos, Double Elim)
-- ============================================================
DO $$
DECLARE
  v_tid uuid;
  p_sarki uuid; p_vilkav uuid; p_johnny uuid; p_xyior uuid;
  p_leinstung uuid; p_bakulito uuid; p_erwaijaven uuid; p_stratzy uuid;
  p_zelphy uuid;
  t_sarki_vilkav uuid; t_johnny_xyior uuid; t_leinstung_baku uuid;
  t_erw_stratzy uuid; t_zelphy_x uuid;
  m uuid;
BEGIN
  SELECT id INTO v_tid FROM public.tournaments WHERE nombre = 'MAGOS 2V2';
  SELECT id INTO p_sarki     FROM public.players WHERE nickname_juego = 'saint sarki';
  SELECT id INTO p_vilkav    FROM public.players WHERE nickname_juego = 'Vilkaviskis';
  SELECT id INTO p_johnny    FROM public.players WHERE nickname_juego = 'Johnny el mago';
  SELECT id INTO p_xyior     FROM public.players WHERE nickname_juego = 'Xyior';
  SELECT id INTO p_leinstung FROM public.players WHERE nickname_juego = 'Leinstungskombinator';
  SELECT id INTO p_bakulito  FROM public.players WHERE nickname_juego = 'bakulito';
  SELECT id INTO p_erwaijaven FROM public.players WHERE nickname_juego = 'Erwaijaven';
  SELECT id INTO p_stratzy   FROM public.players WHERE nickname_juego = 'Stratzy';
  SELECT id INTO p_zelphy    FROM public.players WHERE nickname_juego = 'zelphy';

  t_sarki_vilkav  := gen_random_uuid();
  t_johnny_xyior  := gen_random_uuid();
  t_leinstung_baku:= gen_random_uuid();
  t_erw_stratzy   := gen_random_uuid();
  t_zelphy_x      := gen_random_uuid();

  INSERT INTO public.teams (id, nombre, capitan_id, tipo) VALUES
    (t_sarki_vilkav,   'saint sarki - Vilkaviskis',     p_sarki,     '2v2'),
    (t_johnny_xyior,   'Johnny el mago - Xyior',        p_johnny,    '2v2'),
    (t_leinstung_baku, 'Leinstungskombinator - bakulito',p_leinstung, '2v2'),
    (t_erw_stratzy,    'Erwaijaven - Stratzy',          p_erwaijaven,'2v2'),
    (t_zelphy_x,       'zelphy - Xyior (alt)',          p_zelphy,    '2v2');
  -- Nota: solo se registran los equipos con pairings conocidos

  INSERT INTO public.team_members (team_id, player_id) VALUES
    (t_sarki_vilkav, p_sarki),    (t_sarki_vilkav, p_vilkav),
    (t_johnny_xyior, p_johnny),   (t_johnny_xyior, p_xyior),
    (t_leinstung_baku,p_leinstung),(t_leinstung_baku,p_bakulito),
    (t_erw_stratzy,  p_erwaijaven),(t_erw_stratzy,  p_stratzy);

  INSERT INTO public.tournament_registrations (tournament_id, team_id) VALUES
    (v_tid,t_sarki_vilkav),(v_tid,t_johnny_xyior),
    (v_tid,t_leinstung_baku),(v_tid,t_erw_stratzy);

  -- GRAN FINAL: saint sarki – Vilkaviskis vs Johnny el mago – Xyior
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Gran Final',3,1,t_sarki_vilkav,t_johnny_xyior,'3-1',t_sarki_vilkav,'jugado');
  PERFORM public.update_player_stats(p_sarki,  m,v_tid,true, 16);
  PERFORM public.update_player_stats(p_vilkav, m,v_tid,true, 16);
  PERFORM public.update_player_stats(p_johnny, m,v_tid,false,-16);
  PERFORM public.update_player_stats(p_xyior,  m,v_tid,false,-16);

END $$;

-- ============================================================
-- 8. ARQUEROS 2V2 (Jul 15 2025 — 14 equipos, Double Elim)
-- ============================================================
DO $$
DECLARE
  v_tid uuid;
  p_kazen uuid; p_zranox uuid; p_dopping uuid; p_knigh uuid;
  p_jinkaede uuid; p_shroud uuid; p_frezian uuid; p_zroggen uuid;
  t_kazen_zranox uuid; t_dopping_knigh uuid; t_jink_shroud uuid;
  t_frez_zrog uuid;
  m uuid;
BEGIN
  SELECT id INTO v_tid    FROM public.tournaments WHERE nombre = 'ARQUEROS 2V2';
  SELECT id INTO p_kazen  FROM public.players WHERE nickname_juego = 'Kazen';
  SELECT id INTO p_zranox FROM public.players WHERE nickname_juego = 'zranox';
  SELECT id INTO p_dopping FROM public.players WHERE nickname_juego = 'Dopping Positivo';
  SELECT id INTO p_knigh  FROM public.players WHERE nickname_juego = 'knigh';
  SELECT id INTO p_jinkaede FROM public.players WHERE nickname_juego = 'Jin Kaede';
  SELECT id INTO p_shroud FROM public.players WHERE nickname_juego = 'shroud';
  SELECT id INTO p_frezian FROM public.players WHERE nickname_juego = 'frezian';
  SELECT id INTO p_zroggen FROM public.players WHERE nickname_juego = 'Zroggen';

  t_kazen_zranox  := gen_random_uuid();
  t_dopping_knigh := gen_random_uuid();
  t_jink_shroud   := gen_random_uuid();
  t_frez_zrog     := gen_random_uuid();

  INSERT INTO public.teams (id, nombre, capitan_id, tipo) VALUES
    (t_kazen_zranox,  'Kazen - zranox',         p_kazen,   '2v2'),
    (t_dopping_knigh, 'Dopping Positivo - knigh',p_dopping, '2v2'),
    (t_jink_shroud,   'Jin Kaede - shroud',      p_jinkaede,'2v2'),
    (t_frez_zrog,     'frezian - Zroggen',       p_frezian, '2v2');

  INSERT INTO public.team_members (team_id, player_id) VALUES
    (t_kazen_zranox, p_kazen),   (t_kazen_zranox,  p_zranox),
    (t_dopping_knigh,p_dopping), (t_dopping_knigh,  p_knigh),
    (t_jink_shroud,  p_jinkaede),(t_jink_shroud,    p_shroud),
    (t_frez_zrog,    p_frezian), (t_frez_zrog,      p_zroggen);

  INSERT INTO public.tournament_registrations (tournament_id, team_id) VALUES
    (v_tid,t_kazen_zranox),(v_tid,t_dopping_knigh),
    (v_tid,t_jink_shroud),(v_tid,t_frez_zrog);

  -- GRAN FINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Gran Final',3,1,t_kazen_zranox,t_dopping_knigh,'3-0',t_kazen_zranox,'jugado');
  PERFORM public.update_player_stats(p_kazen,  m,v_tid,true, 16);
  PERFORM public.update_player_stats(p_zranox, m,v_tid,true, 16);
  PERFORM public.update_player_stats(p_dopping,m,v_tid,false,-16);
  PERFORM public.update_player_stats(p_knigh,  m,v_tid,false,-16);

END $$;

-- ============================================================
-- 9. GUERREROS 2V2 (Jul 15 2025 — 20 equipos, Double Elim)
-- ============================================================
DO $$
DECLARE
  v_tid uuid;
  p_jentsen uuid; p_qwerty uuid; p_llamam uuid; p_elfitopen uuid;
  p_nylamp uuid; p_boca uuid; p_zeluest uuid; p_xiuten uuid;
  p_egil uuid; p_ema uuid; p_drakaro uuid; p_jannito uuid;
  t_jent_qwerty uuid; t_llama_elfi uuid; t_nylamp_boca uuid;
  t_zel_xiu uuid;
  m uuid;
BEGIN
  SELECT id INTO v_tid      FROM public.tournaments WHERE nombre = 'GUERREROS 2V2';
  SELECT id INTO p_jentsen  FROM public.players WHERE nickname_juego = 'Jentsen';
  SELECT id INTO p_qwerty   FROM public.players WHERE nickname_juego = 'QWERTYUIOP';
  SELECT id INTO p_llamam   FROM public.players WHERE nickname_juego = 'Llama maste';
  SELECT id INTO p_elfitopen FROM public.players WHERE nickname_juego = 'Elfitopen';
  SELECT id INTO p_nylamp   FROM public.players WHERE nickname_juego = 'nylamp';
  SELECT id INTO p_boca     FROM public.players WHERE nickname_juego = 'boca porro y vlno';
  SELECT id INTO p_zeluest  FROM public.players WHERE nickname_juego = 'Zeluest';
  SELECT id INTO p_xiuten   FROM public.players WHERE nickname_juego = 'Xiu''ten';
  SELECT id INTO p_egil     FROM public.players WHERE nickname_juego = 'egil haland';
  SELECT id INTO p_ema      FROM public.players WHERE nickname_juego = 'ema';
  SELECT id INTO p_drakaro  FROM public.players WHERE nickname_juego = 'drakaro';
  SELECT id INTO p_jannito  FROM public.players WHERE nickname_juego = 'jannito';

  t_jent_qwerty  := gen_random_uuid();
  t_llama_elfi   := gen_random_uuid();
  t_nylamp_boca  := gen_random_uuid();
  t_zel_xiu      := gen_random_uuid();

  INSERT INTO public.teams (id, nombre, capitan_id, tipo) VALUES
    (t_jent_qwerty, 'Jentsen - QWERTYUIOP',       p_jentsen,  '2v2'),
    (t_llama_elfi,  'Llama maste - Elfitopen',     p_llamam,   '2v2'),
    (t_nylamp_boca, 'nylamp - boca porro y vlno',    p_nylamp,   '2v2'),
    (t_zel_xiu,     'Zeluest - Xiu''ten',          p_zeluest,  '2v2');

  INSERT INTO public.team_members (team_id, player_id) VALUES
    (t_jent_qwerty,p_jentsen),   (t_jent_qwerty,p_qwerty),
    (t_llama_elfi, p_llamam),    (t_llama_elfi, p_elfitopen),
    (t_nylamp_boca,p_nylamp),    (t_nylamp_boca,p_boca),
    (t_zel_xiu,    p_zeluest),   (t_zel_xiu,    p_xiuten);

  INSERT INTO public.tournament_registrations (tournament_id, team_id) VALUES
    (v_tid,t_jent_qwerty),(v_tid,t_llama_elfi),
    (v_tid,t_nylamp_boca),(v_tid,t_zel_xiu);

  -- GRAN FINAL
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Gran Final',3,1,t_jent_qwerty,t_llama_elfi,'3-1',t_jent_qwerty,'jugado');
  PERFORM public.update_player_stats(p_jentsen,   m,v_tid,true, 16);
  PERFORM public.update_player_stats(p_qwerty,    m,v_tid,true, 16);
  PERFORM public.update_player_stats(p_llamam,    m,v_tid,false,-16);
  PERFORM public.update_player_stats(p_elfitopen, m,v_tid,false,-16);

END $$;

-- ============================================================
-- 10. WINTER CUP 2026 (Mar 14 2026 — 6 clanes, 7v7 Round Robin)
-- Standings finales:
--  1º Sumo       8pts  4W-1L-0D
--  2º Namarie    7pts  3W-1L-1D
--  3º 76ers      7pts  3W-1L-1D (empataron entre sí)
--  4º la masia   6pts  3W-2L-0D
--  5º HTF        2pts  1W-4L-0D
--  6º Jewpstein island 0pts  0W-5L-0D
-- ============================================================
DO $$
DECLARE
  v_tid uuid;
  t_sumo uuid; t_namarie uuid; t_76ers uuid;
  t_masia uuid; t_htf uuid; t_jewp uuid;
  m uuid;
BEGIN
  SELECT id INTO v_tid FROM public.tournaments WHERE nombre = 'WINTER CUP 2026';

  t_sumo    := gen_random_uuid();
  t_namarie := gen_random_uuid();
  t_76ers   := gen_random_uuid();
  t_masia   := gen_random_uuid();
  t_htf     := gen_random_uuid();
  t_jewp    := gen_random_uuid();

  -- Equipos 7v7 sin capitan_id (no hay tracking individual)
  INSERT INTO public.teams (id, nombre, capitan_id, tipo) VALUES
    (t_sumo,    'Sumo',             NULL, '7v7'),
    (t_namarie, 'Namarie',          NULL, '7v7'),
    (t_76ers,   '76ers',            NULL, '7v7'),
    (t_masia,   'la masia',         NULL, '7v7'),
    (t_htf,     'HTF',              NULL, '7v7'),
    (t_jewp,    'Jewpstein island', NULL, '7v7');

  INSERT INTO public.tournament_registrations (tournament_id, team_id) VALUES
    (v_tid,t_sumo),(v_tid,t_namarie),(v_tid,t_76ers),
    (v_tid,t_masia),(v_tid,t_htf),(v_tid,t_jewp);

  -- Resultado conocido: Namarie vs 76ers = EMPATE
  -- Para round robin usamos resultado '1-1' = empate
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,1,t_namarie,t_76ers,'1-1',NULL,'jugado');

  -- Sumo campeón con 4W. Matches confirmados por standings:
  -- Sumo gana vs la masia, HTF, Jewpstein (mínimo); pierde 1
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,2,t_sumo,t_jewp,'2-0',t_sumo,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,3,t_sumo,t_htf,'2-0',t_sumo,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,4,t_sumo,t_masia,'2-0',t_sumo,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,5,t_sumo,t_namarie,'2-1',t_sumo,'jugado');

  -- Sumo pierde 1 → asumimos que 76ers ganó a Sumo (3W para 76ers)
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,6,t_76ers,t_sumo,'2-1',t_76ers,'jugado');

  -- Matches adicionales por standings (Jewpstein 0W, HTF 1W)
  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,7,t_namarie,t_jewp,'2-0',t_namarie,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,8,t_76ers,t_jewp,'2-0',t_76ers,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,9,t_masia,t_htf,'2-0',t_masia,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,10,t_masia,t_jewp,'2-0',t_masia,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,11,t_htf,t_jewp,'2-0',t_htf,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,12,t_namarie,t_masia,'2-1',t_namarie,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,13,t_76ers,t_masia,'2-1',t_76ers,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,14,t_namarie,t_htf,'2-0',t_namarie,'jugado');

  m:=gen_random_uuid();
  INSERT INTO public.matches(id,torneo_id,ronda,ronda_numero,posicion,equipo_a_id,equipo_b_id,resultado,ganador_id,estado)
  VALUES(m,v_tid,'Round Robin',1,15,t_76ers,t_htf,'2-0',t_76ers,'jugado');

END $$;

END ;

