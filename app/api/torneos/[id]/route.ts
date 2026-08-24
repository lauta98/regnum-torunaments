import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { canAdmin, canOrganize } from '@/lib/roles'

// Campos que puede tocar el organizador dueño del torneo. La transición de
// estado tiene sus propios flujos dedicados (AbrirInscripcionesButton,
// generar-bracket, finalizar) — no se expone acá para no pisarlos.
const CAMPOS_EDITABLES_ORGANIZADOR = [
  'nombre', 'descripcion', 'formato', 'fecha_inicio', 'fecha_fin',
  'premio', 'max_equipos', 'reglamento', 'subclases_permitidas',
] as const

// Campos de prestigio/curación editorial — solo un admin los toca, sin
// importar quién creó el torneo.
const CAMPOS_EDITABLES_ADMIN = ['destacado', 'organizador_verificado'] as const

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: me } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
  if (!me) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: torneoActual } = await supabase.from('tournaments').select('creator_id').eq('id', torneoId).single()
  if (!torneoActual) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

  const esDueño = canOrganize(me.role) && torneoActual.creator_id === me.id
  const esAdmin = canAdmin(me.role)
  if (!esDueño && !esAdmin) return NextResponse.json({ error: 'Sin permisos sobre este torneo' }, { status: 403 })

  const body = await req.json()
  const patch: Record<string, unknown> = {}
  for (const campo of CAMPOS_EDITABLES_ORGANIZADOR) {
    if (campo in body) patch[campo] = body[campo]
  }
  if (esAdmin) {
    for (const campo of CAMPOS_EDITABLES_ADMIN) {
      if (campo in body) patch[campo] = body[campo]
    }
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })

  const svc = createServiceSupabase()
  const { data: torneo, error } = await svc.from('tournaments').update(patch).eq('id', torneoId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, torneo })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: torneoId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: me } = await supabase.from('players').select('role').eq('user_id', user.id).single()
  if (!me || !canAdmin(me.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const svc = createServiceSupabase()
  const { data: torneo } = await svc.from('tournaments').select('id, nombre').eq('id', torneoId).single()
  if (!torneo) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

  // No se borra un torneo con partidos jugados: el mmr/pj/pg de los
  // personajes ya quedó grabado en sus filas (no se recalcula solo desde
  // mmr_history), asi que borrar dejaria esas estadisticas infladas sin
  // forma de revertirlas automaticamente.
  const { count: jugados } = await svc
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('torneo_id', torneoId)
    .eq('estado', 'jugado')
  if ((jugados ?? 0) > 0) {
    return NextResponse.json({
      error: `Este torneo tiene ${jugados} partido(s) jugado(s). Borrarlo dejaria el mmr/estadisticas de los jugadores desactualizados sin revertir. No se puede eliminar desde aca.`,
    }, { status: 400 })
  }

  const { data: registros } = await svc.from('tournament_registrations').select('team_id').eq('tournament_id', torneoId)
  const { data: matches } = await svc.from('matches').select('equipo_a_id, equipo_b_id').eq('torneo_id', torneoId)
  const teamIds = new Set<string>()
  registros?.forEach(r => r.team_id && teamIds.add(r.team_id))
  matches?.forEach(m => { if (m.equipo_a_id) teamIds.add(m.equipo_a_id); if (m.equipo_b_id) teamIds.add(m.equipo_b_id) })

  const { error: delErr } = await svc.from('tournaments').delete().eq('id', torneoId)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Los equipos no tienen torneo_id propio: se limpian aparte, solo si no
  // quedaron referenciados por partidos/inscripciones de otro torneo.
  if (teamIds.size > 0) {
    const ids = [...teamIds]
    const [{ data: comoA }, { data: comoB }, { data: enInscripciones }] = await Promise.all([
      svc.from('matches').select('equipo_a_id').in('equipo_a_id', ids),
      svc.from('matches').select('equipo_b_id').in('equipo_b_id', ids),
      svc.from('tournament_registrations').select('team_id').in('team_id', ids),
    ])
    const enUso = new Set<string>()
    comoA?.forEach((m: any) => m.equipo_a_id && enUso.add(m.equipo_a_id))
    comoB?.forEach((m: any) => m.equipo_b_id && enUso.add(m.equipo_b_id))
    enInscripciones?.forEach((r: any) => r.team_id && enUso.add(r.team_id))
    const huerfanos = ids.filter(id => !enUso.has(id))
    if (huerfanos.length > 0) await svc.from('teams').delete().in('id', huerfanos)
  }

  return NextResponse.json({ ok: true, nombre: torneo.nombre })
}
