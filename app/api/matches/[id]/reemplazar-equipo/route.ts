import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { esOrganizadorDelTorneo } from '@/lib/roles'

type Dependiente = { matchId: string; estado: string; field: 'equipo_a_id' | 'equipo_b_id' | 'ambos' }

/** Encuentra el/los partido(s) que dependen directamente del resultado de
 *  `match` (a dónde avanza el ganador, y en eliminación doble a dónde cae
 *  el perdedor). Para cada uno devuelve su estado actual y el campo
 *  (`equipo_a_id`/`equipo_b_id`) que ese resultado llenó — así se puede
 *  tanto CHEQUEAR que no esté jugado como LIMPIAR ese campo si hace falta
 *  revertir. No hace ninguna escritura, solo lecturas. */
async function partidosDependientes(supabase: any, match: any, bracketType: string, torneoId: string): Promise<Dependiente[]> {
  const dependientes: Dependiente[] = []

  if (bracketType === 'round_robin') return dependientes
  // 'league' (fase de liga de un league_cup) tampoco alimenta a otro
  // partido de liga — solo la fase de copa (bracket='main') sí.
  if (match.bracket === 'league') return dependientes

  if (match.bracket === 'main') {
    if (bracketType !== 'double_elimination') {
      const { data: next } = await supabase
        .from('matches').select('id, estado')
        .eq('torneo_id', torneoId).eq('bracket', 'main')
        .eq('ronda_numero', match.ronda_numero + 1).eq('posicion', Math.ceil(match.posicion / 2))
        .maybeSingle()
      if (next) dependientes.push({ matchId: next.id, estado: next.estado, field: match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id' })
      return dependientes
    }

    // Eliminación doble
    const { data: mainMatches } = await supabase.from('matches').select('ronda_numero').eq('torneo_id', torneoId).eq('bracket', 'main')
    const maxMainRound = Math.max(...(mainMatches ?? []).map((m: any) => m.ronda_numero))
    const esFinalPrincipal = match.ronda_numero === maxMainRound

    if (!esFinalPrincipal) {
      const { data: nextMain } = await supabase
        .from('matches').select('id, estado')
        .eq('torneo_id', torneoId).eq('bracket', 'main')
        .eq('ronda_numero', match.ronda_numero + 1).eq('posicion', Math.ceil(match.posicion / 2))
        .maybeSingle()
      if (nextMain) dependientes.push({ matchId: nextMain.id, estado: nextMain.estado, field: match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id' })

      if (match.ronda_numero === 1) {
        const { data: lb } = await supabase
          .from('matches').select('id, estado')
          .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', 1).eq('posicion', Math.ceil(match.posicion / 2))
          .maybeSingle()
        if (lb) dependientes.push({ matchId: lb.id, estado: lb.estado, field: match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id' })
      } else {
        const { data: lb } = await supabase
          .from('matches').select('id, estado')
          .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', 2 * (match.ronda_numero - 1)).eq('posicion', match.posicion)
          .maybeSingle()
        if (lb) dependientes.push({ matchId: lb.id, estado: lb.estado, field: 'equipo_b_id' })
      }
    } else {
      const { data: gf } = await supabase.from('matches').select('id, estado').eq('torneo_id', torneoId).eq('bracket', 'grand_final').eq('ronda_numero', 1).maybeSingle()
      if (gf) dependientes.push({ matchId: gf.id, estado: gf.estado, field: 'equipo_a_id' })

      const { data: lbMatches } = await supabase.from('matches').select('ronda_numero').eq('torneo_id', torneoId).eq('bracket', 'losers')
      if (lbMatches && lbMatches.length > 0) {
        const maxLbRound = Math.max(...lbMatches.map((m: any) => m.ronda_numero))
        const { data: lbFinal } = await supabase.from('matches').select('id, estado').eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', maxLbRound).eq('posicion', 1).maybeSingle()
        if (lbFinal) dependientes.push({ matchId: lbFinal.id, estado: lbFinal.estado, field: 'equipo_b_id' })
      }
    }
    return dependientes
  }

  if (match.bracket === 'losers') {
    const { data: lbMatches } = await supabase.from('matches').select('ronda_numero').eq('torneo_id', torneoId).eq('bracket', 'losers')
    const maxLbRound = Math.max(...(lbMatches ?? []).map((m: any) => m.ronda_numero))

    if (match.ronda_numero === maxLbRound) {
      const { data: gf } = await supabase.from('matches').select('id, estado').eq('torneo_id', torneoId).eq('bracket', 'grand_final').eq('ronda_numero', 1).maybeSingle()
      if (gf) dependientes.push({ matchId: gf.id, estado: gf.estado, field: 'equipo_b_id' })
      return dependientes
    }

    const { count: countActual } = await supabase.from('matches').select('id', { count: 'exact', head: true }).eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', match.ronda_numero)
    const { count: countSiguiente } = await supabase.from('matches').select('id', { count: 'exact', head: true }).eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', match.ronda_numero + 1)

    if (countSiguiente === countActual) {
      const { data: next } = await supabase.from('matches').select('id, estado').eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', match.ronda_numero + 1).eq('posicion', match.posicion).maybeSingle()
      if (next) dependientes.push({ matchId: next.id, estado: next.estado, field: 'equipo_a_id' })
    } else {
      const lbPos = Math.ceil(match.posicion / 2)
      const { data: next } = await supabase.from('matches').select('id, estado').eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', match.ronda_numero + 1).eq('posicion', lbPos).maybeSingle()
      if (next) dependientes.push({ matchId: next.id, estado: next.estado, field: match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id' })
    }
    return dependientes
  }

  if (match.bracket === 'grand_final' && match.ronda_numero === 1) {
    // Si ya existe la revancha (ronda 2) es porque el lado de perdedores le
    // ganó a esta gran final — si esa revancha ya se jugó, hay que corregir
    // esa primero. Si todavía no se jugó, se borra (dejó de corresponder).
    const { data: reset } = await supabase.from('matches').select('id, estado').eq('torneo_id', torneoId).eq('bracket', 'grand_final').eq('ronda_numero', 2).maybeSingle()
    if (reset) dependientes.push({ matchId: reset.id, estado: reset.estado, field: 'ambos' })
  }

  return dependientes
}

async function revertirMmrDelPartido(supabase: any, matchId: string) {
  const { data: historial } = await supabase.from('mmr_history').select('*').eq('match_id', matchId)
  for (const h of historial ?? []) {
    if (!h.personaje_id) continue
    const { data: p } = await supabase.from('personajes').select('partidas_jugadas, partidas_ganadas').eq('id', h.personaje_id).single()
    if (!p) continue
    const partidas = Math.max(0, p.partidas_jugadas - 1)
    const ganadas = Math.max(0, p.partidas_ganadas - (h.gano ? 1 : 0))
    await supabase.from('personajes').update({
      mmr: h.mmr_antes, partidas_jugadas: partidas, partidas_ganadas: ganadas,
      winrate: partidas > 0 ? Math.round((ganadas / partidas) * 100) : 0,
    }).eq('id', h.personaje_id)
  }
  await supabase.from('mmr_history').delete().eq('match_id', matchId)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: player } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!player) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { slot, nuevo_team_id } = body as { slot: 'a' | 'b'; nuevo_team_id: string }
  if (slot !== 'a' && slot !== 'b') return NextResponse.json({ error: 'slot inválido' }, { status: 400 })
  if (!nuevo_team_id) return NextResponse.json({ error: 'nuevo_team_id requerido' }, { status: 400 })

  const svc = createServiceSupabase()

  const { data: match } = await svc.from('matches').select('*').eq('id', id).single()
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  const { data: torneo } = await svc.from('tournaments').select('id, creator_id, bracket_type').eq('id', match.torneo_id).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
  const esOrganizador = await esOrganizadorDelTorneo(svc, torneo.id, torneo.creator_id, player)
  if (!esOrganizador) return NextResponse.json({ error: 'Sin permisos sobre este torneo' }, { status: 403 })

  const { data: nuevoEquipo } = await svc.from('teams').select('id').eq('id', nuevo_team_id).single()
  if (!nuevoEquipo) return NextResponse.json({ error: 'El equipo elegido no existe' }, { status: 400 })

  const bracketType = torneo.bracket_type ?? 'single_elimination'
  const field = slot === 'a' ? 'equipo_a_id' : 'equipo_b_id'

  if (match.estado === 'jugado') {
    const dependientes = await partidosDependientes(svc, match, bracketType, torneo.id)
    if (dependientes.some(d => d.estado === 'jugado')) {
      return NextResponse.json({
        error: 'No se puede cambiar de equipo — ya se jugó un partido siguiente que depende de este resultado. Corregí primero ese partido (o revertilo) antes de cambiar el equipo acá.',
      }, { status: 409 })
    }

    await revertirMmrDelPartido(svc, id)
    await svc.from('matches').update({ estado: 'pendiente', ganador_id: null, resultado: null }).eq('id', id)

    for (const dep of dependientes) {
      if (dep.field === 'ambos') {
        await svc.from('matches').delete().eq('id', dep.matchId)
      } else {
        await svc.from('matches').update({ [dep.field]: null }).eq('id', dep.matchId)
      }
    }
  }

  await svc.from('matches').update({ [field]: nuevo_team_id }).eq('id', id)

  return NextResponse.json({ ok: true })
}
