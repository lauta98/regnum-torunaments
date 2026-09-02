import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { canAdmin } from '@/lib/roles'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: caller } = await supabase.from('players').select('role').eq('user_id', user.id).single()
    if (!caller || !canAdmin(caller.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { highlightId, accion } = await req.json()
    if (!highlightId || (accion !== 'quitar' && accion !== 'descartar')) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const service = createServiceSupabase()

    // "Quitar" borra el post entero; "descartar" solo limpia el reporte,
    // el contenido se queda — mismo criterio que resolver-avatar.
    if (accion === 'quitar') {
      const { error } = await service.from('highlights').delete().eq('id', highlightId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await service.from('highlights').update({ reportado: false, reporte_motivo: null }).eq('id', highlightId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
