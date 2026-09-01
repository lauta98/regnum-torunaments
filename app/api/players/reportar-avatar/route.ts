import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { targetId, motivo } = await req.json()
    if (!targetId || !motivo?.trim()) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

    const { data: reporter } = await supabase.from('players').select('id').eq('user_id', user.id).single()
    if (reporter?.id === targetId) {
      return NextResponse.json({ error: 'No podés reportar tu propia foto' }, { status: 403 })
    }

    // Service role: se está tocando la fila de OTRO jugador (marcarla como
    // reportada), no la propia — players_update_own no alcanza acá.
    const { error } = await createServiceSupabase()
      .from('players')
      .update({ avatar_reportado: true, avatar_reporte_motivo: motivo.trim() })
      .eq('id', targetId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
