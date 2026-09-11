# Dirección de diseño — CoR Community

## Qué es esto
Archivo de la comunidad competitiva de Champions of Regnum: torneos, ranking PvP,
mercado de ítems y salón de la fama. El público son jugadores del juego, no visitantes
casuales. Entran a buscar un dato concreto (mi MMR, quién ganó, cuánto vale un ítem),
no a leer una landing.

## Identidad visual — "Warbound Obsidian & Gold" (v2, 2026-09-11)
La dirección visual cambió deliberadamente a partir de esta fecha — no es una limpieza
de la estética anterior, es una identidad nueva, co-diseñada con Stitch
(stitch.withgoogle.com) sobre este mismo brief y adoptada entera después de comparar
resultado contra la regla vieja. Ver `docs/stitch-prompt-home.md` para el prompt
original y el razonamiento del contraste punto por punto. Si en algún momento se
revisa esta decisión, ese archivo tiene la comparación completa — no hace falta
rehacerla de memoria.

Sigue siendo cierto lo de antes: fondo casi negro, acento dorado escaso, arte real del
juego con prioridad. Lo que cambia es el lenguaje formal — tipografía, uso deliberado de
mayúsculas espaciadas como rol tipográfico controlado (antes prohibido, ver más abajo
por qué ahora no), y geometría sin redondear. Sigue sin ser una landing de marketing:
el público entra a buscar un dato concreto, la jerarquía visual tiene que resolver eso
de un vistazo.

Tono: severo, competitivo, con peso — un ledger de guerra grabado en piedra, no una app
de consumo. Referencia: "grim, austere gravity of high-stakes realm-versus-realm
medieval warfare" (texto original de Stitch, queda como ancla del tono).

## Sistema de color — el color es dato, no decoración

Cuatro escalas, cada una con un trabajo:

- **Neutros (casi negro)**: fondo, superficies, bordes, texto. Es el 90% de la página.
  Base `#050505`, tarjetas `#0C0C0C`/`#121212`. Sin sombras difusas ni glow — la
  profundidad se comunica con bordes de 1px (`border_subtle #1F1F1F`,
  `border_structural #282828`, `border_highlight #3E3E3E` para hover/foco).
- **Dorado**: reservado, sigue siendo la regla más importante del documento. Solo para
  (a) la acción primaria de cada vista — **una sola por pantalla**, nunca dos CTA
  dorados con el mismo peso compitiendo — y (b) estado de campeón/ganador. Valor sin
  cambios: `#d4af37`. Nada más lleva dorado.
- **Reinos**: Syrtis verde, Ignis rojo, Alsius azul. Identifican pertenencia y se usan
  en TODAS las páginas donde aparece un personaje, no solo en Ranking. Valores exactos
  sin cambios: `--syrtis #4CAF50`, `--ignis #F44336`, `--alsius #2196F3` — no los
  aproximados de una paleta genérica (Tailwind emerald/red/blue u otra), son estos
  valores puntuales. Se usan como acento chico y puntual (barra de 2px al borde de una
  fila, línea de 2px sobre una card, punto de estado) — no como fondo ni wash grande.
- **Rareza**: la escala que ya existe en Comercio (común/mágico/épico/legendario).
  Es el mejor uso de color del sitio actual. Mantenerla tal cual.

Regla: si un elemento no comunica acción primaria, reino o rareza, es neutro.

Todo esto vive en un único archivo de tokens como CSS custom properties. Cero hex
hardcodeado en componentes.

### `--on-gold`
Color de texto/ícono sobre un fondo dorado (botones con gradiente
`var(--gold-dark)`→`var(--gold)`, spinners dentro de esos botones). Es el único rol que
cumple — **no se usa como fondo de superficie**. Viene de separar `--dark-bg`, un token
huérfano que estaba cumpliendo dos trabajos distintos bajo un solo nombre (mismo problema
que tuvo `#f87171` en rareza legendaria): la mitad "texto sobre dorado" se resolvió como
`--on-gold`; la mitad "fondo de superficie oscura" todavía no tiene token asignado.

### Escalas adicionales (fuera de las 4 principales)
Aparecieron al tokenizar que no encajan en Neutros/Dorado/Reino/Rareza. Documentadas acá
para que no se fundan con otra escala ni se traten como error de tipeo:

- **Formato de torneo** (1v1 / 2v2 / 3v3 / 7v7): cada formato tiene su propio color en
  `FORMAT_COLOR` (`lib/constants.ts`). Escala real, en uso.
- **Calidad del ítem** (muy buena / buena / normal / mala / muy mala): estado de
  conservación de un ítem en Comercio, distinto de rareza. Vive como `CALIDAD_COLOR` en
  `lib/market/constants.ts` y se redefine igual (con los mismos 5 valores) dentro de
  `app/market/nuevo/page.tsx`. Sin tokenizar todavía.

