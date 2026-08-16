-- =====================================================
-- CoR — Carga del torneo real EN VIVO "Torneo Barbaros 2v2"
-- (Challonge, empezó el 15 de agosto de 2026, organizado por
-- MCucca99: https://challonge.com/es/8wux4r5c)
--
-- Snapshot del estado real al momento de cargarlo: 22 equipos
-- inscriptos, bracket de 32 con 10 byes a las mejores siembras
-- (igual que hace Challonge), 6 partidos de ronda 1 ya jugados
-- (4 con resultado, 2 todavía sin jugar) y sus 4 avances a ronda
-- 2 ya resueltos. El resto queda pendiente para cargar en vivo
-- desde la propia web a medida que se juegan.
--
-- Nombres de equipo = el string compuesto tal cual figura en
-- Challonge (no se separa en 2 jugadores individuales: el
-- separador no es consistente en todos los casos).
--
-- Seguro de re-ejecutar: si el torneo ya existe (por nombre) no
-- carga nada de nuevo.
-- =====================================================

do $$
declare
  v_ya_existe uuid;
  v_torneo uuid;
  v_team_1 uuid;
  v_team_2 uuid;
  v_team_3 uuid;
  v_team_4 uuid;
  v_team_5 uuid;
  v_team_6 uuid;
  v_team_7 uuid;
  v_team_8 uuid;
  v_team_9 uuid;
  v_team_10 uuid;
  v_team_11 uuid;
  v_team_12 uuid;
  v_team_13 uuid;
  v_team_14 uuid;
  v_team_15 uuid;
  v_team_16 uuid;
  v_team_17 uuid;
  v_team_18 uuid;
  v_team_19 uuid;
  v_team_20 uuid;
  v_team_21 uuid;
  v_team_22 uuid;
begin

  select id into v_ya_existe from public.tournaments where nombre = 'Torneo Barbaros 2v2' limit 1;
  if v_ya_existe is not null then
    raise notice 'El torneo Barbaros 2v2 ya existe, no se carga de nuevo.';
    return;
  end if;

  insert into public.tournaments (nombre, formato, estado, fecha_inicio, descripcion)
    values ('Torneo Barbaros 2v2', '2v2', 'live', '2026-08-15', 'Torneo real en curso, jugado en Challonge y organizado por MCucca99. Se actualiza en vivo a medida que se juegan los partidos.')
    returning id into v_torneo;

  -- Equipos (nombre = string compuesto real de Challonge) + inscripciones
  insert into public.teams (nombre, tipo) values ('Pennywise / Negro Hinojo', '2v2') returning id into v_team_1;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_1, 1);
  insert into public.teams (nombre, tipo) values ('Vikkyl’Czyak / Toji Mugetsu', '2v2') returning id into v_team_2;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_2, 2);
  insert into public.teams (nombre, tipo) values ('Tu vieja con garrote / Wesnius', '2v2') returning id into v_team_3;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_3, 3);
  insert into public.teams (nombre, tipo) values ('Kai’Larsen / QWERTYUIOPASDFGHJKLÑZXCVBNM', '2v2') returning id into v_team_4;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_4, 4);
  insert into public.teams (nombre, tipo) values ('Night bloody / Xiu''ten', '2v2') returning id into v_team_5;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_5, 5);
  insert into public.teams (nombre, tipo) values ('Iyo / Nanyka', '2v2') returning id into v_team_6;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_6, 6);
  insert into public.teams (nombre, tipo) values ('JOA DEL REY / Chretien', '2v2') returning id into v_team_7;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_7, 7);
  insert into public.teams (nombre, tipo) values ('Colo-barco / Lostvayne', '2v2') returning id into v_team_8;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_8, 8);
  insert into public.teams (nombre, tipo) values ('Ketazhi / Syne', '2v2') returning id into v_team_9;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_9, 9);
  insert into public.teams (nombre, tipo) values ('Nandocape - Grimmm', '2v2') returning id into v_team_10;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_10, 10);
  insert into public.teams (nombre, tipo) values ('Lo Wi / Skirlet', '2v2') returning id into v_team_11;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_11, 11);
  insert into public.teams (nombre, tipo) values ('Aadolf / Zivzivadze', '2v2') returning id into v_team_12;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_12, 12);
  insert into public.teams (nombre, tipo) values ('Zara Man / Bubba Kush', '2v2') returning id into v_team_13;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_13, 13);
  insert into public.teams (nombre, tipo) values ('Britney Brooks / Kynji Okkot', '2v2') returning id into v_team_14;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_14, 14);
  insert into public.teams (nombre, tipo) values ('Fusht / Trepa', '2v2') returning id into v_team_15;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_15, 15);
  insert into public.teams (nombre, tipo) values ('R’agnarok / Frawens', '2v2') returning id into v_team_16;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_16, 16);
  insert into public.teams (nombre, tipo) values ('Karamoko Dembele / Losther', '2v2') returning id into v_team_17;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_17, 17);
  insert into public.teams (nombre, tipo) values ('Okyap / J’ai la fonsdale', '2v2') returning id into v_team_18;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_18, 18);
  insert into public.teams (nombre, tipo) values ('Leyton Cook / Vae Victis', '2v2') returning id into v_team_19;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_19, 19);
  insert into public.teams (nombre, tipo) values ('Morderisch / Mazi de Belgrano', '2v2') returning id into v_team_20;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_20, 20);
  insert into public.teams (nombre, tipo) values ('Goku / Gehry', '2v2') returning id into v_team_21;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_21, 21);
  insert into public.teams (nombre, tipo) values ('Zeluest / S U B-Z E R O', '2v2') returning id into v_team_22;
  insert into public.tournament_registrations (tournament_id, team_id, seed) values (v_torneo, v_team_22, 22);

  -- Ronda 1 (16 posiciones: 6 partidos reales + 10 byes ya resueltos, igual que genera la app)
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 1, v_team_1, null, 'BYE', v_team_1, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 2, v_team_16, v_team_17, 'R’agnarok / Frawens 1 - 2 Karamoko Dembele / Losther', v_team_17, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 3, v_team_8, null, 'BYE', v_team_8, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 4, v_team_9, null, 'BYE', v_team_9, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 5, v_team_4, null, 'BYE', v_team_4, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 6, v_team_13, v_team_20, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 7, v_team_5, null, 'BYE', v_team_5, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 8, v_team_12, v_team_21, 'Aadolf / Zivzivadze 0 - 2 Goku / Gehry', v_team_21, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 9, v_team_2, null, 'BYE', v_team_2, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 10, v_team_15, v_team_18, 'Fusht / Trepa 2 - 0 Okyap / J’ai la fonsdale', v_team_15, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 11, v_team_7, null, 'BYE', v_team_7, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 12, v_team_10, null, 'BYE', v_team_10, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 13, v_team_3, null, 'BYE', v_team_3, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 14, v_team_14, v_team_19, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 15, v_team_6, null, 'BYE', v_team_6, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 32', 1, 16, v_team_11, v_team_22, 'Lo Wi / Skirlet 1 - 2 Zeluest / S U B-Z E R O', v_team_22, 'jugado');

  -- Ronda 2
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 16', 2, 1, v_team_1, v_team_17, 'Pennywise / Negro Hinojo 0 - 2 Karamoko Dembele / Losther', v_team_17, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 16', 2, 2, v_team_8, v_team_9, 'Colo-barco / Lostvayne 2 - 0 Ketazhi / Syne', v_team_8, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Ronda de 16', 2, 3, v_team_4, null, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 16', 2, 4, v_team_5, v_team_21, 'Night bloody / Xiu''ten 0 - 2 Goku / Gehry', v_team_21, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, resultado, ganador_id, estado)
    values (v_torneo, 'Ronda de 16', 2, 5, v_team_2, v_team_15, 'Vikkyl’Czyak / Toji Mugetsu 2 - 0 Fusht / Trepa', v_team_2, 'jugado');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Ronda de 16', 2, 6, v_team_7, v_team_10, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Ronda de 16', 2, 7, v_team_3, null, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Ronda de 16', 2, 8, v_team_6, v_team_22, 'pendiente');

  -- Ronda 3
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Octavos de Final', 3, 1, v_team_17, v_team_8, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Octavos de Final', 3, 2, null, v_team_21, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Octavos de Final', 3, 3, v_team_2, null, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Octavos de Final', 3, 4, null, null, 'pendiente');

  -- Semifinales
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Cuartos de Final', 4, 1, null, null, 'pendiente');
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Cuartos de Final', 4, 2, null, null, 'pendiente');

  -- Final
  insert into public.matches (torneo_id, ronda, ronda_numero, posicion, equipo_a_id, equipo_b_id, estado)
    values (v_torneo, 'Final', 5, 1, null, null, 'pendiente');

end $$;
