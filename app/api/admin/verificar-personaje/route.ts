import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { canAdmin } from '@/lib/roles'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: caller } = await supabase.from('players').select('role').eq('user_id', user.id).single()
    if (!caller || !canAdmin(caller.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const { personajeId, verificado } = await req.json()
    if (!personajeId || typeof verificado !== 'boolean') return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

    const { error } = await supabase.from('personajes').update({ verificado }).eq('id', personajeId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