### Pendiente de unificar — no es una escala nueva
**Gema-elemento** (Fuego / Hielo / Electricidad / Aplastante / Punzante / Cortante) en
`app/market/nuevo/page.tsx` usa colores propios (`GEMA_ELEMENTO_COLOR`) distintos a los
de **tipo de daño** (`FISICO_COLOR` / `MAGICO_COLOR`, mismo archivo), pese a compartir
los mismos nombres de elemento. No es una escala nueva a tokenizar aparte — es un bug de
contenido: el mismo elemento (ej. Fuego) se ve de un color en el selector de gema y de
otro en el selector de tipo de daño, dentro del mismo formulario. Unificar valores en la
Fase 5 antes de tokenizar cualquiera de las dos.

## Tipografía
Dos familias, no más:
- **EB Garamond** — display (títulos, cifras hero) y texto largo (lore, bios,
  reglamento). Reemplaza a Cinzel/Crimson Pro. Misma razón que antes: un serif con
  peso, no una serif genérica de sistema.
- **JetBrains Mono** — toda cifra/dato (MMR, K/D, winrate, timestamps, ID de torneo) y
  las etiquetas en mayúsculas del rol `label-caps` (ver abajo). Reemplaza el rol que
  cumplía Inter con `tabular-nums` — un monoespaciado da alineación tabular real sin
  depender de que la fuente la soporte bien, y refuerza el tono "ledger grabado".

Jerarquía con contraste real entre niveles (ver escala completa en
`docs/stitch-prompt-home.md` → `warbound_obsidian_gold/DESIGN.md`: `display-hero` 56px
hasta `label-caps` 11px). Longitud de línea por debajo de 80 caracteres en texto largo.

### Mayúsculas espaciadas — ahora es un rol tipográfico controlado, no un anti-patrón
Antes esto estaba prohibido (ver historial de este archivo). Se revirtió esa regla
deliberadamente al adoptar la dirección de Stitch: `label-caps` (JetBrains Mono, 11px,
mayúsculas, tracking 0.12em) es un rol tipográfico real con un trabajo específico —
encabezados de sección, labels de stat, badges de estado, headers de tabla, nav. Úsalo
ahí y en ningún otro lado. Específicamente NO en: texto de botón/CTA (van en sentence
case — "Salón de la Fama", no "SALÓN DE LA FAMA"), párrafos, descripciones, nombres de
jugador/ítem/torneo. El criterio viejo ("Sentence case, tamaño chico, color secundario")
sigue aplicando a todo lo que no sea explícitamente una de esas cinco cosas.

## Prohibido
Estos patrones no van, se reintrodujeron o no en versiones anteriores del sitio:

- **Emojis como íconos de interfaz** (🏆 ⚔️ 🥇 🔥 en botones, encabezados, badges).
  Usar un set de íconos de línea coherente (trazo ~1.8px, sin relleno). El arte real
  del juego sí se usa, y con prioridad.
- **La misma información dos veces en el mismo scroll.** Antes de agregar un bloque,
  verificar que ese dato no esté ya en la vista.
- **Badges que nunca cambian de valor.** Si todas las tarjetas dicen "Finalizado",
  el badge no informa: sacarlo o mostrarlo solo cuando difiere.
- **Gradientes decorativos** sin función (fondos degradé porque sí). Sombras difusas,
  blur o glow para dar profundidad — la profundidad ahora se comunica con bordes de
  1px (ver escalas de neutros arriba), no con `box-shadow` difuso.
- **`border-radius` redondeado, en cualquier magnitud.** La geometría de esta dirección
  es angular: `0px` en todo, sin excepción salvo el detalle heráldico de abajo. Esto
  invierte la regla vieja (que prohibía un radio "único para toda la jerarquía") —
  ahora el radio único *es* la regla, y es `0`. Excepción puntual: esquinas achaflanadas
  de 4px (`clip-path`) en banners de campeón/logros, como detalle heráldico deliberado,
  no como radio de card genérico.
- **Todo centrado**, flechas "→" pegadas al texto de los links sin espaciado.
- **Animaciones de entrada por sección** al hacer scroll. El movimiento responde a una
  acción del usuario (abrir, filtrar, confirmar) o no existe.
- **Copy que habla del sistema y no del usuario.** Nada de "cargado retroactivamente"
  ni "fecha aproximada no expuesta por la API" en descripciones públicas.

## Contenido
- Las descripciones no se cortan a mitad de oración: definir un largo y truncar en
  límite de palabra, o mostrar completo.
- Las URLs externas van como link con texto, nunca crudas dentro de un párrafo.
- Un dato que se sabe erróneo (inscriptos en 0 sobre torneos ya jugados, personajes
  sin reino) se oculta o se marca como faltante. No se muestra como si fuera válido.

## Piso técnico, sin anunciarlo
Responsive hasta 360px. Foco de teclado visible. `prefers-reduced-motion` respetado.
Contraste AA en texto. Los cambios de estética no rompen el HTML semántico existente
(tablas siguen siendo `<table>`, listas `<ul>/<ol>`).
