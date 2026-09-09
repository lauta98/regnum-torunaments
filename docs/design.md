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
