-- ═══════════════════════════════════════════════════
-- CoR TOURNAMENT STATS — Seed Data (Development)
-- Ejecutar DESPUÉS de schema.sql
-- ═══════════════════════════════════════════════════

-- Jugadores de ejemplo (user_id NULL para seed sin auth real)
insert into public.players (id, user_id, nickname_juego, reino, clase_principal, mmr_global, winrate, partidas_jugadas, partidas_ganadas, role, discord_username) values
  ('00000001-0000-0000-0000-000000000001', null, 'LEGORDUS',    'Syrtis', 'Tirador',    2458, 78, 212, 165, 'player',    'legordus#1234'),
  ('00000001-0000-0000-0000-000000000002', null, 'SOB ZER',     'Syrtis', 'Cazador',    2312, 74, 189, 140, 'organizer', 'sobzer#5678'),
  ('00000001-0000-0000-0000-000000000003', null, 'BODYGUARD',   'Ignis',  'Bárbaro',    2156, 71, 301, 214, 'player',    'bodyguard#9012'),
  ('00000001-0000-0000-0000-000000000004', null, 'RATOMICA',    'Syrtis', 'Cazador',    2012, 68, 145, 99,  'player',    'ratomica#3456'),
  ('00000001-0000-0000-0000-000000000005', null, 'ALTHAENZITO', 'Ignis',  'Bárbaro',    1945, 66, 178, 117, 'player',    'althaenzito#7890'),
  ('00000001-0000-0000-0000-000000000006', null, 'ZIRTHAX',     'Alsius', 'Conjurador', 1880, 63, 210, 132, 'organizer', 'zirthax#1111'),
  ('00000001-0000-0000-0000-000000000007', null, 'NIRVANNA',    'Ignis',  'Brujo',      1812, 61, 167, 102, 'player',    'nirvanna#2222'),
  ('00000001-0000-0000-0000-000000000008', null, 'COLDSTEELE',  'Alsius', 'Caballero',  1755, 59, 290, 171, 'player',    'coldsteele#3333'),
  ('00000001-0000-0000-0000-000000000009', null, 'VEXORIA',     'Ignis',  'Brujo',      1698, 57, 134, 76,  'player',    'vexoria#4444'),
  ('00000001-0000-0000-0000-000000000010', null, 'FROSTSTRIKE', 'Alsius', 'Tirador',    1645, 55, 98,  54,  'player',    'froststrike#5555')
on conflict (nickname_juego) do nothing;

-- Torneos de ejemplo
insert into public.tournaments (id, creator_id, nombre, descripcion, formato, estado, fecha_inicio, max_equipos, premio, destacado) values
  ('10000000-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000002',
   'TORNEO 1VS1 BRUJO', 'El torneo definitivo para los maestros de las artes oscuras. Solo el más hábil dominará.',
   '1v1', 'live', '2026-05-24', 16, 'Título "Maestro Oscuro" + 5000 Gold', true),

  ('10000000-0000-0000-0000-000000000002',
   '00000001-0000-0000-0000-000000000006',
   '2VS2 ARENA CUP', 'Dúos de guerreros compiten por la supremacía en la arena.',
   '2v2', 'inscripciones', '2026-05-31', 8, '3000 Gold por equipo', false),

  ('10000000-0000-0000-0000-000000000003',
   '00000001-0000-0000-0000-000000000002',
   '3VS3 DOMINION', 'Tres reinos se enfrentan en un conflicto épico de 3vs3.',
   '3v3', 'inscripciones', '2026-06-14', 8, '2000 Gold por miembro', false),

  ('10000000-0000-0000-0000-000000000004',
   '00000001-0000-0000-0000-000000000006',
   'GUILD WARS BATTLE CUP', 'La mayor batalla entre gremios. 7 vs 7 por el honor.',
   '7v7', 'draft', '2026-07-01', 4, 'Trofeo permanente en Discord', false),

  ('10000000-0000-0000-0000-000000000005',
   '00000001-0000-0000-0000-000000000002',
   'TORNEO NAVIDAD 2025', 'El gran torneo anual. Todas las clases, formato libre.',
   '1v1', 'finalizado', '2025-12-20', 32, 'Corona de Campeón', true)
on conflict do nothing;

-- Equipos para el torneo 1v1 (cada jugador es su propio equipo en 1v1)
insert into public.teams (id, nombre, capitan_id, tipo) values
  ('20000000-0000-0000-0000-000000000001', 'LEGORDUS',    '00000001-0000-0000-0000-000000000001', '1v1'),
  ('20000000-0000-0000-0000-000000000002', 'SOB ZER',     '00000001-0000-0000-0000-000000000002', '1v1'),
  ('20000000-0000-0000-0000-000000000003', 'BODYGUARD',   '00000001-0000-0000-0000-000000000003', '1v1'),
  ('20000000-0000-0000-0000-000000000004', 'RATOMICA',    '00000001-0000-0000-0000-000000000004', '1v1'),
  ('20000000-0000-0000-0000-000000000005', 'ALTHAENZITO', '00000001-0000-0000-0000-000000000005', '1v1'),
  ('20000000-0000-0000-0000-000000000006', 'ZIRTHAX',     '00000001-0000-0000-0000-000000000006', '1v1'),
  ('20000000-0000-0000-0000-000000000007', 'NIRVANNA',    '00000001-0000-0000-0000-000000000007', '1v1'),
  ('20000000-0000-0000-0000-000000000008', 'COLDSTEELE',  '00000001-0000-0000-0000-000000000008', '1v1')
on conflict do nothing;

-- Inscripciones al torneo 1v1 (torneo 00001)
insert into public.tournament_registrations (tournament_id, team_id, seed) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 2),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 3),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 4),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 5),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 6),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 7),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 8)
on conflict do nothing;

-- Matches del torneo 1v1 (cuartos finales jugados, semis en curso)
insert into public.matches (id, torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado) values
  -- Cuartos de Final
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Cuartos de Final', 1, 1,
   '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', '3-1',
   '20000000-0000-0000-0000-000000000001', 'jugado'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Cuartos de Final', 1, 2,
   '20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', '3-2',
   '20000000-0000-0000-0000-000000000004', 'jugado'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Cuartos de Final', 1, 3,
   '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', '3-0',
   '20000000-0000-0000-0000-000000000003', 'jugado'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Cuartos de Final', 1, 4,
   '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', '3-1',
   '20000000-0000-0000-0000-000000000002', 'jugado'),
  -- Semifinales
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Semifinal', 2, 1,
   '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', null, null, 'pendiente'),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Semifinal', 2, 2,
   '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', null, null, 'pendiente'),
  -- Final
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Final', 3, 1,
   null, null, null, null, 'pendiente')
on conflict do nothing;
