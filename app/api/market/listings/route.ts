import { createServerSupabase } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

const PAGE_SIZE = 24

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const supabase = await createServerSupabase()

  const q        = searchParams.get('q')        || ''
  const sort     = searchParams.get('sort')     || 'newest'
  const clase    = searchParams.get('clase')    || ''
  const rareza   = searchParams.get('rareza')   || ''
  const mod      = searchParams.get('mod')      || ''
  const tipo     = searchParams.get('tipo')     || ''
  const cat      = searchParams.get('cat')      || ''
  const subcat   = searchParams.get('subcat')   || ''
  const reino    = searchParams.get('reino')    || ''
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const precioMin = searchParams.get('precio_min') ? parseInt(searchParams.get('precio_min')!) : null
  const precioMax = searchParams.get('precio_max') ? parseInt(searchParams.get('precio_max')!) : null
  const danoMin   = searchParams.get('dano_min')   ? parseInt(searchParams.get('dano_min')!)   : null

  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('listings')
    .select('*, profiles(username, avg_rating, total_reviews, last_sign_in_at)', { count: 'exact' })
    .eq('status', 'active')
    .range(from, to)
    .order('featured', { ascending: false, nullsFirst: false })

  if (sort === 'price_asc')  query = query.order('price_gold', { ascending: true,  nullsFirst: false })
  else if (sort === 'price_desc') query = query.order('price_gold', { ascending: false, nullsFirst: false })
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true })
  else query = query.order('created_at', { ascending: false })

  if (tipo  && tipo  !== 'all') query = query.eq('type', tipo)
  if (cat   && cat   !== 'all') query = query.eq('item_category', cat)
  if (subcat && subcat !== 'all') query = query.eq('subcategoria', subcat)
  if (reino && reino !== 'all') query = query.eq('reino', reino)
  if (q) query = query.ilike('item_name', `%${q}%`)
  if (clase && clase !== 'all') query = query.or(`clase_requerida.eq.todas,clase_requerida.eq.${clase}`)
  if (rareza && rareza !== 'all') query = query.eq('rareza', rareza)
  if (precioMin !== null) query = query.gte('price_gold', precioMin)
  if (precioMax !== null) query = query.or(`price_gold.is.null,price_gold.lte.${precioMax}`)
  if (danoMin !== null) query = query.gte('dano_min_1', danoMin)
  if (mod) {
    const m = `%${mod}%`
    query = query.or(`slot_1.ilike.${m},slot_2.ilike.${m},slot_3.ilike.${m},slot_4.ilike.${m},slot_5.ilike.${m}`)
  }

  const { data, count } = await query
  return Response.json({ listings: data || [], count: count || 0 })
}
