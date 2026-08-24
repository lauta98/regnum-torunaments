-- Insignia de "organizador verificado": un sello de confianza por TORNEO
-- (no por jugador), que marca un admin. No afecta el cálculo de MMR — es
-- señal de prestigio, no un multiplicador (ver informe-elo.html, sección
-- "Organizador verificado como insignia de confianza, no como multiplicador").

alter table public.tournaments
  add column if not exists organizador_verificado boolean not null default false;

-- Grandfathering: "los organizadores actuales son los futuros verificados"
-- — todos los torneos ya cargados hasta hoy quedan verificados de entrada.
update public.tournaments set organizador_verificado = true;
