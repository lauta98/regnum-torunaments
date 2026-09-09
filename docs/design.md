# Dirección de diseño — CoR Community

## Qué es esto
Archivo de la comunidad competitiva de Champions of Regnum: torneos, ranking PvP,
mercado de ítems y salón de la fama. El público son jugadores del juego, no visitantes
casuales. Entran a buscar un dato concreto (mi MMR, quién ganó, cuánto vale un ítem),
no a leer una landing.

## Identidad visual — no cambiar
La estética actual es correcta y se mantiene: fondo marrón muy oscuro, acento dorado,
serif para títulos, arte real del juego. No proponer paletas nuevas, fondos claros,
ni reemplazar el serif. El trabajo es de disciplina y jerarquía, no de reinvención.

## Sistema de color — el color es dato, no decoración

Cuatro escalas, cada una con un trabajo:

- **Neutros (marrones)**: fondo, superficies, bordes, texto. Es el 90% de la página.
- **Dorado**: reservado. Solo para (a) la acción primaria de cada vista — una sola por
  pantalla — y (b) estado de campeón/ganador. Nada más lleva dorado.
- **Reinos**: Syrtis verde, Ignis rojo, Alsius azul. Identifican pertenencia y se usan
  en TODAS las páginas donde aparece un personaje, no solo en Ranking.
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
Una serif para display (títulos de sección, nombres de personaje, cifras de MMR) y una
sans con `font-variant-numeric: tabular-nums` para datos y UI. Dos familias, no más.
Escala con contraste real entre niveles. Longitud de línea por debajo de 80 caracteres.

## Prohibido
Estos patrones ya están en el sitio y hay que eliminarlos. No reintroducirlos:

- **Emojis como íconos de interfaz** (🏆 ⚔️ 🥇 🔥 en botones, encabezados, badges).
  Usar un set de íconos coherente. El arte real del juego sí se usa, y con prioridad.
- **Mayúsculas espaciadas como etiqueta** (COMMUNITY, GUERREROS, PERSONAJE, ORDENAR).
  Sentence case, tamaño chico, color secundario.
- **La misma información dos veces en el mismo scroll.** Antes de agregar un bloque,
  verificar que ese dato no esté ya en la vista.
- **Badges que nunca cambian de valor.** Si todas las tarjetas dicen "Finalizado",
  el badge no informa: sacarlo o mostrarlo solo cuando difiere.
- **Gradientes decorativos**, sombras genéricas iguales en todo, `border-radius` único
  para toda la jerarquía, todo centrado, flechas "→" pegadas al texto de los links.
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
