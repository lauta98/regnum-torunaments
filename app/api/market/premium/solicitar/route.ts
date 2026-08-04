import { createServerSupabase } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  // Verificar que no tenga premium activo
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, premium_until')
    .eq('id', user.id)
    .single()

  if (profile?.is_premium && profile?.premium_until && new Date(profile.premium_until) > new Date()) {
    return Response.json({ error: 'Ya tenés premium activo' }, { status: 400 })
  }

  // Verificar que no tenga solicitud pendiente
  const { data: existing } = await supabase
    .from('premium_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single()

  if (existing) return Response.json({ ok: true, already: true })

  const { error } = await supabase
    .from('premium_requests')
    .insert({ user_id: user.id })

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}
