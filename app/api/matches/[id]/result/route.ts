import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { calcularEsperado, calcularNuevoMMR, ELO_K_DEFAULT, ELO_K_VETERAN, ELO_VETERAN_THRESHOLD } from '@/lib/constants'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: player } = await supabase
    .from('players')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!player || !['organizer', 'admin'].includes(player.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { ganador_id } = body as { ganador_id: string }

  if (!ganador_id) return NextResponse.json({ error: 'ganador_id requerido' }, { status: 400 })

  const { data: match } = await supabase
    .from('matches')
    .select('*, equipo_a:teams!matches_equipo_a_id_fkey(id, nombre), equipo_b:teams!matches_equipo_b_id_fkey(id, nombre)')
    .eq('id', id)
    .single()

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  if (match.estado === 'jugado') return NextResponse.json({ error: 'Partido ya jugado' }, { status: 409 })
  if (!match.equipo_a_id || !match.equipo_b_id) {
    return NextResponse.json({ error: 'Todavía falta definir alguno de los dos equipos de este partido' }, { status: 409 })
  }

  const { data: torneo } = await supabase.from('tournaments').select('bracket_type').eq('id', match.torneo_id).single()
  const bracketType = torneo?.bracket_type ?? 'single_elimination'

  const perdedor_id = ganador_id === match.equipo_a_id ? match.equipo_b_id : match.equipo_a_id

  // Get players from both teams
  const { data: ganadores } = await supabase.from('team_members').select('player_id, players(mmr_global, partidas_jugadas, partidas_ganadas)').eq('team_id', ganador_id)
  const { data: perdedores } = await supabase.from('team_members').select('player_id, players(mmr_global, partidas_jugadas, partidas_ganadas)').eq('team_id', perdedor_id)

  const allUpdates: PromiseLike<any>[] = []
  const historyInserts: any[] = []

  const processPlayer = (member: any, gano: boolean, opponentAvgMmr: number) => {
    const p = member.players
    if (!p) return
    const k = p.partidas_jugadas >= ELO_VETERAN_THRESHOLD ? ELO_K_VETERAN : ELO_K_DEFAULT
    const esperado = calcularEsperado(p.mmr_global, opponentAvgMmr)
    const nuevoMmr = Math.max(100, calcularNuevoMMR(p.mmr_global, gano, esperado, k))
    const nuevasPartidas = p.partidas_jugadas + 1
    const nuevasGanadas = p.partidas_ganadas + (gano ? 1 : 0)
    const nuevoWinrate = Math.round((nuevasGanadas / nuevasPartidas) * 100)

    allUpdates.push(
      supabase.from('players').update({
        mmr_global: nuevoMmr,
        partidas_jugadas: nuevasPartidas,
        partidas_ganadas: nuevasGanadas,
        winrate: nuevoWinrate,
      }).eq('id', member.player_id)
    )

    historyInserts.push({
      player_id: member.player_id,
      match_id: id,
      torneo_id: match.torneo_id,
      mmr_antes: p.mmr_global,
      mmr_despues: nuevoMmr,
      gano,
    })
  }

  const avgMmrGanadores = ganadores && ganadores.length > 0
    ? ganadores.reduce((s: number, m: any) => s + (m.players?.mmr_global ?? 1200), 0) / ganadores.length
    : 1200

  const avgMmrPerdedores = perdedores && perdedores.length > 0
    ? perdedores.reduce((s: number, m: any) => s + (m.players?.mmr_global ?? 1200), 0) / perdedores.length
    : 1200

  ganadores?.forEach((m: any) => processPlayer(m, true, avgMmrPerdedores))
  perdedores?.forEach((m: any) => processPlayer(m, false, avgMmrGanadores))

  await Promise.all([
    ...allUpdates,
    supabase.from('mmr_history').insert(historyInserts),
    supabase.from('matches').update({ ganador_id, estado: 'jugado', resultado: `${match.equipo_a?.nombre} vs ${match.equipo_b?.nombre}` }).eq('id', id),
  ])

  if (bracketType === 'double_elimination') {
    await avanzarEliminacionDoble(supabase, match, ganador_id, perdedor_id)
  } else if (bracketType !== 'round_robin') {
    // Eliminación simple: el ganador avanza a la ronda siguiente. Round
    // Robin no tiene avance — cada partido es independiente.
    const { data: nextMatch } = await supabase
      .from('matches')
      .select('id, equipo_a_id, equipo_b_id')
      .eq('torneo_id', match.torneo_id)
      .eq('bracket', 'main')
      .eq('ronda_numero', match.ronda_numero + 1)
      .eq('posicion', Math.ceil(match.posicion / 2))
      .maybeSingle()

    if (nextMatch) {
      const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
      await supabase.from('matches').update({ [field]: ganador_id }).eq('id', nextMatch.id)
    }
  }

  return NextResponse.json({ ok: true })
}

