import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/** Borra un partido pendiente (sin resultado) directo, o revierte uno ya
 *  jugado (deshace el mmr aplicado y lo deja en pendiente otra vez, sin
 *  sacarlo de la llave — sacarlo rompería la posicion/ronda_numero que
 *  usa el resto del bracket). Misma logica de reversion de mmr que
 *  "corregir resultado" en /api/matches/[id]/result, asi que si el
 *  ganador ya avanzo a una ronda que ya se jugo, se bloquea. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: player } = await supabase.from('players').select('role').eq('user_id', user.id).single()
  if (!player || !['organizer', 'admin'].includes(player.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const svc = createServiceSupabase()
  const { data: match } = await svc.from('matches').select('*').eq('id', id).single()
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  if (match.estado === 'pendiente') {
    const { error } = await svc.from('matches').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, accion: 'borrado' })
  }

  const { data: torneo } = await svc.from('tournaments').select('bracket_type').eq('id', match.torneo_id).single()
  const bracketType = torneo?.bracket_type ?? 'single_elimination'
  if (bracketType === 'double_elimination') {
    return NextResponse.json({
      error: 'Revertir resultados en eliminación doble todavía no está soportado — avisale al desarrollador para arreglarlo a mano.',
    }, { status: 400 })
  }

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
        error: 'No se puede revertir — el equipo que había ganado ya jugó (y ganó o perdió) la siguiente ronda. Revertí primero el resultado de esa ronda.',
      }, { status: 409 })
    }
  }

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

  if (nextMatch) {
    const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
    await svc.from('matches').update({ [field]: null }).eq('id', nextMatch.id)
  }

  const { error } = await svc.from('matches').update({
    ganador_id: null, resultado: null, estado: 'pendiente',
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, accion: 'revertido' })
}
