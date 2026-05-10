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

  const perdedor_id = ganador_id === match.equipo_a_id ? match.equipo_b_id : match.equipo_a_id

  // Get players from both teams
  const { data: ganadores } = await supabase.from('team_members').select('player_id, players(mmr_global, partidas_jugadas, partidas_ganadas)').eq('team_id', ganador_id)
  const { data: perdedores } = await supabase.from('team_members').select('player_id, players(mmr_global, partidas_jugadas, partidas_ganadas)').eq('team_id', perdedor_id)

  const allUpdates: Promise<any>[] = []
  const historyInserts: any[] = []

  const processPlayer = (member: any, gano: boolean, opponentAvgMmr: number) => {
    const p = member.players
    if (!p) return
    const k = p.partidas_jugadas >= ELO_VETERAN_THRESHOLD ? ELO_K_VETERAN : ELO_K_DEFAULT
    const esperado = calcularEsperado(p.mmr_global, opponentAvgMmr)
    const nuevoMmr = Math.max(100, calcularNuevoMMR(p.mmr_global, gano, esperado, k))
    const delta = nuevoMmr - p.mmr_global
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

  // Advance winner to next match if exists
  const { data: nextMatch } = await supabase
    .from('matches')
    .select('id, equipo_a_id, equipo_b_id')
    .eq('torneo_id', match.torneo_id)
    .eq('ronda_numero', match.ronda_numero + 1)
    .eq('posicion', Math.ceil(match.posicion / 2))
    .single()

  if (nextMatch) {
    const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
    await supabase.from('matches').update({ [field]: ganador_id }).eq('id', nextMatch.id)
  }

  return NextResponse.json({ ok: true })
}
