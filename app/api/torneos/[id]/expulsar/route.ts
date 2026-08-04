import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: player } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!player) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: torneo } = await supabase.from('tournaments').select('creator_id').eq('id', torneoId).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

  const esOrganizador = torneo.creator_id === player.id || player.role === 'admin'
  if (!esOrganizador) return NextResponse.json({ error: 'Sin permisos sobre este torneo' }, { status: 403 })

  const body = await request.json()
  const { team_id, motivo } = body as { team_id: string; motivo: string }
  if (!team_id) return NextResponse.json({ error: 'team_id requerido' }, { status: 400 })
  if (!motivo || !motivo.trim()) return NextResponse.json({ error: 'El motivo es obligatorio' }, { status: 400 })

  const { data: registro } = await supabase
    .from('tournament_registrations')
    .select('team_id, estado')
    .eq('tournament_id', torneoId)
    .eq('team_id', team_id)
    .single()

  if (!registro) return NextResponse.json({ error: 'Ese equipo no está inscripto en este torneo' }, { status: 404 })
  if (registro.estado === 'expulsado') return NextResponse.json({ error: 'Ya estaba expulsado' }, { status: 409 })

  const { error: updErr } = await supabase
    .from('tournament_registrations')
    .update({
      estado: 'expulsado',
      motivo_expulsion: motivo.trim(),
      expulsado_por: player.id,
      expulsado_at: new Date().toISOString(),
    })
    .eq('tournament_id', torneoId)
    .eq('team_id', team_id)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // Si el torneo ya tiene cuadro armado, forfeit de cualquier partido
  // pendiente donde este equipo participe — gana el rival automáticamente.
  const { data: pendientes } = await supabase
    .from('matches')
    .select('*')
    .eq('torneo_id', torneoId)
    .eq('estado', 'pendiente')
    .or(`equipo_a_id.eq.${team_id},equipo_b_id.eq.${team_id}`)

  for (const match of pendientes ?? []) {
    const rival = match.equipo_a_id === team_id ? match.equipo_b_id : match.equipo_a_id
    if (!rival) continue // el otro lado todavía es TBD, no se puede resolver el forfeit todavía

    await supabase.from('matches').update({
      ganador_id: rival,
      estado: 'jugado',
      resultado: 'W.O. (expulsión)',
    }).eq('id', match.id)

    // Avanzar al rival a la siguiente ronda, igual que un resultado normal
    const { data: nextMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('torneo_id', torneoId)
      .eq('bracket', match.bracket)
      .eq('ronda_numero', match.ronda_numero + 1)
      .eq('posicion', Math.ceil(match.posicion / 2))
      .single()

    if (nextMatch) {
      const field = match.posicion % 2 === 1 ? 'equipo_a_id' : 'equipo_b_id'
      await supabase.from('matches').update({ [field]: rival }).eq('id', nextMatch.id)
    }
  }

  return NextResponse.json({ ok: true })
}
