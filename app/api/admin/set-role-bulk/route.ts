import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { canAdmin, isSuperAdmin } from '@/lib/roles'
import type { UserRole } from '@/lib/types'

const VALID_ROLES: UserRole[] = ['player', 'organizer', 'admin']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: caller } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
    if (!caller || !canAdmin(caller.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { targetIds, newRole } = await req.json()
    if (!Array.isArray(targetIds) || targetIds.length === 0 || !VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { data: targets } = await supabase.from('players').select('id, nickname_juego').in('id', targetIds)
    if (!targets) return NextResponse.json({ error: 'No se encontraron jugadores' }, { status: 404 })

    // Mismas protecciones que el cambio individual: nadie se modifica a sí
    // mismo, y los super admins son intocables aunque vengan en el lote.
    const aplicables = targets.filter(t => t.id !== caller.id && !isSuperAdmin(t.nickname_juego))
    const omitidos = targets.length - aplicables.length

    if (aplicables.length === 0) {
      return NextResponse.json({ error: 'Ningún jugador del lote se puede modificar (vos mismo o admins permanentes).' }, { status: 400 })
    }

    const { error } = await createServiceSupabase()
      .from('players')
      .update({ role: newRole })
      .in('id', aplicables.map(t => t.id))

    if (error) return NextResponse.json({ error: 'Error al actualizar roles' }, { status: 500 })

    return NextResponse.json({ ok: true, actualizados: aplicables.length, omitidos })
  } catch (err) {
    console.error('set-role-bulk unexpected error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
