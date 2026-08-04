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

function roundName(matchesEnEsaRonda: number, esFinal: boolean): string {
  if (esFinal) return 'Final'
  if (matchesEnEsaRonda === 1) return 'Semifinal'
  if (matchesEnEsaRonda === 2) return 'Cuartos de Final'
  if (matchesEnEsaRonda === 4) return 'Octavos de Final'
  return `Ronda de ${matchesEnEsaRonda * 2}`
}

/** Eliminación simple — resuelve byes en el momento de generar, para que
 *  las rondas siguientes ya arranquen con el equipo que pasó de largo. */
function buildSingleElimination(teamIds: string[]): SlotMatch[][] {
  const size = nextPow2(teamIds.length)
  let current: (string | null)[] = shuffle(teamIds)
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

  const teamIds = (registros ?? []).map(r => r.team_id)
  if (teamIds.length < 2) {
    return NextResponse.json({ error: 'Hacen falta al menos 2 equipos inscriptos.' }, { status: 400 })
  }

  if (torneo.bracket_type === 'double_elimination') {
    return NextResponse.json({
      error: 'La generación automática de eliminación doble todavía no está disponible — arma el cuadro manualmente por ahora, o cambiá el torneo a eliminación simple/Round Robin.',
    }, { status: 501 })
  }

  // Limpiar matches vacíos de un intento anterior (ninguno jugado, ya lo validamos arriba)
  if (existentes && existentes.length > 0) {
    await supabase.from('matches').delete().eq('torneo_id', torneoId)
  }

  const rounds = torneo.bracket_type === 'round_robin'
    ? buildRoundRobin(teamIds)
    : buildSingleElimination(teamIds)

  const rows: any[] = []
  rounds.forEach((roundMatches, idx) => {
    const isFinal = torneo.bracket_type !== 'round_robin' && idx === rounds.length - 1
    const ronda = torneo.bracket_type === 'round_robin'
      ? `Fecha ${idx + 1}`
      : roundName(roundMatches.length, isFinal)
    roundMatches.forEach(m => {
      const esBye = !!(m.equipoA && !m.equipoB) || !!(m.equipoB && !m.equipoA)
      rows.push({
        torneo_id: torneoId,
        ronda,
        ronda_numero: m.round,
        posicion: m.posicion,
        equipo_a_id: m.equipoA,
        equipo_b_id: m.equipoB,
        estado: esBye ? 'jugado' : 'pendiente',
        ganador_id: esBye ? (m.equipoA ?? m.equipoB) : null,
        resultado: esBye ? 'BYE' : null,
      })
    })
  })

  const { error: insertError } = await supabase.from('matches').insert(rows)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  await supabase.from('tournaments').update({ estado: 'live' }).eq('id', torneoId)

  return NextResponse.json({ ok: true, partidos: rows.length })
}
