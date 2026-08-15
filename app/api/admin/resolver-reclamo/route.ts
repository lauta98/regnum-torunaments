import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { canAdmin } from '@/lib/roles'

export async function POST(req: Request) {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: me } = await supabase
    .from('players')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!me || !canAdmin(me.role))
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { reclamoId, accion } = await req.json()
  if (!reclamoId || !['transferir', 'rechazar'].includes(accion))
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  // Obtener el reclamo
  const { data: reclamo } = await supabase
    .from('nickname_reports')
    .select('id, personaje_id, claimer_id, estado')
    .eq('id', reclamoId)
    .eq('tipo', 'reclamo')
    .single()

  if (!reclamo)
    return NextResponse.json({ error: 'Reclamo no encontrado' }, { status: 404 })

  if (reclamo.estado !== 'pendiente')
    return NextResponse.json({ error: 'El reclamo ya fue resuelto' }, { status: 409 })

  // Service role para ambos updates: `personajes` solo deja a cada
  // jugador tocar sus propios personajes, y `nickname_reports` no tiene
  // ninguna política de UPDATE para usuarios autenticados (a propósito).
  const serviceSupabase = createServiceSupabase()

  if (accion === 'transferir') {
    if (!reclamo.claimer_id)
      return NextResponse.json({ error: 'No hay reclamante asociado' }, { status: 400 })

    // Transferir el personaje al reclamante
    const { error: transferErr } = await serviceSupabase
      .from('personajes')
      .update({ player_id: reclamo.claimer_id })
      .eq('id', reclamo.personaje_id)

    if (transferErr)
      return NextResponse.json({ error: transferErr.message }, { status: 500 })
  }

  // Marcar el reclamo como resuelto o rechazado
  const nuevoEstado = accion === 'transferir' ? 'resuelto' : 'rechazado'
  const { error: updateErr } = await serviceSupabase
    .from('nickname_reports')
    .update({ estado: nuevoEstado })
    .eq('id', reclamoId)

  if (updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, accion: nuevoEstado })
}
