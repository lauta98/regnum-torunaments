# Auditoría — Fase 0

Relevamiento sobre 5 áreas: Home (`app/page.tsx`), Torneos (`app/torneos/`), Comercio
(`app/market/page.tsx` + `components/market/*` que arman la grilla), Jugadores/Ranking
(`app/jugadores/page.tsx`, `app/jugadores/RankingContent.tsx`) y Salón de la Fama
(`app/salon-de-la-fama/`). Además se incluye `components/Header.tsx` donde aparece algo
relevante, porque se renderiza en las cinco.

Solo inventario — sin recomendaciones ni cambios de código.

---

## 1. Colores hardcodeados

Agrupados por valor. No incluye los que ya vienen de `var(--...)`.

### Reino (consistentes en todo el sitio, mismo significado en cada lugar)
- `#4CAF50` (Syrtis, verde) — `app/jugadores/RankingContent.tsx:33,439`
- `#F44336` (Ignis, rojo) — `app/torneos/TorneosContent.tsx:23`, `app/jugadores/RankingContent.tsx:33`
- `#2196F3` (Alsius, azul) — `app/torneos/TorneosContent.tsx:23`, `app/jugadores/RankingContent.tsx:242`

### Rareza / Comercio (escala propia, no comparte tokens con el resto del sitio)
- `#9CA3AF` normal, `#FB923C`/`#FBBF24`/`#fbbf24` especial, `#22C55E`/`#4ade80` mágico,
  `#8B5CF6`/`#8B5CF2`/`#a78bfa` épico, `#EF4444`/`#f87171` legendario — repetidos en
  `components/market/FilterBar.tsx:90-94`, `components/market/ListingCard.tsx:52-70`
- Colores de tipo Vende/Busca: `#1a5c2e`/`#6EE89A`/`#2d9b4e` (vende) y `#0f3460`/`#7DC4FF`/
  `#1e6db5` (busca) — duplicados en `ListingCard.tsx:122-124` y `FilterBar.tsx:99-106`
  (con valores parecidos pero no idénticos: `#5BC98B`/`#5B9BDF` en un lugar, `#6EE89A`/
  `#7DC4FF` en otro)

### Medallas / podio (Salón de la Fama y Ranking, cada uno con su propia paleta)
- Oro `#d4af37`, plata `#c0c0c0`, bronce `#cd7f32` — `RankingContent.tsx:43-45`
- Gradientes de fondo por puesto: `#120f00`→`#1c1700` (oro), `#0d0d0d`→`#141414` (plata),
  `#0e0a00`→`#141008` (bronce) — mismos valores de oro que usa también `app/page.tsx:202`
  para las cards de "Actividad reciente" (repetido, no tokenizado)

### Fondo oscuro cálido de Comercio (paleta propia, distinta a `--bg-card`/`--bg-surface`
del resto del sitio — ya señalado como decisión de diseño en un comentario del código)
- `#211B14`, `#1A1510` — `ListingCard.tsx:6`
- `#1a1410`, `#0f0d0a`, `#14100c` — `ListingCard.tsx:187,197`
- `#0d0a07` (repetido 6 veces) — `FilterBar.tsx:257,276,297,317,465-468,495`

### Sueltos, un solo uso
- `#909090` — `RankingContent.tsx:33`
- `#E8D9B8` (nombre rareza normal) — `ListingCard.tsx:46`
- `#c4b5fd`/`#fb7185` (set/favorito) — `ListingCard.tsx:462,481,597`
- `#7A8A9A`/`#B8A157` (categorías "grises": joyería/crafting/minerales) — `ListingCard.tsx:330`,
  `FeaturedCarousel.tsx:30`
- `#F59E0B` — `FeaturedCarousel.tsx:17,79`
- `#E24B4A` — `FilterBar.tsx:479`
- `#5b8fd4` — `app/salon-de-la-fama/page.tsx:142,178`
- `#1a0a0a`/`#f87171` (estado de error) — `app/salon-de-la-fama/SubirFoto.tsx:70,82`
- `#241c08`/`#120e04`/`#0a0a0a` — `app/salon-de-la-fama/page.tsx:84`
- `#1a5c35`/`#2E7D52` (botón "Publicar venta", verde) — `HeroSection.tsx:18`, `FeaturedCarousel.tsx:18`
  (mismo par, dos archivos)
- `#fff`/`#e8e0d0` sueltos en varios lugares

**Patrón general:** Home, Torneos, Jugadores y Salón de la Fama usan mayormente
`var(--gold)`/`var(--text-muted)`/etc. + los 3 colores de reino sueltos. Comercio es la
zona con más hex hardcodeado y con su propia paleta de fondo, declarada aparte del resto
del sitio.

