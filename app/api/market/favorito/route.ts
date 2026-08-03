import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { listing_id } = await req.json()
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listing_id)
    .maybeSingle()

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
    return Response.json({ favorito: false })
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, listing_id })
    return Response.json({ favorito: true })
  }
}
