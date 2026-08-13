-- =====================================================
-- CoR — Carga del torneo real "Torneo Arqueros 1v1"
-- (Challonge, jugado el 1 de agosto de 2026, organizado por
-- MCucca99: https://challonge.com/es/9v7adnh7)
--
-- Challonge mostraba un cuadro combinado de 32 jugadores, pero
-- en la práctica eran DOS llaves independientes de 16 (una por
-- clase). Se cargan como dos torneos separados, cada uno con
-- su bracket real y completo. La "final" cruzada Kurama vs Elven
-- que mostraba Challonge era de exhibición y nunca se jugó, así
-- que NO se carga ningún partido para ella.
--
-- No se conoce el reino (Syrtis/Ignis/Alsius) real de cada
-- jugador a partir de los datos de Challonge (solo indicaba la
-- clase) — se deja NULL a propósito en vez de inventarlo.
--
-- Seguro de re-ejecutar: usa el nickname para no duplicar si ya
-- se cargó antes.
-- =====================================================

do $$
declare
  v_ya_existe uuid;
  v_p_0 uuid;
  v_p_1 uuid;
  v_p_2 uuid;
  v_p_3 uuid;
  v_p_4 uuid;
  v_p_5 uuid;
  v_p_6 uuid;
  v_p_7 uuid;
  v_p_8 uuid;
  v_p_9 uuid;
  v_p_10 uuid;
  v_p_11 uuid;
  v_p_12 uuid;
  v_p_13 uuid;
  v_p_14 uuid;
  v_p_15 uuid;
  v_p_16 uuid;
  v_p_17 uuid;
  v_p_18 uuid;
  v_p_19 uuid;
  v_p_20 uuid;
  v_p_21 uuid;
  v_p_22 uuid;
  v_p_23 uuid;
  v_p_24 uuid;
  v_p_25 uuid;
  v_p_26 uuid;
  v_p_27 uuid;
  v_p_28 uuid;
  v_p_29 uuid;
  v_p_30 uuid;
  v_p_31 uuid;
  v_t_tr uuid;
  v_t_cz uuid;
  v_team_TR_1_a uuid;
  v_team_TR_1_b uuid;
  v_team_TR_2_a uuid;
  v_team_TR_2_b uuid;
  v_team_TR_3_a uuid;
  v_team_TR_3_b uuid;
  v_team_TR_4_a uuid;
  v_team_TR_4_b uuid;
  v_team_TR_5_a uuid;
  v_team_TR_5_b uuid;
  v_team_TR_6_a uuid;
  v_team_TR_6_b uuid;
  v_team_TR_7_a uuid;
  v_team_TR_7_b uuid;
  v_team_TR_8_a uuid;
  v_team_TR_8_b uuid;
  v_team_TR_17_a uuid;
  v_team_TR_17_b uuid;
  v_team_TR_18_a uuid;
  v_team_TR_18_b uuid;
  v_team_TR_19_a uuid;
  v_team_TR_19_b uuid;
  v_team_TR_20_a uuid;
  v_team_TR_20_b uuid;
  v_team_TR_25_a uuid;
  v_team_TR_25_b uuid;
  v_team_TR_26_a uuid;
  v_team_TR_26_b uuid;
  v_team_TR_29_a uuid;
  v_team_TR_29_b uuid;
  v_team_CZ_9_a uuid;
  v_team_CZ_9_b uuid;
  v_team_CZ_10_a uuid;
  v_team_CZ_10_b uuid;
  v_team_CZ_11_a uuid;
  v_team_CZ_11_b uuid;
  v_team_CZ_12_a uuid;
  v_team_CZ_12_b uuid;
  v_team_CZ_13_a uuid;
  v_team_CZ_13_b uuid;
  v_team_CZ_14_a uuid;
  v_team_CZ_14_b uuid;
  v_team_CZ_15_a uuid;
  v_team_CZ_15_b uuid;
  v_team_CZ_16_a uuid;
  v_team_CZ_16_b uuid;
  v_team_CZ_21_a uuid;
  v_team_CZ_21_b uuid;
  v_team_CZ_22_a uuid;
  v_team_CZ_22_b uuid;
  v_team_CZ_23_a uuid;
  v_team_CZ_23_b uuid;
  v_team_CZ_24_a uuid;
  v_team_CZ_24_b uuid;
  v_team_CZ_27_a uuid;
  v_team_CZ_27_b uuid;
  v_team_CZ_28_a uuid;
  v_team_CZ_28_b uuid;
  v_team_CZ_30_a uuid;
  v_team_CZ_30_b uuid;
begin

  -- Idempotencia: si el torneo de Tiradores ya existe (por nombre),
  -- no se carga nada de nuevo (evita duplicar todo si se re-ejecuta).
  select id into v_ya_existe from public.tournaments where nombre = 'Torneo Arqueros 1v1 — Tiradores' limit 1;
  if v_ya_existe is not null then
    raise notice 'El torneo % ya existe, no se carga de nuevo.', 'Torneo Arqueros 1v1 — Tiradores';
    return;
  end if;

  -- Jugadores (uno por nombre real; reino NULL a propósito, no se conoce).
  -- nickname_juego ya no tiene constraint UNIQUE, así que se evita
  -- duplicar a mano con un WHERE NOT EXISTS.
  insert into public.players (nickname_juego, clase_principal)
    select 'Eros Ramazzoti', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Eros Ramazzoti'));
  select id into v_p_0 from public.players where lower(nickname_juego) = lower('Eros Ramazzoti') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Vrd', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Vrd'));
  select id into v_p_1 from public.players where lower(nickname_juego) = lower('Vrd') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Yunk Faaphin', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Yunk Faaphin'));
  select id into v_p_2 from public.players where lower(nickname_juego) = lower('Yunk Faaphin') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Dopping Positivo', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Dopping Positivo'));
  select id into v_p_3 from public.players where lower(nickname_juego) = lower('Dopping Positivo') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Gumayussi', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Gumayussi'));
  select id into v_p_4 from public.players where lower(nickname_juego) = lower('Gumayussi') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Rolling Papers', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Rolling Papers'));
  select id into v_p_5 from public.players where lower(nickname_juego) = lower('Rolling Papers') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Ricky', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Ricky'));
  select id into v_p_6 from public.players where lower(nickname_juego) = lower('Ricky') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Hooward Hill', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Hooward Hill'));
  select id into v_p_7 from public.players where lower(nickname_juego) = lower('Hooward Hill') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'x Cupido x', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('x Cupido x'));
  select id into v_p_8 from public.players where lower(nickname_juego) = lower('x Cupido x') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Wan Wan', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Wan Wan'));
  select id into v_p_9 from public.players where lower(nickname_juego) = lower('Wan Wan') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Fran Kush', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Fran Kush'));
  select id into v_p_10 from public.players where lower(nickname_juego) = lower('Fran Kush') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Kurama', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Kurama'));
  select id into v_p_11 from public.players where lower(nickname_juego) = lower('Kurama') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Akiro Droskz', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Akiro Droskz'));
  select id into v_p_12 from public.players where lower(nickname_juego) = lower('Akiro Droskz') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Messiand', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Messiand'));
  select id into v_p_13 from public.players where lower(nickname_juego) = lower('Messiand') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Post Malone', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Post Malone'));
  select id into v_p_14 from public.players where lower(nickname_juego) = lower('Post Malone') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Buntaro', 'Tirador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Buntaro'));
  select id into v_p_15 from public.players where lower(nickname_juego) = lower('Buntaro') limit 1;

  insert into public.players (nickname_juego, clase_principal)
    select 'Elven', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Elven'));
  select id into v_p_16 from public.players where lower(nickname_juego) = lower('Elven') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Fuxi', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Fuxi'));
  select id into v_p_17 from public.players where lower(nickname_juego) = lower('Fuxi') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'PETISO PERO', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('PETISO PERO'));
  select id into v_p_18 from public.players where lower(nickname_juego) = lower('PETISO PERO') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Renly''s', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Renly''s'));
  select id into v_p_19 from public.players where lower(nickname_juego) = lower('Renly''s') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'James''Hetfield', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('James''Hetfield'));
  select id into v_p_20 from public.players where lower(nickname_juego) = lower('James''Hetfield') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Thoor', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Thoor'));
  select id into v_p_21 from public.players where lower(nickname_juego) = lower('Thoor') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Eht Van D’aerys', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Eht Van D’aerys'));
  select id into v_p_22 from public.players where lower(nickname_juego) = lower('Eht Van D’aerys') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Chimbaracayo', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Chimbaracayo'));
  select id into v_p_23 from public.players where lower(nickname_juego) = lower('Chimbaracayo') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'BOCA PORR0 Y VIN0', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('BOCA PORR0 Y VIN0'));
  select id into v_p_24 from public.players where lower(nickname_juego) = lower('BOCA PORR0 Y VIN0') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Loneliness', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Loneliness'));
  select id into v_p_25 from public.players where lower(nickname_juego) = lower('Loneliness') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Kirk Hammet', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Kirk Hammet'));
  select id into v_p_26 from public.players where lower(nickname_juego) = lower('Kirk Hammet') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Cyril Kamer', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Cyril Kamer'));
  select id into v_p_27 from public.players where lower(nickname_juego) = lower('Cyril Kamer') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Nifvaldr', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Nifvaldr'));
  select id into v_p_28 from public.players where lower(nickname_juego) = lower('Nifvaldr') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Arturo''s', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Arturo''s'));
  select id into v_p_29 from public.players where lower(nickname_juego) = lower('Arturo''s') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Evomoralesyma', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Evomoralesyma'));
  select id into v_p_30 from public.players where lower(nickname_juego) = lower('Evomoralesyma') limit 1;
  insert into public.players (nickname_juego, clase_principal)
    select 'Radahn', 'Cazador'
    where not exists (select 1 from public.players where lower(nickname_juego) = lower('Radahn'));
  select id into v_p_31 from public.players where lower(nickname_juego) = lower('Radahn') limit 1;

  -- Torneos
  insert into public.tournaments (nombre, formato, estado, fecha_inicio, descripcion)
    values ('Torneo Arqueros 1v1 — Tiradores', '1v1', 'finalizado', '2026-08-01', 'Torneo real jugado en Challonge, organizado por MCucca99. Cargado como contenido histórico.')
    returning id into v_t_tr;
  insert into public.tournaments (nombre, formato, estado, fecha_inicio, descripcion)
    values ('Torneo Arqueros 1v1 — Cazadores', '1v1', 'finalizado', '2026-08-01', 'Torneo real jugado en Challonge, organizado por MCucca99. Cargado como contenido histórico.')
    returning id into v_t_cz;

  -- ===== Torneo Arqueros 1v1 — Tiradores =====
  -- Equipos (1 por jugador, 1v1) + inscripciones
  insert into public.teams (nombre, capitan_id, tipo) values ('Eros Ramazzoti', v_p_0, '1v1') returning id into v_team_TR_1_a;
  insert into public.team_members (team_id, player_id) values (v_team_TR_1_a, v_p_0);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_1_a, 1);
  insert into public.teams (nombre, capitan_id, tipo) values ('Vrd', v_p_1, '1v1') returning id into v_team_TR_1_b;
  insert into public.team_members (team_id, player_id) values (v_team_TR_1_b, v_p_1);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_1_b, 32);
  insert into public.teams (nombre, capitan_id, tipo) values ('Yunk Faaphin', v_p_2, '1v1') returning id into v_team_TR_2_a;
  insert into public.team_members (team_id, player_id) values (v_team_TR_2_a, v_p_2);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_2_a, 16);
  insert into public.teams (nombre, capitan_id, tipo) values ('Dopping Positivo', v_p_3, '1v1') returning id into v_team_TR_2_b;
  insert into public.team_members (team_id, player_id) values (v_team_TR_2_b, v_p_3);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_2_b, 17);
  insert into public.teams (nombre, capitan_id, tipo) values ('Gumayussi', v_p_4, '1v1') returning id into v_team_TR_3_a;
  insert into public.team_members (team_id, player_id) values (v_team_TR_3_a, v_p_4);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_3_a, 8);
  insert into public.teams (nombre, capitan_id, tipo) values ('Rolling Papers', v_p_5, '1v1') returning id into v_team_TR_3_b;
  insert into public.team_members (team_id, player_id) values (v_team_TR_3_b, v_p_5);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_3_b, 25);
  insert into public.teams (nombre, capitan_id, tipo) values ('Ricky', v_p_6, '1v1') returning id into v_team_TR_4_a;
  insert into public.team_members (team_id, player_id) values (v_team_TR_4_a, v_p_6);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_4_a, 9);
  insert into public.teams (nombre, capitan_id, tipo) values ('Hooward Hill', v_p_7, '1v1') returning id into v_team_TR_4_b;
  insert into public.team_members (team_id, player_id) values (v_team_TR_4_b, v_p_7);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_4_b, 24);
  insert into public.teams (nombre, capitan_id, tipo) values ('x Cupido x', v_p_8, '1v1') returning id into v_team_TR_5_a;
  insert into public.team_members (team_id, player_id) values (v_team_TR_5_a, v_p_8);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_5_a, 4);
  insert into public.teams (nombre, capitan_id, tipo) values ('Wan Wan', v_p_9, '1v1') returning id into v_team_TR_5_b;
  insert into public.team_members (team_id, player_id) values (v_team_TR_5_b, v_p_9);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_5_b, 29);
  insert into public.teams (nombre, capitan_id, tipo) values ('Fran Kush', v_p_10, '1v1') returning id into v_team_TR_6_a;
  insert into public.team_members (team_id, player_id) values (v_team_TR_6_a, v_p_10);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_6_a, 13);
  insert into public.teams (nombre, capitan_id, tipo) values ('Kurama', v_p_11, '1v1') returning id into v_team_TR_6_b;
  insert into public.team_members (team_id, player_id) values (v_team_TR_6_b, v_p_11);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_6_b, 20);
  insert into public.teams (nombre, capitan_id, tipo) values ('Akiro Droskz', v_p_12, '1v1') returning id into v_team_TR_7_a;
  insert into public.team_members (team_id, player_id) values (v_team_TR_7_a, v_p_12);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_7_a, 5);
  insert into public.teams (nombre, capitan_id, tipo) values ('Messiand', v_p_13, '1v1') returning id into v_team_TR_7_b;
  insert into public.team_members (team_id, player_id) values (v_team_TR_7_b, v_p_13);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_7_b, 28);
  insert into public.teams (nombre, capitan_id, tipo) values ('Post Malone', v_p_14, '1v1') returning id into v_team_TR_8_a;
  insert into public.team_members (team_id, player_id) values (v_team_TR_8_a, v_p_14);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_8_a, 12);
  insert into public.teams (nombre, capitan_id, tipo) values ('Buntaro', v_p_15, '1v1') returning id into v_team_TR_8_b;
  insert into public.team_members (team_id, player_id) values (v_team_TR_8_b, v_p_15);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_tr, v_team_TR_8_b, 21);

  -- Partidos
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Ronda de 16', 1, 1, v_team_TR_1_a, v_team_TR_1_b, 'Eros Ramazzoti 0 - 2 Vrd', v_team_TR_1_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Ronda de 16', 1, 2, v_team_TR_2_a, v_team_TR_2_b, 'Yunk Faaphin 0 - 2 Dopping Positivo', v_team_TR_2_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Ronda de 16', 1, 3, v_team_TR_3_a, v_team_TR_3_b, 'Gumayussi 2 - 0 Rolling Papers', v_team_TR_3_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Ronda de 16', 1, 4, v_team_TR_4_a, v_team_TR_4_b, 'Ricky 2 - 0 Hooward Hill', v_team_TR_4_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Ronda de 16', 1, 5, v_team_TR_5_a, v_team_TR_5_b, 'x Cupido x 0 - 2 Wan Wan', v_team_TR_5_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Ronda de 16', 1, 6, v_team_TR_6_a, v_team_TR_6_b, 'Fran Kush 0 - 2 Kurama', v_team_TR_6_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Ronda de 16', 1, 7, v_team_TR_7_a, v_team_TR_7_b, 'Akiro Droskz 1 - 2 Messiand', v_team_TR_7_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Ronda de 16', 1, 8, v_team_TR_8_a, v_team_TR_8_b, 'Post Malone 1 - 2 Buntaro', v_team_TR_8_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Octavos de Final', 2, 1, v_team_TR_1_b, v_team_TR_2_b, 'Vrd 0 - 2 Dopping Positivo', v_team_TR_2_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Octavos de Final', 2, 2, v_team_TR_3_a, v_team_TR_4_a, 'Gumayussi 2 - 0 Ricky', v_team_TR_3_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Octavos de Final', 2, 3, v_team_TR_5_b, v_team_TR_6_b, 'Wan Wan 0 - 2 Kurama', v_team_TR_6_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Octavos de Final', 2, 4, v_team_TR_7_b, v_team_TR_8_b, 'Messiand 0 - 2 Buntaro', v_team_TR_8_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Cuartos de Final', 3, 1, v_team_TR_2_b, v_team_TR_3_a, 'Dopping Positivo 2 - 0 Gumayussi', v_team_TR_2_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Cuartos de Final', 3, 2, v_team_TR_6_b, v_team_TR_8_b, 'Kurama 2 - 0 Buntaro', v_team_TR_6_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_tr, 'Final', 4, 1, v_team_TR_2_b, v_team_TR_6_b, 'Dopping Positivo 0 - 3 Kurama', v_team_TR_6_b, 'jugado');

  -- ===== Torneo Arqueros 1v1 — Cazadores =====
  -- Equipos (1 por jugador, 1v1) + inscripciones
  insert into public.teams (nombre, capitan_id, tipo) values ('Elven', v_p_16, '1v1') returning id into v_team_CZ_9_a;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_9_a, v_p_16);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_9_a, 2);
  insert into public.teams (nombre, capitan_id, tipo) values ('Fuxi', v_p_17, '1v1') returning id into v_team_CZ_9_b;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_9_b, v_p_17);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_9_b, 31);
  insert into public.teams (nombre, capitan_id, tipo) values ('PETISO PERO', v_p_18, '1v1') returning id into v_team_CZ_10_a;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_10_a, v_p_18);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_10_a, 15);
  insert into public.teams (nombre, capitan_id, tipo) values ('Renly''s', v_p_19, '1v1') returning id into v_team_CZ_10_b;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_10_b, v_p_19);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_10_b, 18);
  insert into public.teams (nombre, capitan_id, tipo) values ('James''Hetfield', v_p_20, '1v1') returning id into v_team_CZ_11_a;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_11_a, v_p_20);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_11_a, 7);
  insert into public.teams (nombre, capitan_id, tipo) values ('Thoor', v_p_21, '1v1') returning id into v_team_CZ_11_b;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_11_b, v_p_21);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_11_b, 26);
  insert into public.teams (nombre, capitan_id, tipo) values ('Eht Van D’aerys', v_p_22, '1v1') returning id into v_team_CZ_12_a;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_12_a, v_p_22);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_12_a, 10);
  insert into public.teams (nombre, capitan_id, tipo) values ('Chimbaracayo', v_p_23, '1v1') returning id into v_team_CZ_12_b;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_12_b, v_p_23);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_12_b, 23);
  insert into public.teams (nombre, capitan_id, tipo) values ('BOCA PORR0 Y VIN0', v_p_24, '1v1') returning id into v_team_CZ_13_a;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_13_a, v_p_24);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_13_a, 3);
  insert into public.teams (nombre, capitan_id, tipo) values ('Loneliness', v_p_25, '1v1') returning id into v_team_CZ_13_b;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_13_b, v_p_25);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_13_b, 30);
  insert into public.teams (nombre, capitan_id, tipo) values ('Kirk Hammet', v_p_26, '1v1') returning id into v_team_CZ_14_a;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_14_a, v_p_26);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_14_a, 14);
  insert into public.teams (nombre, capitan_id, tipo) values ('Cyril Kamer', v_p_27, '1v1') returning id into v_team_CZ_14_b;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_14_b, v_p_27);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_14_b, 19);
  insert into public.teams (nombre, capitan_id, tipo) values ('Nifvaldr', v_p_28, '1v1') returning id into v_team_CZ_15_a;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_15_a, v_p_28);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_15_a, 6);
  insert into public.teams (nombre, capitan_id, tipo) values ('Arturo''s', v_p_29, '1v1') returning id into v_team_CZ_15_b;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_15_b, v_p_29);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_15_b, 27);
  insert into public.teams (nombre, capitan_id, tipo) values ('Evomoralesyma', v_p_30, '1v1') returning id into v_team_CZ_16_a;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_16_a, v_p_30);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_16_a, 11);
  insert into public.teams (nombre, capitan_id, tipo) values ('Radahn', v_p_31, '1v1') returning id into v_team_CZ_16_b;
  insert into public.team_members (team_id, player_id) values (v_team_CZ_16_b, v_p_31);
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_t_cz, v_team_CZ_16_b, 22);

  -- Partidos
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Ronda de 16', 1, 1, v_team_CZ_9_a, v_team_CZ_9_b, 'Elven 2 - 0 Fuxi', v_team_CZ_9_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Ronda de 16', 1, 2, v_team_CZ_10_a, v_team_CZ_10_b, 'PETISO PERO 2 - 0 Renly''s', v_team_CZ_10_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Ronda de 16', 1, 3, v_team_CZ_11_a, v_team_CZ_11_b, 'James''Hetfield 2 - 0 Thoor', v_team_CZ_11_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Ronda de 16', 1, 4, v_team_CZ_12_a, v_team_CZ_12_b, 'Eht Van D’aerys 0 - 2 Chimbaracayo', v_team_CZ_12_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Ronda de 16', 1, 5, v_team_CZ_13_a, v_team_CZ_13_b, 'BOCA PORR0 Y VIN0 0 - 2 Loneliness', v_team_CZ_13_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Ronda de 16', 1, 6, v_team_CZ_14_a, v_team_CZ_14_b, 'Kirk Hammet 0 - 2 Cyril Kamer', v_team_CZ_14_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Ronda de 16', 1, 7, v_team_CZ_15_a, v_team_CZ_15_b, 'Nifvaldr 2 - 0 Arturo''s', v_team_CZ_15_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Ronda de 16', 1, 8, v_team_CZ_16_a, v_team_CZ_16_b, 'Evomoralesyma 1 - 2 Radahn', v_team_CZ_16_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Octavos de Final', 2, 1, v_team_CZ_9_a, v_team_CZ_10_a, 'Elven 2 - 1 PETISO PERO', v_team_CZ_9_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Octavos de Final', 2, 2, v_team_CZ_11_a, v_team_CZ_12_b, 'James''Hetfield 0 - 2 Chimbaracayo', v_team_CZ_12_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Octavos de Final', 2, 3, v_team_CZ_13_b, v_team_CZ_14_b, 'Loneliness 1 - 2 Cyril Kamer', v_team_CZ_14_b, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Octavos de Final', 2, 4, v_team_CZ_15_a, v_team_CZ_16_b, 'Nifvaldr 2 - 0 Radahn', v_team_CZ_15_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Cuartos de Final', 3, 1, v_team_CZ_9_a, v_team_CZ_12_b, 'Elven 2 - 1 Chimbaracayo', v_team_CZ_9_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Cuartos de Final', 3, 2, v_team_CZ_14_b, v_team_CZ_15_a, 'Cyril Kamer 0 - 2 Nifvaldr', v_team_CZ_15_a, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_t_cz, 'Final', 4, 1, v_team_CZ_9_a, v_team_CZ_15_a, 'Elven 3 - 1 Nifvaldr', v_team_CZ_9_a, 'jugado');

end $$;