/**
 * Ruteo de eliminación doble. Tres llaves: 'main' (principal), 'losers'
 * (perdedores), 'grand_final'.
 *
 * - Partido de 'main' que NO es la final de la llave principal: el
 *   ganador avanza en 'main' como en eliminación simple; el perdedor
 *   cae a 'losers' — a la ronda 1 (empareja directo con otro caído de
 *   la ronda 1) si viene de la ronda 1, o a la ronda mayor
 *   correspondiente (2*(ronda-1)) si viene de una ronda posterior.
 * - Final de 'main': el ganador va a la gran final (equipo_a); el
 *   perdedor cae a la última ronda de 'losers'.
 * - Partido de 'losers' que NO es la final de esa llave: el ganador
 *   avanza dentro de 'losers' — misma posición si la ronda siguiente
 *   tiene la misma cantidad de partidos (ronda mayor), o a
 *   ceil(pos/2) si la ronda siguiente es la mitad (ronda menor).
 * - Final de 'losers': el ganador va a la gran final (equipo_b).
 * - Gran final: si gana el equipo que venía invicto de 'main', termina
 *   el torneo. Si gana el que venía de 'losers' (le gana su primera
 *   derrota al invicto), se crea una segunda gran final (reset) para
 *   desempatar, como corresponde en eliminación doble.
 */
async function avanzarEliminacionDoble(supabase: any, match: any, ganador_id: string, perdedor_id: string) {
  const torneoId = match.torneo_id

  if (match.bracket === 'main') {
    const { data: mainMatches } = await supabase
      .from('matches').select('ronda_numero').eq('torneo_id', torneoId).eq('bracket', 'main')
    const maxMainRound = Math.max(...(mainMatches ?? []).map((m: any) => m.ronda_numero))
    const esFinalPrincipal = match.ronda_numero === maxMainRound

    if (!esFinalPrincipal) {
      // Ganador avanza en 'main'
      const { data: nextMain } = await supabase
        .from('matches').select('id')
        .eq('torneo_id', torneoId).eq('bracket', 'main')
        .eq('ronda_numero', match.ronda_numero + 1).eq('posicion', Math.ceil(match.posicion / 2))
        .maybeSingle()
      if (nextMain) {
        const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
        await supabase.from('matches').update({ [field]: ganador_id }).eq('id', nextMain.id)
      }

      // Perdedor cae a 'losers'
      if (match.ronda_numero === 1) {
        const lbRound = 1
        const lbPos = Math.ceil(match.posicion / 2)
        const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
        await supabase.from('matches').update({ [field]: perdedor_id })
          .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', lbRound).eq('posicion', lbPos)
      } else {
        const lbRound = 2 * (match.ronda_numero - 1)
        await supabase.from('matches').update({ equipo_b_id: perdedor_id })
          .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', lbRound).eq('posicion', match.posicion)
      }
    } else {
      // Final de la llave principal
      await supabase.from('matches').update({ equipo_a_id: ganador_id })
        .eq('torneo_id', torneoId).eq('bracket', 'grand_final').eq('ronda_numero', 1)

      const { data: lbMatches } = await supabase
        .from('matches').select('ronda_numero').eq('torneo_id', torneoId).eq('bracket', 'losers')
      if (lbMatches && lbMatches.length > 0) {
        const maxLbRound = Math.max(...lbMatches.map((m: any) => m.ronda_numero))
        await supabase.from('matches').update({ equipo_b_id: perdedor_id })
          .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', maxLbRound).eq('posicion', 1)
      }
    }
    return
  }

  if (match.bracket === 'losers') {
    const { data: lbMatches } = await supabase
      .from('matches').select('ronda_numero').eq('torneo_id', torneoId).eq('bracket', 'losers')
    const maxLbRound = Math.max(...(lbMatches ?? []).map((m: any) => m.ronda_numero))

    if (match.ronda_numero === maxLbRound) {
      // Final de la llave de perdedores — a la gran final como equipo_b
      await supabase.from('matches').update({ equipo_b_id: ganador_id })
        .eq('torneo_id', torneoId).eq('bracket', 'grand_final').eq('ronda_numero', 1)
      return
    }

    const { count: countActual } = await supabase
      .from('matches').select('id', { count: 'exact', head: true })
      .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', match.ronda_numero)
    const { count: countSiguiente } = await supabase
      .from('matches').select('id', { count: 'exact', head: true })
      .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', match.ronda_numero + 1)

    if (countSiguiente === countActual) {
      // Ronda mayor a continuación: misma posición, entra como equipo_a
      // (el equipo_b de esa ronda lo llena el que recién cae de 'main')
      await supabase.from('matches').update({ equipo_a_id: ganador_id })
        .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', match.ronda_numero + 1).eq('posicion', match.posicion)
    } else {
      // Ronda menor a continuación: se empareja de a dos, como eliminación simple
      const lbPos = Math.ceil(match.posicion / 2)
      const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
      await supabase.from('matches').update({ [field]: ganador_id })
        .eq('torneo_id', torneoId).eq('bracket', 'losers').eq('ronda_numero', match.ronda_numero + 1).eq('posicion', lbPos)
    }
    return
  }

  if (match.bracket === 'grand_final') {
    if (ganador_id === match.equipo_a_id) {
      // Ganó el invicto de la llave principal — torneo terminado
      await supabase.from('tournaments').update({ estado: 'finalizado' }).eq('id', torneoId)
      return
    }
    // Ganó el que venía de la llave de perdedores — le ganó su primera
    // derrota al invicto. Eliminación doble exige una revancha (reset).
    if (match.ronda_numero === 1) {
      await supabase.from('matches').insert({
        torneo_id: torneoId, bracket: 'grand_final', ronda: 'Gran Final (desempate)',
        ronda_numero: 2, posicion: 1,
        equipo_a_id: match.equipo_a_id, equipo_b_id: match.equipo_b_id, estado: 'pendiente',
      })
    } else {
      // Esta ya era la revancha — se define acá, no hay más rondas.
      await supabase.from('tournaments').update({ estado: 'finalizado' }).eq('id', torneoId)
    }
  }
}
