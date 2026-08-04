import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json([], { status: 401 })
  const { data } = await supabase.from('watchlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return Response.json(data || [])
}

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  if (body.delete_id) {
    await supabase.from('watchlist').delete().eq('id', body.delete_id).eq('user_id', user.id)
    return Response.json({ ok: true })
  }

  const { categoria, rareza, tipo, keyword } = body
  if (!categoria) return Response.json({ error: 'Categoría requerida' }, { status: 400 })

  const { data, error } = await supabase.from('watchlist').insert({
    user_id: user.id, categoria,
    rareza: rareza || null, tipo: tipo || 'any', keyword: keyword || null,
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}
