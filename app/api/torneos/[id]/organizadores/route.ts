import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Gestionar quién es co-organizador de un torneo es una acción reservada
// al creador/admin — a propósito NO se usa `esOrganizadorDelTorneo` acá
// (que sí incluye a los co-organizadores): un co-organizador no puede
// agregar ni quitar a otro, solo el dueño del torneo o un admin.
async function puedeGestionar(req: Request, torneoId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, error: 'No autenticado' }

  const { data: me } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!me) return { ok: false as const, status: 403, error: 'Sin permisos' }

  const { data: torneo } = await supabase.from('tournaments').select('creator_id').eq('id', torneoId).single()
  if (!torneo) return { ok: false as const, status: 404, error: 'Torneo no encontrado' }

  const puede = torneo.creator_id === me.id || me.role === 'admin'
  if (!puede) return { ok: false as const, status: 403, error: 'Sin permisos sobre este torneo' }

  return { ok: true as const }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const check = await puedeGestionar(req, torneoId)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const { player_id } = await req.json() as { player_id?: string }
  if (!player_id) return NextResponse.json({ error: 'player_id requerido' }, { status: 400 })

  const svc = createServiceSupabase()
  const { error } = await svc.from('tournament_organizers').insert({ tournament_id: torneoId, player_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const check = await puedeGestionar(req, torneoId)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const { player_id } = await req.json() as { player_id?: string }
  if (!player_id) return NextResponse.json({ error: 'player_id requerido' }, { status: 400 })

  const svc = createServiceSupabase()
  const { error } = await svc.from('tournament_organizers').delete().eq('tournament_id', torneoId).eq('player_id', player_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
