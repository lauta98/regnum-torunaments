/** Generadores de cuadro reutilizables — extraídos de
 *  /api/torneos/[id]/generar-bracket para que también los use
 *  /api/torneos/[id]/generar-copa (fase de copa de un torneo Liga + Copa). */

export interface SlotMatch {
  round: number
  posicion: number
  equipoA: string | null
  equipoB: string | null
}

export function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Nombre según la cantidad de partidos QUE QUEDAN en esa ronda (no la
// cantidad de equipos) — así se corresponde con la terminología
// estándar: 1 partido = Final, 2 = Semifinal, 4 = Cuartos, 8 =
// Octavos, 16 = Dieciseisavos, 32 = Treintaidosavos.
const NOMBRES_RONDA: Record<number, string> = {
  1: 'Final',
  2: 'Semifinal',
  4: 'Cuartos de Final',
  8: 'Octavos de Final',
  16: 'Dieciseisavos de Final',
  32: 'Treintaidosavos de Final',
  64: 'Sesentaicuatroavos de Final',
}

export function roundName(matchesEnEsaRonda: number, esFinal: boolean): string {
  if (esFinal) return 'Final'
  return NOMBRES_RONDA[matchesEnEsaRonda] ?? `Ronda de ${matchesEnEsaRonda * 2}`
}

/** Eliminación simple — resuelve byes en el momento de generar, para que
 *  las rondas siguientes ya arranquen con el equipo que pasó de largo.
 *  Si se pasa `ordenFijo`, se respeta tal cual (sorteo en vivo ya hecho
 *  en el cliente, o seeding por tabla de posiciones); si no, se mezcla
 *  acá (sorteo rápido). */
export function buildSingleElimination(teamIds: string[], ordenFijo?: string[]): SlotMatch[][] {
  const size = nextPow2(teamIds.length)
  let current: (string | null)[] = ordenFijo && ordenFijo.length === teamIds.length ? [...ordenFijo] : shuffle(teamIds)
  while (current.length < size) current.push(null) // bye

  const rounds: SlotMatch[][] = []
  let roundNum = 1
  while (current.length > 1) {
    const roundMatches: SlotMatch[] = []
    const next: (string | null)[] = []
    for (let i = 0; i < current.length / 2; i++) {
      const a = current[2 * i]
      const b = current[2 * i + 1]
      roundMatches.push({ round: roundNum, posicion: i + 1, equipoA: a, equipoB: b })
      if (a && !b) next.push(a)
      else if (b && !a) next.push(b)
      else next.push(null) // se define jugando (o queda TBD si ambos son bye, no debería pasar)
    }
    rounds.push(roundMatches)
    current = next
    roundNum++
  }
  return rounds
}

interface LBRoundSpec { round: number; matches: number }

/** Calcula cuántas rondas y partidos tiene la llave de perdedores para
 *  un cuadro de `size` equipos (potencia de 2 exacta). Alterna rondas
 *  "menores" (sobrevivientes de perdedores contra sí mismos, reduce a
 *  la mitad) y "mayores" (sobrevivientes contra los que acaban de bajar
 *  de la llave principal, misma cantidad). El total de partidos da
 *  siempre size-2, que es el número conocido para eliminación doble. */
function calcularRondasPerdedores(size: number): LBRoundSpec[] {
  const R = Math.log2(size)
  const specs: LBRoundSpec[] = []
  let survivors = 0
  let roundNum = 0
  for (let wr = 1; wr <= R; wr++) {
    const wbLosers = size / Math.pow(2, wr)
    if (wr === 1) {
      roundNum++
      const m = wbLosers / 2
      specs.push({ round: roundNum, matches: m })
      survivors = m
    } else {
      roundNum++
      specs.push({ round: roundNum, matches: survivors }) // ronda mayor: sobrevivientes vs nuevos caídos
      if (wr < R && survivors > 1) {
        roundNum++
        const m = survivors / 2
        specs.push({ round: roundNum, matches: m }) // ronda menor: sobrevivientes entre sí
        survivors = m
      }
    }
  }
  return specs
}

/** Eliminación doble — solo admite una cantidad de equipos que sea
 *  potencia de 2 exacta (4, 8, 16, 32), para no mezclar byes con la
 *  llave de perdedores (ahí es donde este formato se rompe fácil).
 *  Genera la llave principal (ronda 1 con equipos reales, el resto
 *  vacío) + la llave de perdedores entera vacía (se llena sola a
 *  medida que se cargan resultados) + un lugar para la gran final. */
export function buildDoubleElimination(teamIds: string[], ordenFijo?: string[]): {
  main: SlotMatch[][]
  losers: LBRoundSpec[]
} {
  const main = buildSingleElimination(teamIds, ordenFijo)
  const size = nextPow2(teamIds.length)
  const losers = calcularRondasPerdedores(size)
  return { main, losers }
}

/** Round robin — método del círculo. Todos juegan contra todos una vez,
 *  repartido en fechas para minimizar partidos simultáneos por equipo. */
export function buildRoundRobin(teamIds: string[]): SlotMatch[][] {
  let arr: (string | null)[] = [...teamIds]
  if (arr.length % 2 !== 0) arr.push(null) // equipo libre si es impar
  const n = arr.length
  const half = n / 2
  const rounds: SlotMatch[][] = []

  for (let r = 0; r < n - 1; r++) {
    const roundMatches: SlotMatch[] = []
    let pos = 1
    for (let i = 0; i < half; i++) {
      const a = arr[i]
      const b = arr[n - 1 - i]
      if (a && b) roundMatches.push({ round: r + 1, posicion: pos++, equipoA: a, equipoB: b })
    }
    if (roundMatches.length) rounds.push(roundMatches)
    const fixed = arr[0]
    const rest = arr.slice(1)
    rest.unshift(rest.pop()!)
    arr = [fixed, ...rest]
  }
  return rounds
}

export type Standing = { teamId: string; w: number; d: number; l: number; pts: number; for: number; against: number }

/** Tabla de posiciones de la fase de liga: 2 puntos por victoria, 1 por
 *  empate, 0 por derrota (igual que la pestaña "Posiciones"). Ordena por
 *  puntos, después victorias, después diferencia de puntos a favor/contra. */
export function standingsFromMatches(matches: { equipo_a_id: string | null; equipo_b_id: string | null; ganador_id: string | null; resultado: string | null; estado: string }[]): Standing[] {
  const stats: Record<string, Standing> = {}
  const ensure = (id: string) => (stats[id] ??= { teamId: id, w: 0, d: 0, l: 0, pts: 0, for: 0, against: 0 })

  for (const m of matches) {
    if (m.estado !== 'jugado' || !m.equipo_a_id || !m.equipo_b_id) continue
    const a = ensure(m.equipo_a_id), b = ensure(m.equipo_b_id)
    const parsed = m.resultado?.match(/(\d+)\s*-\s*(\d+)/)
    const scores = parsed ? [Number(parsed[1]), Number(parsed[2])] : null
    if (m.ganador_id) {
      const aGana = m.ganador_id === m.equipo_a_id
      const ganador = aGana ? a : b, perdedor = aGana ? b : a
      ganador.w++; ganador.pts += 2; perdedor.l++
      if (scores) {
        const [sG, sP] = aGana ? scores : [scores[1], scores[0]]
        ganador.for += sG; ganador.against += sP
        perdedor.for += sP; perdedor.against += sG
      }
    } else {
      a.d++; a.pts++; b.d++; b.pts++
      if (scores) { a.for += scores[0]; a.against += scores[1]; b.for += scores[1]; b.against += scores[0] }
    }
  }

  return Object.values(stats).sort((x, y) =>
    y.pts - x.pts || y.w - x.w || (y.for - y.against) - (x.for - x.against) || y.for - x.for
  )
}