---

## 2. Emojis

### Íconos de interfaz (candidatos a reemplazar)
- **Header** (en las 5 páginas): ninguno — el logo usa texto, no emoji.
- **Home** (`app/page.tsx`): ninguno encontrado.
- **Torneos** (`TorneosContent.tsx:114`): ⚔️ como imagen central del estado vacío
  ("no hay torneos").
- **Jugadores/Ranking** (`RankingContent.tsx`): 🥇🥈🥉 como ícono de puesto en el podio
  (líneas 43-45, 227), 🔥 en el tab "Rachas" (118) y junto al valor de racha (439),
  🎭 en el toggle "Solo multiclase" (295) y junto a la cuenta (328), ✓ como check de
  verificado (176, 242).
- **Salón de la Fama** (`page.tsx`/`SubirFoto.tsx`): 🏆 como imagen principal de cada
  card de campeón (49, 93), 🏅 como fallback de clase (166), 📷 en el botón de subir
  foto (`SubirFoto.tsx:67,80`), set de emoji por clase — ⚔️🛡️✨🔮🏹🐺 para Bárbaro/
  Caballero/Conjurador/Brujo/Tirador/Cazador (`page.tsx:15`).
- **Comercio** — es la zona con más uso:
  - `HeroSection.tsx`: 🗡 en el botón "Publicar un artículo" (23), 🔒👤🗑 en la fila de
    garantías (30-33, falta el cuarto ítem "Gratis para usar" que usa 🆓 en otro lugar
    del archivo).
  - `FilterBar.tsx`: ✦⚔🛡🏹💎💍🔨⛏ como ícono de cada categoría (8-15), 💵 para moneda
    real (331), 🔍 en el placeholder de búsqueda (385), ✕ para limpiar filtros (485).
  - `ListingCard.tsx`: ⚔🔮🏹 por clase requerida (31), 📦 como fallback de ítem sin
    ícono y como badge de "SET" (93, 463), ♥/♡ para favorito (487), 👤 fallback de
    clase (581, 676), ⚔🛡 junto a daño/armadura (687, 693).

### Emoji que es contenido (no tocar)
- Descripciones y nombres de ítem escritos por los usuarios en Comercio pueden traer
  emoji propio — no relevado acá porque es dato, no vino del código.

---

## 3. Texto en mayúsculas

### Por CSS (`textTransform`/`text-transform`)
- `components/Header.tsx:147` — "COMMUNITY" bajo el logo, visible en las 5 páginas.
- También aparece en `app/market/nuevo/page.tsx`, `components/CompartirContenido.tsx`,
  `app/brackets/page.tsx`, `app/brackets/[id]/page.tsx`, `app/market/mis-listings/[id]/editar/page.tsx`
  (fuera del alcance de las 5 páginas, pero mismo patrón repetido en el sitio).

### Escrito directamente en mayúsculas en el JSX
- `app/page.tsx:143,149,155` — "GUERREROS" / "TORNEOS" / "COMBATES", las tres etiquetas
  del bloque de stats del hero.
- `RankingContent.tsx:375` — "MMR MÁS ALTO".

No se encontraron literales en mayúsculas en Torneos, Salón de la Fama, ni en los
componentes de Comercio relevados (`FilterBar`, `ListingCard`, `HeroSection`) — en esos
casos, si hay mayúsculas, probablemente vengan de `text-transform` en otro archivo
compartido no incluido en este barrido.

---

## 4. Mismo dato mostrado dos veces en el mismo scroll

- **Home, confirmado**: el hero (`app/page.tsx:138-157`, "Quick stats") muestra
  jugadores/torneos/combates totales — y más abajo, `<StatsBar totalTorneos
  totalJugadores .../>` (línea 176) muestra los mismos tres números de nuevo, a menos
  de 20 líneas de scroll de distancia.
- No se identificaron otros pares claros de duplicación exacta en Torneos, Comercio,
  Jugadores o Salón de la Fama en este barrido — pero no se descarta que existan en
  vistas con más estado (ej. filtros aplicados) no cubiertas acá.

---

## 5. Componentes duplicados (mismo tipo de bloque, implementación distinta)

- **Card de torneo — NO está duplicado.** `components/TorneoCard.tsx` es un componente
  compartido real, usado igual en `app/page.tsx`, `app/torneos/TorneosContent.tsx` y
  `app/brackets/page.tsx`. Vale la pena señalarlo porque es la excepción, no la regla.

