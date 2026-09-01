-- Foto de perfil subida por el usuario. Se muestra apenas se sube, sin
-- aprobación previa — la única moderación es que otro usuario la reporte
-- como inapropiada y un admin la revise desde el panel.

alter table players
  add column if not exists avatar_url text,
  add column if not exists avatar_reportado boolean not null default false,
  add column if not exists avatar_reporte_motivo text;
