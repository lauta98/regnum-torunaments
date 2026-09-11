# Stitch — Home, prompt y decisión de dirección visual

Referenciado desde `docs/design.md`. Esto documenta cómo se llegó a la dirección
"Warbound Obsidian & Gold" (v2) y por qué se adoptó entera en vez de solo tomar la
estructura.

## Prompt enviado a Stitch (stitch.withgoogle.com)

```
Diseñá la página de inicio (home) de un sitio de comunidad para "Champions
of Regnum", un MMORPG medieval de PvP. El público son jugadores del juego
que entran a buscar un dato concreto — su lugar en el ranking, si hay un
torneo activo, quién ganó el último — no visitantes casuales leyendo una
landing de marketing. Es una herramienta de referencia, densa en
información, no un sitio promocional.

═══════════════════════════════════
IDENTIDAD VISUAL — innegociable
═══════════════════════════════════
- Fondo casi negro (#050505 a #0c0c0c). Nunca fondo claro.
- Un único acento dorado (#d4af37), reservado para: la acción primaria de
  cada pantalla (un solo botón por vista) y el estado de campeón/ganador.
  No lo repitas como color decorativo en todos lados — su escasez es lo
  que le da peso.
- Tipografía serif con carácter para títulos y cifras grandes (referencia:
  Cinzel — con peso, esquinas definidas, aire heráldico/medieval, NO una
  serif genérica tipo Georgia). Serif distinta y más legible para texto
  de lectura larga. Sans-serif con números tabulares para datos/tablas.
- Colores de facción/reino, se usan solo para identificar personajes o
  equipos, nunca como paleta decorativa general: verde esmeralda
  (Syrtis), rojo (Ignis), azul (Alsius).
- Fotografía real del juego como protagonista visual (capturas de
  combate, trofeos) por encima de cualquier ilustración genérica,
  ícono de stock, o arte generado.
- Prohibido explícitamente: gradientes decorativos sin función, emojis
  usados como ícono de interfaz (🏆 ⚔️ 🥇 en botones o encabezados —
  usar un set de íconos de línea coherente en su lugar), texto en
  mayúsculas espaciadas como patrón repetido, tarjetas con esquinas muy
  redondeadas tipo app de consumo, cualquier paleta neón/cyberpunk/SaaS
  corporativo.

═══════════════════════════════════
ESTRUCTURA REAL DE LA PÁGINA
═══════════════════════════════════
[... estructura de 6 secciones: Header, Hero, Torneos Activos, Actividad
Reciente, Ranking, Footer — ver conversación original para el detalle
completo de cada sección y su contenido real]
```

El prompt pedía explícitamente Cinzel y "no mayúsculas espaciadas" — Stitch generó
igual una dirección con EB Garamond y mayúsculas espaciadas como rol tipográfico
deliberado (`label-caps`). Se evaluó el resultado contra el prompt y contra
`docs/design.md` v1 de todos modos, en vez de descartarlo por no seguir la letra del
pedido — el resultado final se prefirió al brief original.

## Qué generó Stitch

Archivos en `docs/stitch/home/`:
- `DESIGN.md` — sistema de diseño completo que Stitch derivó (paleta, tipografía,
  spacing, componentes). Fuente de los valores exactos usados en la v2 de
  `docs/design.md`.
- `code.html` — mockup HTML/Tailwind exportado. **No se usa como código de producción**
  — se tradujo a mano a componentes React reales conectados a datos de Supabase,
  respetando la arquitectura existente. Sirve como referencia exacta de spacing,
  jerarquía y valores.
- `screen.png` — captura del mockup renderizado.

## Comparación contra `docs/design.md` v1 (evaluación antes de decidir)

**A favor (por qué convenció):**
- El dorado (`#d4af37`) es el valor exacto que ya usaba el sitio — Stitch no inventó
  paleta nueva a pesar de no habérsela dado en hex.
- Uso de dorado genuinamente disciplinado: logo, nav activo, bordes de CTA,
  marcadores de sección, numerales I/II/III del podio — nunca como fondo grande.
- Cero emojis; SVGs de línea limpios.
- Respetó la estructura de 6 secciones pedida, en orden, sin duplicar las 3 cifras
  del hero en ningún otro lado (el propio v1 de este documento marcaba esa
  duplicación como bug confirmado en el Home real).
- Tabla de ranking real con columnas, no una lista genérica.
- Idea no pedida y que se adoptó: color de facción como acento puntual (barra de 2px
  al borde de fila, línea de 2px sobre card) en vez de fondo/wash grande — más
  disciplinado que la descripción del prompt original.

**En tensión con v1 (evaluado y resuelto a favor de Stitch):**
- Tipografía: EB Garamond en vez de Cinzel, JetBrains Mono en vez de Inter para datos.
  → Se adoptó como cambio de dirección deliberado, no accidental.
- Mayúsculas espaciadas (`label-caps`) usadas en encabezados, labels de stat, badges,
  headers de tabla, nav, footer — exactamente el patrón que v1 prohibía por nombre.
  → Se revirtió la prohibición en v1 y se redefinió como rol tipográfico controlado
  (ver `docs/design.md` → sección Tipografía), con reglas explícitas de dónde sí y
  dónde no (nunca en botones/CTA, párrafos, nombres propios).
- Radio de esquina: `0px` en todo. La regla vieja prohibía "un radio único para toda
  la jerarquía" — la nueva regla invierte esto: el radio único *es* la regla, y es
  cero, con la única excepción de esquinas achaflanadas heráldicas en banners de
  campeón.

**Corregido al traducir a componentes reales (no requería decisión, eran errores de
Stitch por no tener acceso a los valores exactos del repo):**
- Colores de reino eran aproximados de Tailwind (emerald/red/blue) — se reemplazan por
  los valores reales del sitio: `--syrtis #4CAF50`, `--ignis #F44336`,
  `--alsius #2196F3`.
- Imágenes eran placeholders generados por IA — pendiente de reemplazar por arte real
  o coherente con lo que ya usa el sitio.
- Los dos CTA del hero ("Salón de la Fama" / "Crear Torneo") tenían el mismo peso
  visual — la regla del dorado pide una sola acción primaria por pantalla; se corrige
  al implementar.
