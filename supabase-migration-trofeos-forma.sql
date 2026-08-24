-- Rediseño del picker de copas: además de color + ícono, ahora se elige
-- una forma (copa / medalla / escudo) — más variedad real, no solo un
-- recolor del mismo dibujo.
alter table public.trofeos
  add column if not exists forma text not null default 'copa' check (forma in ('copa', 'medalla', 'escudo'));
