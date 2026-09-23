---
name: estilo-cor
description: Identidad visual del sitio de torneos, ranking PvP, mercado, multimedia y salón de la fama de la comunidad de Champions of Regnum. Usar SIEMPRE que se cree o modifique cualquier pantalla, componente, estilo o animación de este sitio.
---

# Estilo del sitio de torneos de CoR

La referencia visual es la de un MMORPG de fantasía medieval, no la de una web SaaS.
El sitio tiene que sentirse parte del mundo del juego.

## Identidad
- Paleta (fuente única de verdad: `app/globals.css` `:root`, cero hex hardcodeado en componentes):
  - Fondo: base `#050505` (`--bg-base`), superficie `#0c0c0c` (`--bg-surface`), card `#121212` (`--bg-card`), hover `#1a1a1a`.
  - Borde: `#2a2a2a` (`--border`); variante dorada `rgba(212,175,55,.25)` normal / `.55` fuerte (`--border-gold` / `--border-gold-strong`).
  - Dorado — **reservado**, un solo trabajo: la acción primaria de cada vista (una sola por pantalla) y estado de campeón/ganador. Nunca decorativo. `#d4af37` (`--gold`), `#f0d060` claro, `#8b6914` oscuro.
  - Texto: `#e8e8e8` primario, `#909090` secundario, `#505050` muted.
  - Reinos — **exclusivos para identificar reino**, nunca se reusan para otra cosa (ni siquiera "1er puesto" o "estado en vivo"): Syrtis `#4CAF50`, Ignis `#F44336`, Alsius `#2196F3`. Se usan como acento chico y puntual (barra de 2px, línea sobre una card), no como fondo grande.
  - Semánticos aparte de dorado/reino: éxito `#5BC98B`, error `#E24B4A`, info `#7DC4FF`.
  - Rareza de Comercio (común/mágico/épico/legendario) es una escala propia ya tokenizada en `lib/market/constants.ts` — no tocar, es "el mejor uso de color del sitio" según `docs/design.md`.
- Tipografías (dos familias, no más — ver `docs/design.md` → Tipografía):
  - **EB Garamond** — display: títulos, cifras hero, texto largo (lore, bios, reglamento).
  - **JetBrains Mono** — toda cifra/dato (MMR, winrate, timestamps, IDs) y el rol `label-caps` (mayúsculas con tracking, solo para: encabezados de sección, labels de stat, badges de estado, headers de tabla, nav — nunca en botones/párrafos/nombres propios).
  - Nota de estado real: Cinzel/Crimson Pro todavía están importados en `globals.css` y son el `font-family` default de `body` porque no toda página migró a EB Garamond/JetBrains Mono todavía. No usarlas en código nuevo — son legado en retirada, no parte del sistema vigente.
- Texturas y marcos: sin sombras difusas ni glow — la profundidad se comunica con bordes de 1px, nunca `box-shadow` difuso. `border-radius: 0` en todo sin excepción, salvo el chaflán heráldico (`clip-path` angular, ~14–16px, ya usado en el banner de cada torneo en Salón de la Fama) — nunca esquinas redondeadas genéricas. El `body` tiene un grano de piedra sutil (SVG `feTurbulence`, opacity 0.035) más tres halos radiales tenues (5%/5%/3% opacidad) con los colores de cada reino — textura ambiental, no decorativa por sí sola.
- Íconos: SVG de línea propios (trazo ~1.8px, sin relleno), ya viven en `components/*Icons.tsx` (`RankingIcons`, `LineIcons`, `AdminIcons`, íconos locales por archivo). Nunca emojis como ícono de interfaz — es una regla explícita y repetida en `docs/design.md`.

## Por sección
- Ranking: tabla legible primero, números en JetBrains Mono (tabular real). Posiciones 1–3 en un podio aparte arriba de la tabla: 1er puesto centrado y más grande, borde dorado de 2px (el otro uso válido de dorado: estado de campeón/ganador); 2do/3ro con acento plata/bronce (`--medal-silver`/`--medal-bronze`). Los 3 comparten el mismo ícono (laurel) y solo cambia color/tamaño — nada de corona ni texto tipo "Campeón": el MMR es un rating que se recalcula con cada partida, no un torneo con ganador, así que el label es neutro ("Primer/Segundo/Tercer Puesto"). Fondo del footer de cada card con gradiente sutil por medalla (`--gold-glow-bg`/`--medal-silver-bg`/`--medal-bronze-bg`).
- Mercado: estilo inventario de juego (grilla de ítems, rareza por color de borde). Filtros claros.
- Torneos: card con barra superior de 3px en el color de arquetipo/formato (`FORMAT_COLOR`), badge de estado en la esquina (punto pulsante solo si está "en vivo" — nunca un badge que siempre dice lo mismo), título en EB Garamond, grid de meta (fecha / cupos / premio) sobre un bloque de superficie con labels JetBrains Mono en mayúsculas + valor debajo, footer con avatar/nombre del organizador.
- Salón de la fama: no son cards de jugador — son cards de **torneo**, con una portada tipo banner (foto real del torneo o, si no hay, un fondo dorado tenue con un trofeo gigante como marca de agua) con la esquina achaflanada (el detalle heráldico de arriba) y degradé para legibilidad del título. Debajo, los campeones de ese torneo como chips en fila: avatar cuadrado + borde superior de 2px del color de su reino.

## Animación
- Nada de animaciones de entrada por sección al hacer scroll — regla de `docs/design.md`,
  se mantiene tal cual. El movimiento responde a una acción del usuario (abrir, filtrar,
  confirmar) o no existe. No hay GSAP instalado y no se instala para esto: lo que hay
  hoy alcanza (transform en hover de card, fade/zoom de modales, pulse en el punto de
  "en vivo") — son reacciones a estado/interacción, no entradas de scroll.

## Referencias
- Game UI Database (gameuidatabase.com): pantallas de inventario, clasificación y logros de juegos de fantasía.
- Pendiente: capturas propias en `referencias/` — todavía no hay ninguna, se suman más
  adelante. No crear la carpeta hasta entonces.

## Evitar
Lo que hace que el sitio se sienta hecho por IA / genérico, en orden de lo que más rompe la ilusión:
- **Íconos genéricos** de librería (Lucide/Heroicons sin editar) o emojis, en vez de algo
  que remita al mundo del juego. Un ícono de línea vale si tiene una forma pensada para
  esto (arma, escudo, laurel, gema), no si es el mismo check/star que usa cualquier SaaS.
- **Texto de relleno o títulos grandilocuentes que no dicen nada** — copy que suena a
  landing de marketing en vez de a un dato que el jugador vino a buscar.
- **La estructura de siempre**: título centrado + subtítulo + grilla de tres tarjetas
  idénticas. Si una sección cae en ese patrón por default, replantear el layout antes
  de darla por terminada — no es un layout prohibido puntual, es la señal de que no se
  pensó la sección desde su contenido real.
