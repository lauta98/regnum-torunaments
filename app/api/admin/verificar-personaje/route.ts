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

    const { personajeId, verificado, reportId } = await req.json()
    if (!personajeId || typeof verificado !== 'boolean' || !reportId) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

    // Service role para ambos updates: la política de RLS de `personajes`
    // solo deja a cada jugador editar sus propios personajes, y
    // `nickname_reports` no tiene ninguna política de UPDATE para usuarios
    // autenticados.
    const service = createServiceSupabase()

    const { error } = await service.from('personajes').update({ verificado }).eq('id', personajeId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Saca el reporte de la cola de "pendientes" del panel — sin esto el
    // reporte queda pegado ahí para siempre aunque el personaje ya se haya
    // revisado (mismo bug de nickname_reports.estado que resolver-reclamo).
    const { error: reportError } = await service
      .from('nickname_reports')
      .update({ estado: 'resuelto' })
      .eq('id', reportId)
      .eq('tipo', 'reporte')
    if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
