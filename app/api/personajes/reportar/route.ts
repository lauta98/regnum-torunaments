import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { personajeId, motivo } = await req.json()
    if (!personajeId || !motivo?.trim()) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

    const { data: reporter } = await supabase.from('players').select('id').eq('user_id', user.id).single()

    const { error } = await supabase.from('nickname_reports').insert({
      reporter_id:  reporter?.id ?? null,
      personaje_id: personajeId,
      motivo:       motivo.trim(),
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
