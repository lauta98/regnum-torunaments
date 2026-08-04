import { createServerSupabase } from '@/lib/supabase-server'

// GET: obtener notificaciones del usuario
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    return Response.json({ notifications: notifications ?? [] })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PATCH: marcar notificaciones como leídas
export async function PATCH(req: Request) {
  try {
    const { ids } = await req.json() // array de ids, o vacío para marcar todas
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    let query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)

    if (ids?.length) {
      query = query.in('id', ids)
    } else {
      query = query.eq('read', false)
    }

    await query
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
