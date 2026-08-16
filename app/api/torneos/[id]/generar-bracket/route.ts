import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

interface SlotMatch {
  round: number
  posicion: number
  equipoA: string | null
  equipoB: string | null
}

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

function shuffle<T>(arr: T[]): T[] {
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

function roundName(matchesEnEsaRonda: number, esFinal: boolean): string {
  if (esFinal) return 'Final'
  return NOMBRES_RONDA[matchesEnEsaRonda] ?? `Ronda de ${matchesEnEsaRonda * 2}`
}

/** Eliminación simple — resuelve byes en el momento de generar, para que
 *  las rondas siguientes ya arranquen con el equipo que pasó de largo.
 *  Si se pasa `ordenFijo`, se respeta tal cual (sorteo en vivo ya hecho
 *  en el cliente); si no, se mezcla acá (sorteo rápido). */
function buildSingleElimination(teamIds: string[], ordenFijo?: string[]): SlotMatch[][] {
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
function buildDoubleElimination(teamIds: string[], ordenFijo?: string[]): {
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
function buildRoundRobin(teamIds: string[]): SlotMatch[][] {
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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: player } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!player) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: torneo } = await supabase.from('tournaments').select('*').eq('id', torneoId).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

  const esOrganizador = torneo.creator_id === player.id || player.role === 'admin'
  if (!esOrganizador) return NextResponse.json({ error: 'Sin permisos sobre este torneo' }, { status: 403 })

  // No pisar un cuadro que ya tiene resultados cargados
  const { data: existentes } = await supabase.from('matches').select('id, estado').eq('torneo_id', torneoId)
  if (existentes && existentes.some(m => m.estado === 'jugado')) {
    return NextResponse.json({ error: 'Ya hay resultados cargados — no se puede regenerar el cuadro.' }, { status: 409 })
  }

  const { data: registros } = await supabase
    .from('tournament_registrations')
    .select('team_id')
    .eq('tournament_id', torneoId)
    .eq('estado', 'activo')

  const teamIds = (registros ?? []).map(r => r.team_id)
  if (teamIds.length < 2) {
    return NextResponse.json({ error: 'Hacen falta al menos 2 equipos inscriptos.' }, { status: 400 })
  }

  // Orden ya determinado por el sorteo en vivo (opcional) — se valida que
  // sea exactamente el mismo conjunto de equipos inscriptos, ni más ni menos.
  let orden: string[] | undefined
  try {
    const body = await request.json()
    if (Array.isArray(body?.orden)) orden = body.orden
  } catch { /* sin body o body vacío, sorteo rápido normal */ }

  if (orden) {
    const setEnviado = new Set(orden)
    const setReal = new Set(teamIds)
    const mismosEquipos = setEnviado.size === setReal.size && [...setEnviado].every(t => setReal.has(t))
    if (!mismosEquipos) {
      return NextResponse.json({ error: 'El orden enviado no coincide con los equipos inscriptos.' }, { status: 400 })
    }
  }

  if (torneo.bracket_type === 'double_elimination') {
    const size = nextPow2(teamIds.length)
    if (size !== teamIds.length) {
      return NextResponse.json({
        error: `Eliminación doble solo admite una cantidad de equipos que sea potencia de 2 (4, 8, 16, 32...). Hoy hay ${teamIds.length} inscriptos.`,
      }, { status: 400 })
    }
  }

  // Limpiar matches vacíos de un intento anterior (ninguno jugado, ya lo validamos arriba)
  if (existentes && existentes.length > 0) {
    await supabase.from('matches').delete().eq('torneo_id', torneoId)
  }

  const rows: any[] = []

  if (torneo.bracket_type === 'double_elimination') {
    const { main, losers } = buildDoubleElimination(teamIds, orden)

    main.forEach((roundMatches, idx) => {
      const isFinal = idx === main.length - 1
      const ronda = (isFinal ? 'Final Llave Principal' : roundName(roundMatches.length, false))
      roundMatches.forEach(m => {
        const esBye = !!(m.equipoA && !m.equipoB) || !!(m.equipoB && !m.equipoA)
        rows.push({
          torneo_id: torneoId, bracket: 'main', ronda, ronda_numero: m.round, posicion: m.posicion,
          equipo_a_id: m.equipoA, equipo_b_id: m.equipoB,
          estado: esBye ? 'jugado' : 'pendiente',
          ganador_id: esBye ? (m.equipoA ?? m.equipoB) : null,
          resultado: esBye ? 'BYE' : null,
        })
      })
    })

    losers.forEach(spec => {
      for (let p = 1; p <= spec.matches; p++) {
        rows.push({
          torneo_id: torneoId, bracket: 'losers', ronda: `Perdedores — Ronda ${spec.round}`,
          ronda_numero: spec.round, posicion: p,
          equipo_a_id: null, equipo_b_id: null, estado: 'pendiente',
        })
      }
    })

    rows.push({
      torneo_id: torneoId, bracket: 'grand_final', ronda: 'Gran Final',
      ronda_numero: 1, posicion: 1, equipo_a_id: null, equipo_b_id: null, estado: 'pendiente',
    })
  } else {
    const rounds = torneo.bracket_type === 'round_robin'
      ? buildRoundRobin(teamIds)
      : buildSingleElimination(teamIds, orden)

    rounds.forEach((roundMatches, idx) => {
      const isFinal = torneo.bracket_type !== 'round_robin' && idx === rounds.length - 1
      const ronda = torneo.bracket_type === 'round_robin'
        ? `Fecha ${idx + 1}`
        : roundName(roundMatches.length, isFinal)
      roundMatches.forEach(m => {
        const esBye = !!(m.equipoA && !m.equipoB) || !!(m.equipoB && !m.equipoA)
        rows.push({
          torneo_id: torneoId, bracket: 'main', ronda, ronda_numero: m.round, posicion: m.posicion,
          equipo_a_id: m.equipoA, equipo_b_id: m.equipoB,
          estado: esBye ? 'jugado' : 'pendiente',
          ganador_id: esBye ? (m.equipoA ?? m.equipoB) : null,
          resultado: esBye ? 'BYE' : null,
        })
      })
    })
  }

  const { error: insertError } = await supabase.from('matches').insert(rows)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  await supabase.from('tournaments').update({ estado: 'live' }).eq('id', torneoId)

  return NextResponse.json({ ok: true, partidos: rows.length })
}