- **Card de publicación de Comercio — duplicada 4 veces**, cada una con su propio JSX
  en vez de un componente común:
  - `components/market/ListingCard.tsx` (la "oficial", con tooltip, carrusel, todo el
    detalle)
  - `components/market/SimilaresGrid.tsx` (card chica propia, "ítems similares")
  - `components/market/FeaturedCarousel.tsx` (card propia, carrusel destacado del home
    de Comercio)
  - `components/market/ItemDrawer.tsx` (card propia, panel lateral)

  Las 4 repiten la misma lógica (imagen o ícono de respaldo, badge Vende/Busca, precio,
  color por rareza) con valores hex ligeramente distintos entre sí (ver sección 1).

- **Avatar circular con inicial — duplicado al menos 5 veces dentro de un solo archivo**
  (`app/jugadores/RankingContent.tsx`): avatar del podio (línea 170), badge de medalla
  en la fila top-3 (226), avatar de la fila de "Jugadores/Cuentas" con foto real +
  fallback de inicial (322-325), avatar de la fila de "Rachas" (430) — cada uno con su
  propio tamaño/borde/color hardcodeado, ninguno reutiliza un componente `Avatar`.

- **Badge de rareza/tipo (Vende, Busca, Épico, etc.)** — se arma inline con el mismo
  patrón (`padding`, `borderRadius`, `background` + `border` del mismo color con alfa)
  repetido en `ListingCard.tsx`, `FilterBar.tsx` y `RankingContent.tsx` (badge de tier),
  sin un componente `Badge` compartido en ninguna de las tres.

---

## Nota

Esto es un inventario, no una lista de bugs — algunos de estos patrones (ej. la paleta
propia de Comercio, los emoji de clase) fueron decisiones deliberadas de sesiones
anteriores, no necesariamente errores. La Fase 1 (tokens) y las fases de layout deciden
qué hacer con cada uno.

---

## 6. Ampliación — colores en todo el repo

Barrido completo sobre `app/` y `components/` (no solo las 5 páginas): **417 valores
hex en 84 archivos**, 108 valores distintos. Necesario antes de tokenizar porque los
tokens van a cubrir el repo entero aunque el rediseño visual sea solo de las 5 páginas.

### Confirma lo ya visto en la sección 1
- **Reino**: `#4CAF50` (35×), `#F44336` (35×), `#2196F3` (8×) — consistentes en todo el
  repo, no solo en Ranking/Torneos.
- **Rareza**: `#9CA3AF` normal, `#FB923C`/`#F59E0B` especial (30× combinado), `#22C55E`/
  `#4ade80` mágico, `#8B5CF6` épico, `#EF4444` legendario — se repiten en `market/nuevo`,
  `market/watchlist`, `market/destacar`, `FilterBar`, `ListingCard`, no solo en la grilla.
- **Oro**: `#d4af37` (10× fuera de `var(--gold)`) — pero Comercio tiene su propio dorado,
  ver más abajo.

### Colapsos confirmados (mismo rol, valor casi idéntico)
- **`#8B5CF6` (5 archivos: `market/destacar`, `market/nuevo`, `market/watchlist`,
  `FilterBar`) vs `#8B5CF2` (solo `ListingCard.tsx:64`)** — mismo rol (épico), un solo
  archivo con el valor distinto. Colapsa a `#8B5CF6`.
- **`#5BC98B` (47×, en todo el repo: activo/verde genérico) vs `#6EE89A` (4×, solo el
  texto del badge "Vende" en `ListingCard.tsx`/`FilterBar.tsx`)** — con esto colapsado,
  el texto de "Vende" cambia de tono levemente (más oscuro). Aviso, no bloqueo.
- **Rojos — 4 valores para roles parcialmente distintos, no un colapso limpio:**
  `#F44336` (Ignis) es una cosa; `#EF4444` es el borde/glow de legendario en `ListingCard`
  (`rgba(239,68,68,...)`); `#f87171` (67×) es el nombre de legendario en `ListingCard` PERO
  también el color de texto de error genérico en ~10 paneles de `app/admin/*` (con fondo
  `rgba(244,67,54,...)`, o sea F44336); `#E24B4A` (40×) es un cuarto rojo, usado como color
  de "error/rechazado" en Comercio (`market/admin`, formularios). No colapsan entre sí sin
  perder distinción semántica — quedan como 2 escalas: reino (F44336) y estado/rareza
  (F87171 tinte claro + EF4444 borde), más un rojo de error propio de Comercio (E24B4A) que
  habría que decidir si se funde con el de error general o se mantiene aparte.
- **`#c9a84c` (~10 archivos, todos dentro de `market/`) vs `#d4af37` (`var(--gold)`, resto
  del sitio)** — esto es Comercio usando su propio dorado, no un error de tipeo: es el
  mismo patrón que la paleta de fondo propia. Relevante para la decisión de la sección 7.

