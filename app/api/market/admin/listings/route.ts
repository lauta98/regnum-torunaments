import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

async function isAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return !!data?.is_admin
}

const CAMPOS_EDITABLES = ['item_name', 'description', 'price_gold', 'price_money', 'currency_label', 'status'] as const

export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Sin permisos' }, { status: 403 })

  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (q.trim().length < 2) return Response.json({ listings: [] })

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, item_name, item_category, type, status, price_gold, price_money, currency_label, user_id, created_at')
    .ilike('item_name', `%${q.trim()}%`)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) return Response.json({ error: error.message }, { status: 400 })

  const sellerIds = [...new Set((listings ?? []).map(l => l.user_id).filter(Boolean))]
  const { data: sellers } = sellerIds.length
    ? await supabase.from('profiles').select('id, username').in('id', sellerIds)
    : { data: [] }

  const enriched = (listings ?? []).map(l => ({ ...l, seller: sellers?.find(s => s.id === l.user_id) }))
  return Response.json({ listings: enriched })
}

export async function PATCH(req: Request) {
  const supabase = await createServerSupabase()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return Response.json({ error: 'id requerido' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in rest) patch[campo] = rest[campo]
  }
  if (Object.keys(patch).length === 0) return Response.json({ error: 'Nada para actualizar' }, { status: 400 })

  const svc = createServiceSupabase()
  const { error } = await svc.from('listings').update(patch).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createServerSupabase()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return Response.json({ error: 'id requerido' }, { status: 400 })

  const svc = createServiceSupabase()
  const { error } = await svc.from('listings').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}
