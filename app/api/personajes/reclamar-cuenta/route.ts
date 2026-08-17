import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Permite a un usuario recien logueado con Discord "reclamar" un personaje
// fantasma (cargado retroactivamente desde un torneo historico, sin cuenta
// vinculada) que coincide con el nickname que quiere usar. Solo aplica a
// personajes NO verificados y cuyo player todavia no tiene user_id — un
// admin revisa despues via el toggle de verificacion.
export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { personajeId, reino, clase, nickname } = await req.json()
  if (!personajeId) return NextResponse.json({ error: 'Falta personajeId' }, { status: 400 })

  const svc = createServiceSupabase()

  const { data: cuentaPropia } = await supabase.from('players').select('id').eq('user_id', user.id).single()

  const { data: personaje } = await svc
    .from('personajes')
    .select('id, verificado, player_id, players(user_id)')
    .eq('id', personajeId)
    .single()

  if (!personaje) return NextResponse.json({ error: 'Personaje no encontrado' }, { status: 404 })
  if (personaje.verificado) return NextResponse.json({ error: 'Ese personaje ya está verificado, no se puede reclamar' }, { status: 409 })
  const fantasma = Array.isArray(personaje.players) ? personaje.players[0] : personaje.players
  if (fantasma?.user_id) return NextResponse.json({ error: 'Ese personaje ya tiene una cuenta vinculada' }, { status: 409 })

  let playerIdFinal: string
  if (cuentaPropia) {
    // El usuario ya tiene cuenta (agregando un personaje mas): se reasigna el
    // personaje a su player_id existente. El players fantasma original queda
    // huerfano pero intacto — mmr_history/team_members siguen resolviendo
    // por personaje_id, no por ese player_id, asi que no se pierde historial.
    const { error: reasignErr } = await svc.from('personajes').update({ player_id: cuentaPropia.id }).eq('id', personajeId)
    if (reasignErr) return NextResponse.json({ error: reasignErr.message }, { status: 500 })
    playerIdFinal = cuentaPropia.id
  } else {
    // Primer login: se vincula el players fantasma directamente a este usuario.
    const meta = user.user_metadata
    const { error: linkErr } = await svc
      .from('players')
      .update({
        user_id: user.id,
        discord_username: meta?.full_name || meta?.name,
        discord_avatar: meta?.avatar_url,
      })
      .eq('id', personaje.player_id)
    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })
    playerIdFinal = personaje.player_id
  }

  const updates: Record<string, string> = {}
  if (nickname?.trim()) updates.nickname_juego = nickname.trim()
  if (reino) updates.reino = reino
  if (clase) updates.clase = clase
  if (Object.keys(updates).length > 0) {
    await svc.from('personajes').update(updates).eq('id', personajeId)
  }

  return NextResponse.json({ ok: true, playerId: playerIdFinal })
}
