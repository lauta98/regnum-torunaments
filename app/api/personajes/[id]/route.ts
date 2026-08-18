import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { canAdmin } from '@/lib/roles'

const CAMPOS_EDITABLES = [
  'nickname_juego', 'reino', 'clase', 'mmr', 'partidas_jugadas',
  'partidas_ganadas', 'winstreak', 'verificado',
] as const

async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }
  const { data: me } = await supabase.from('players').select('role').eq('user_id', user.id).single()
  if (!me || !canAdmin(me.role)) return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) }
  return { error: null }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const body = await req.json()
  const patch: Record<string, unknown> = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in body) patch[campo] = body[campo]
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })

  if ('partidas_jugadas' in patch || 'partidas_ganadas' in patch) {
    const svc = createServiceSupabase()
    const { data: actual } = await svc.from('personajes').select('partidas_jugadas, partidas_ganadas').eq('id', id).single()
    const pj = (patch.partidas_jugadas as number) ?? actual?.partidas_jugadas ?? 0
    const pg = (patch.partidas_ganadas as number) ?? actual?.partidas_ganadas ?? 0
    patch.winrate = pj > 0 ? Math.round((pg / pj) * 100) : 0
  }

  const svc = createServiceSupabase()
  const { data: personaje, error } = await svc.from('personajes').update(patch).eq('id', id).select().single()
  if (error) {
    const msg = error.code === '23505' ? 'Ya existe otro personaje con ese nickname.' : error.message
    return NextResponse.json({ error: msg }, { status: error.code === '23505' ? 409 : 500 })
  }
  return NextResponse.json({ ok: true, personaje })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const svc = createServiceSupabase()
  const { data: personaje } = await svc.from('personajes').select('id, nickname_juego, partidas_jugadas').eq('id', id).single()
  if (!personaje) return NextResponse.json({ error: 'Personaje no encontrado' }, { status: 404 })

  // Igual que con torneos: si ya jugó partidos, borrarlo se lleva puesto
  // el mmr_history (cascade) sin revertir el mmr del rival que le ganó
  // o perdió contra él. Para eso hace falta el flujo de "revertir
  // partido" uno por uno, no un borrado directo de personaje.
  if (personaje.partidas_jugadas > 0) {
    return NextResponse.json({
      error: `"${personaje.nickname_juego}" ya jugó ${personaje.partidas_jugadas} partido(s). Borrarlo dejaría el mmr de sus rivales sin revertir. Revertí sus partidos primero desde la llave del torneo.`,
    }, { status: 400 })
  }

  const { error } = await svc.from('personajes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
