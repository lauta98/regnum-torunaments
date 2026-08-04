import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const body = await req.json()

  // Verificar identidad del usuario via sesión
  const authClient = await createServerSupabase()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  // Usar service role para el update (bypasea RLS, ya verificamos el usuario arriba)
  const supabase = createServiceSupabase()

  const { regnum_nick, discord, whatsapp, bio, banner_url, avatar_url, name_color, servidor } = body

  // name_color y avatar_url solo disponibles para premium
  let extraFields: Record<string, any> = {}
  if (name_color !== undefined || avatar_url !== undefined) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()
    if (profile?.is_premium) {
      if (name_color !== undefined) extraFields.name_color = name_color || null
      if (avatar_url !== undefined) extraFields.avatar_url = avatar_url || null
    }
  }

  // Si solo se actualiza el avatar (llamada rápida desde upload), actualizar solo eso
  if (avatar_url !== undefined && Object.keys(body).length === 1) {
    const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
    if (profile?.is_premium) {
      await supabase.from('profiles').update({ avatar_url: avatar_url || null }).eq('id', user.id)
    }
    return Response.json({ ok: true })
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      regnum_nick: regnum_nick || null,
      discord: discord || null,
      whatsapp: whatsapp || null,
      bio: bio || null,
      banner_url: banner_url || null,
      servidor: ['Ra', 'Amun'].includes(servidor) ? servidor : 'Ra',
      ...extraFields,
    })
    .eq('id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}
