import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { personajeId, motivo } = await req.json()
  if (!personajeId || !motivo?.trim())
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  // Obtener el player del usuario actual
  const { data: claimer } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!claimer)
    return NextResponse.json({ error: 'Completá tu perfil antes de reclamar' }, { status: 403 })

  // Verificar que el personaje no le pertenezca ya al claimer
  const { data: personaje } = await supabase
    .from('personajes')
    .select('id, player_id')
    .eq('id', personajeId)
    .single()

  if (!personaje)
    return NextResponse.json({ error: 'Personaje no encontrado' }, { status: 404 })

  if (personaje.player_id === claimer.id)
    return NextResponse.json({ error: 'Este personaje ya te pertenece' }, { status: 400 })

  // Verificar que no haya un reclamo pendiente del mismo usuario para este personaje
  const { data: existente } = await supabase
    .from('nickname_reports')
    .select('id')
    .eq('personaje_id', personajeId)
    .eq('claimer_id', claimer.id)
    .eq('estado', 'pendiente')
    .eq('tipo', 'reclamo')
    .single()

  if (existente)
    return NextResponse.json({ error: 'Ya tenés un reclamo pendiente para este personaje' }, { status: 409 })

  const { error } = await supabase.from('nickname_reports').insert({
    personaje_id: personajeId,
    reporter_id:  claimer.id,
    claimer_id:   claimer.id,
    motivo:       motivo.trim(),
    tipo:         'reclamo',
    estado:       'pendiente',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
