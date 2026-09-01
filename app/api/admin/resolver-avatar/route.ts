import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { canAdmin } from '@/lib/roles'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from('players')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!caller || !canAdmin(caller.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { targetId, accion } = await req.json()
    if (!targetId || (accion !== 'quitar' && accion !== 'descartar')) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const service = createServiceSupabase()
    const { data: target } = await service
      .from('players')
      .select('id, avatar_reportado')
      .eq('id', targetId)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }
    if (!target.avatar_reportado) {
      return NextResponse.json({ error: 'Este reporte ya fue revisado' }, { status: 409 })
    }

    // "Quitar" borra la foto (vuelve al avatar de Discord) además de
    // limpiar el reporte; "descartar" solo limpia el reporte, la foto
    // se queda como estaba.
    const { error } = await service
      .from('players')
      .update(
        accion === 'quitar'
          ? { avatar_url: null, avatar_reportado: false, avatar_reporte_motivo: null }
          : { avatar_reportado: false, avatar_reporte_motivo: null }
      )
      .eq('id', targetId)

    if (error) {
      console.error('resolver-avatar error:', error)
      return NextResponse.json({ error: 'Error al aplicar el cambio' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('resolver-avatar unexpected error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