### No encajan en ninguna de las 4 escalas de `docs/design.md`
- **Colores de marca de terceros** (correctos tal cual, no deberían tokenizarse al
  sistema interno): `#5865F2` Discord (`login/page.tsx`, `Header.tsx`, `SellerCard.tsx`),
  `#25D366` WhatsApp (`SellerCard.tsx`), `#53FC18` Kick (`PlatformIcons.tsx`,
  `HighlightCard.tsx`).
- **Colores de tipo de daño mágico/físico** (`app/market/nuevo/page.tsx`, formulario de
  publicar ítem): Fuego `#F97316`, Hielo `#38BDF8`, Electricidad `#FDE047`, más Cortante/
  Punzante/Aplastante reusando rojos y violetas de otras escalas. Es una quinta escala
  real (tipo de daño del juego) que `docs/design.md` no contempla.
- **Verde de éxito/estado "en línea" con múltiples tonos** sin agrupar aún:
  `#5bc98b`/`#4ade80`/`#22c55e`/`#86efac` — puede que sea una escala de estado
  (activo/conectado/éxito) separada de rareza-mágico, a decidir en la Fase 1.

### Un vistazo a la lista completa (para no perder nada al tokenizar)
```
67 #f87171   47 #5bc98b   40 #e24b4a   35 #f44336   35 #4caf50   30 #f59e0b
19 #fff      17 #ef4444   11 #5b9bdf   10 #d4af37   10 #c9a84c    9 #2e7d52
 9 #0d0a07    8 #fb923c    8 #7dc4ff    8 #2196f3    8 #1a5c35    8 #0a0a0a
 8 #000       7 #a78bfa    7 #22c55e    6 #888       6 #4ade80    5 #ffa500
 5 #f5c518    5 #8b5cf6    5 #7a8a9a    5 #1e4a7a    4 #6ee89a    4 #5b8fd4
 4 #2d9b4e    4 #1e6db5    4 #0f2d52    3 #fde047    3 #fca5a5    3 #f97316
 3 #e2744a    3 #c4b5fd    3 #c0c0c0    3 #b8a157    3 #b45309    3 #909090
 3 #7dd3fc    3 #5865f2    3 #38bdf8    3 #1a5c2e    3 #0f3460    2 #ff6b6b
 2 #ff0000    2 #fbbf24    2 #cd7f32    2 #9dc4e8    2 #9ca3af    2 #8a8a8a
 2 #6d28d9    2 #606060    2 #53fc18    2 #1c1700    2 #1a0a0a    2 #141414
 2 #120f00    2 #0f0d0a    2 #0d0d0d
 (resto: 26 valores usados 1 sola vez — sombras/gradientes puntuales, se listan al
 tokenizar cada componente si hace falta un token nuevo)
```

## 7. Bug preexistente — auth colgada sin feedback (no relacionado a colores)

Causa: el patrón de auth-check client-side no tiene `.catch()` ni manejo de
rechazo. Si `supabase.auth.getUser()` no resuelve (falla de red, timeout del
lado de Supabase, lo que sea), el `.then()`/`await` que decide `router.push('/login')`
nunca se ejecuta, y el componente queda para siempre en su estado inicial de
loading:

```ts
supabase.auth.getUser().then(({ data }) => {
  if (!data.user) { router.push('/login'); return }
  // ...
})
```
o la variante `await` equivalente, sin `try/catch` alrededor.

### Reproducido directamente (visto fallar en el navegador)
Sin sesión iniciada, ambas páginas se quedan en "Cargando..." indefinidamente
al abrirlas — no hay error, no hay redirect a `/login`, no hay timeout
(esperado 8s+ sin cambio de estado):
- `app/market/nuevo/page.tsx`
- `app/market/watchlist/page.tsx`

### Inferido por lectura de código — NO reproducido en navegador
Mismo patrón exacto (`getUser()` sin `.catch()` gateando un estado de
loading), encontrado por grep, no abierto ni probado en el navegador. Puede
compartir la misma falla o no:
- `app/market/mis-listings/page.tsx`
- `app/market/mis-listings/[id]/editar/page.tsx`
- `app/market/configuracion/page.tsx`
- `app/market/elegir-nombre/page.tsx`
- `app/market/calificar/[txId]/page.tsx`
- `app/market/admin/page.tsx`
- `app/market/transacciones/page.tsx`

`app/market/favoritos/page.tsx` usa `getUser()` del lado del servidor con
`redirect()` — mecanismo distinto, no comparte este riesgo.

No es parte de la Fase 1 (tokens de color) — queda anotado para atender aparte.
