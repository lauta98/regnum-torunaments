import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { canAdmin, isSuperAdmin } from '@/lib/roles'
import type { UserRole } from '@/lib/types'

const VALID_ROLES: UserRole[] = ['player', 'organizer', 'admin']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    /* ── 1. Verificar sesión del caller ─────────────────────── */
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from('players')
      .select('id, nickname_juego, role')
      .eq('user_id', user.id)
      .single()

    if (!caller || !canAdmin(caller.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    /* ── 2. Parsear body ────────────────────────────────────── */
    const { targetId, newRole } = await req.json()

    if (!targetId || !newRole || !VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    /* ── 3. Obtener el jugador objetivo ─────────────────────── */
    const { data: target } = await supabase
      .from('players')
      .select('id, nickname_juego, role')
      .eq('id', targetId)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    /* ── 4. Protecciones inamovibles ────────────────────────── */

    // No puede modificarse a sí mismo
    if (target.id === caller.id) {
      return NextResponse.json({ error: 'No podés cambiar tu propio rol' }, { status: 403 })
    }

    // Super admins son intocables — ni siquiera otro admin puede degradarlos
    if (isSuperAdmin(target.nickname_juego)) {
      return NextResponse.json(
        { error: `${target.nickname_juego} es un administrador permanente y no puede ser modificado` },
        { status: 403 }
      )
    }

    /* ── 5. Aplicar cambio ──────────────────────────────────── */
    // Con service role: la política de RLS de `players` solo deja a cada
    // usuario editar su propia fila, así que un admin cambiándole el rol
    // a OTRO jugador necesita saltear RLS acá.
    const { error } = await createServiceSupabase()
      .from('players')
      .update({ role: newRole })
      .eq('id', targetId)

    if (error) {
      console.error('set-role error:', error)
      return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, newRole })

  } catch (err) {
    console.error('set-role unexpected error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
