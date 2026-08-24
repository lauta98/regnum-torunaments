import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { calcularEsperado, calcularNuevoMMR, ELO_K_DEFAULT, ELO_K_VETERAN, ELO_VETERAN_THRESHOLD } from '@/lib/constants'
import { esOrganizadorDelTorneo } from '@/lib/roles'

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
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!player) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // A partir de acá, todas las escrituras van con service role: las
  // políticas de RLS de `players`/`mmr_history` solo dejan a cada
  // usuario tocar su propia fila, no las de otros jugadores del
  // partido — sin esto, el MMR de todos menos el que llama a la API
  // se quedaba sin actualizar en silencio (sin tirar error).
  const svc = createServiceSupabase()

  const body = await request.json()
  const { ganador_id, walkover, score_ganador, score_perdedor, editar } = body as {
    ganador_id: string
    walkover?: boolean
    score_ganador?: number
    score_perdedor?: number
    editar?: boolean
  }

  if (!ganador_id) return NextResponse.json({ error: 'ganador_id requerido' }, { status: 400 })

  if (!walkover) {
    const valido =
      Number.isInteger(score_ganador) && Number.isInteger(score_perdedor) &&
      (score_ganador as number) >= 0 && (score_perdedor as number) >= 0 &&
      (score_ganador as number) > (score_perdedor as number)
    if (!valido) {
      return NextResponse.json({ error: 'Marcador inválido — el ganador tiene que tener más puntos que el perdedor' }, { status: 400 })
    }
  }

  const { data: match } = await svc
    .from('matches')
    .select('*, equipo_a:teams!matches_equipo_a_id_fkey(id, nombre), equipo_b:teams!matches_equipo_b_id_fkey(id, nombre)')
    .eq('id', id)
    .single()

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  const { data: torneo } = await svc.from('tournaments').select('creator_id, bracket_type').eq('id', match.torneo_id).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
  const esOrganizador = await esOrganizadorDelTorneo(svc, match.torneo_id, torneo.creator_id, player)
  if (!esOrganizador) return NextResponse.json({ error: 'Sin permisos sobre este torneo' }, { status: 403 })

  if (editar && match.estado !== 'jugado') {
    return NextResponse.json({ error: 'Este partido todavía no tiene resultado cargado' }, { status: 409 })
  }
  if (!editar && match.estado === 'jugado') {
    return NextResponse.json({ error: 'Partido ya jugado — usá "editar" para corregirlo' }, { status: 409 })
  }
  if (!match.equipo_a_id || !match.equipo_b_id) {
    return NextResponse.json({ error: 'Todavía falta definir alguno de los dos equipos de este partido' }, { status: 409 })
  }
  if (ganador_id !== match.equipo_a_id && ganador_id !== match.equipo_b_id) {
    return NextResponse.json({ error: 'ganador_id no corresponde a ninguno de los dos equipos de este partido' }, { status: 400 })
  }

  const bracketType = torneo.bracket_type ?? 'single_elimination'

  const perdedor_id = ganador_id === match.equipo_a_id ? match.equipo_b_id : match.equipo_a_id

  const ganadorNombre = ganador_id === match.equipo_a_id ? match.equipo_a?.nombre : match.equipo_b?.nombre
  const perdedorNombre = ganador_id === match.equipo_a_id ? match.equipo_b?.nombre : match.equipo_a?.nombre
  const resultado = walkover
    ? `W.O. — ${ganadorNombre} gana por abandono de ${perdedorNombre}`
    : `${ganadorNombre} ${score_ganador} - ${score_perdedor} ${perdedorNombre}`

  /* ── Corrección de un resultado ya cargado ────────────────────── */
  if (editar) {
    if (bracketType === 'double_elimination') {
      return NextResponse.json({
        error: 'Corregir resultados en eliminación doble todavía no está soportado — avisale al desarrollador para arreglarlo a mano.',
      }, { status: 400 })
    }

    const mismoGanador = ganador_id === match.ganador_id

    if (mismoGanador) {
      // Solo cambió el marcador (ej. corregir un typo) — el MMR no
      // depende del margen, así que no hace falta tocar nada más.
      const { error } = await svc.from('matches').update({ resultado }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // Cambió el ganador. Si el bracket no es round robin, el ganador
    // anterior puede haber avanzado a la ronda siguiente — si esa ronda
    // ya se jugó, no se puede corregir a ciegas sin deshacer también
    // ese resultado (y los que dependan de él).
    let nextMatch: any = null
    if (bracketType !== 'round_robin') {
      const { data } = await svc
        .from('matches').select('id, estado')
        .eq('torneo_id', match.torneo_id).eq('bracket', 'main')
        .eq('ronda_numero', match.ronda_numero + 1).eq('posicion', Math.ceil(match.posicion / 2))
        .maybeSingle()
      nextMatch = data
      if (nextMatch?.estado === 'jugado') {
        return NextResponse.json({
          error: 'No se puede corregir — el equipo que había ganado ya jugó (y ganó o perdió) la siguiente ronda. Corregí primero el resultado de esa ronda.',
        }, { status: 409 })
      }
    }

    // Revertir el MMR que se había aplicado con el resultado anterior
    // (vive en `personajes`, no en `players` — ver aplicarMmrYGuardar).
    const { data: historial } = await svc.from('mmr_history').select('*').eq('match_id', id)
    for (const h of historial ?? []) {
      if (!h.personaje_id) continue
      const { data: p } = await svc.from('personajes').select('partidas_jugadas, partidas_ganadas').eq('id', h.personaje_id).single()
      if (!p) continue
      const partidas = Math.max(0, p.partidas_jugadas - 1)
      const ganadas = Math.max(0, p.partidas_ganadas - (h.gano ? 1 : 0))
      await svc.from('personajes').update({
        mmr: h.mmr_antes,
        partidas_jugadas: partidas,
        partidas_ganadas: ganadas,
        winrate: partidas > 0 ? Math.round((ganadas / partidas) * 100) : 0,
      }).eq('id', h.personaje_id)
    }
    await svc.from('mmr_history').delete().eq('match_id', id)

    // Aplicar el MMR del resultado corregido, y guardar el partido
    const guardarError = await aplicarMmrYGuardar(svc, id, match, ganador_id, perdedor_id, resultado)
    if (guardarError) return NextResponse.json({ error: guardarError }, { status: 500 })

    // Reemplazar al equipo que había avanzado por el ganador correcto
    if (nextMatch) {
      const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
      await svc.from('matches').update({ [field]: ganador_id }).eq('id', nextMatch.id)
    }

    return NextResponse.json({ ok: true })
  }

  /* ── Carga normal de un resultado nuevo ───────────────────────── */
  const guardarError = await aplicarMmrYGuardar(svc, id, match, ganador_id, perdedor_id, resultado)
  if (guardarError) return NextResponse.json({ error: guardarError }, { status: 500 })

  if (bracketType === 'double_elimination') {
    await avanzarEliminacionDoble(svc, match, ganador_id, perdedor_id)
  } else if (bracketType !== 'round_robin') {
    // Eliminación simple: el ganador avanza a la ronda siguiente. Round
    // Robin no tiene avance — cada partido es independiente.
    const { data: nextMatch } = await svc
      .from('matches')
      .select('id, equipo_a_id, equipo_b_id')
      .eq('torneo_id', match.torneo_id)
      .eq('bracket', 'main')
      .eq('ronda_numero', match.ronda_numero + 1)
      .eq('posicion', Math.ceil(match.posicion / 2))
      .maybeSingle()

    if (nextMatch) {
      const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
      await svc.from('matches').update({ [field]: ganador_id }).eq('id', nextMatch.id)
    } else {
      // No hay ronda siguiente — este era el partido final del torneo.
      await svc.from('tournaments').update({ estado: 'finalizado' }).eq('id', match.torneo_id)
    }
  }

  return NextResponse.json({ ok: true })
}

/** Aplica el delta de MMR a los jugadores de ambos equipos y guarda el
 *  resultado del partido. Compartido entre la carga normal y la edición.
 *  Devuelve un mensaje de error si la escritura del partido falla, o
 *  null si salió todo bien. */
async function aplicarMmrYGuardar(supabase: any, matchId: string, match: any, ganador_id: string, perdedor_id: string, resultado: string): Promise<string | null> {
  // El MMR que se muestra en el Ranking y en el perfil de cada
  // jugador vive en `personajes` (un jugador puede tener varios
  // personajes) — no en `players`. Hay que actualizar el personaje
  // con el que jugó cada uno (team_members.personaje_id), no el
  // jugador en general.
  const { data: ganadores } = await supabase.from('team_members').select('player_id, personaje_id, personajes(mmr, partidas_jugadas, partidas_ganadas, winstreak)').eq('team_id', ganador_id)
  const { data: perdedores } = await supabase.from('team_members').select('player_id, personaje_id, personajes(mmr, partidas_jugadas, partidas_ganadas, winstreak)').eq('team_id', perdedor_id)

  const allUpdates: PromiseLike<any>[] = []
  const historyInserts: any[] = []

  const processPlayer = (member: any, gano: boolean, opponentAvgMmr: number) => {
    const p = member.personajes
    if (!p || !member.personaje_id) return
    const k = p.partidas_jugadas >= ELO_VETERAN_THRESHOLD ? ELO_K_VETERAN : ELO_K_DEFAULT
    const esperado = calcularEsperado(p.mmr, opponentAvgMmr)
    const nuevoMmr = Math.max(100, calcularNuevoMMR(p.mmr, gano, esperado, k))
    const nuevasPartidas = p.partidas_jugadas + 1
    const nuevasGanadas = p.partidas_ganadas + (gano ? 1 : 0)
    const nuevoWinrate = Math.round((nuevasGanadas / nuevasPartidas) * 100)
    const nuevoWinstreak = gano ? (p.winstreak ?? 0) + 1 : 0

    allUpdates.push(
      supabase.from('personajes').update({
        mmr: nuevoMmr,
        partidas_jugadas: nuevasPartidas,
        partidas_ganadas: nuevasGanadas,
        winrate: nuevoWinrate,
        winstreak: nuevoWinstreak,
      }).eq('id', member.personaje_id)
    )

    historyInserts.push({
      player_id: member.player_id,
      personaje_id: member.personaje_id,
      match_id: matchId,
      torneo_id: match.torneo_id,
      mmr_antes: p.mmr,
      mmr_despues: nuevoMmr,
      gano,
    })
  }

  const avgMmrGanadores = ganadores && ganadores.length > 0
    ? ganadores.reduce((s: number, m: any) => s + (m.personajes?.mmr ?? 1200), 0) / ganadores.length
    : 1200

  const avgMmrPerdedores = perdedores && perdedores.length > 0
    ? perdedores.reduce((s: number, m: any) => s + (m.personajes?.mmr ?? 1200), 0) / perdedores.length
    : 1200

  ganadores?.forEach((m: any) => processPlayer(m, true, avgMmrPerdedores))
  perdedores?.forEach((m: any) => processPlayer(m, false, avgMmrGanadores))

  const matchUpdate = supabase.from('matches').update({ ganador_id, estado: 'jugado', resultado }).eq('id', matchId)

  const results = await Promise.all([
    ...allUpdates,
    supabase.from('mmr_history').insert(historyInserts),
    matchUpdate,
  ])

  return results[results.length - 1]?.error?.message ?? null
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
