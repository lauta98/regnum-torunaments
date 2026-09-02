import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { highlightId, motivo } = await req.json()
    if (!highlightId || !motivo?.trim()) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

    const { data: reporter } = await supabase.from('players').select('id').eq('user_id', user.id).single()
    const { data: highlight } = await supabase.from('highlights').select('jugador_id').eq('id', highlightId).single()
    if (reporter?.id === highlight?.jugador_id) {
      return NextResponse.json({ error: 'No podés reportar tu propio contenido' }, { status: 403 })
    }

    // Service role: se toca la fila de OTRO jugador (marcarla como
    // reportada), no la propia — highlights_delete_own no cubre esto.
    const { error } = await createServiceSupabase()
      .from('highlights')
      .update({ reportado: true, reporte_motivo: motivo.trim() })
      .eq('id', highlightId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
