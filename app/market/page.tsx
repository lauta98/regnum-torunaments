import { createServerSupabase } from '@/lib/supabase-server'
import ListingsGrid from '@/components/market/ListingsGrid'
import FilterBar from '@/components/market/FilterBar'
import FeaturedCarousel from '@/components/market/FeaturedCarousel'
import HeroSection from '@/components/market/HeroSection'
import ListingsCount from '@/components/market/ListingsCount'
import SkeletonGrid from '@/components/market/SkeletonGrid'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string; cat?: string; subcat?: string; reino?: string
    page?: string; q?: string; sort?: string; clase?: string
    subclase?: string; rareza?: string
    precio_max?: string; precio_min?: string
    moneda?: string; dano_min?: string; mod?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()
  const q         = params.q         || ''
  const sort      = params.sort      || 'newest'
  const clase     = params.clase     || ''
  const subclase  = params.subclase  || ''
  const rareza    = params.rareza    || ''
  const precioMax = params.precio_max ? parseInt(params.precio_max) : null
  const precioMin = params.precio_min ? parseInt(params.precio_min) : null
  const danoMin   = params.dano_min   ? parseInt(params.dano_min)   : null
  const mod       = params.mod        || ''
  const from      = 0
  const to        = PAGE_SIZE - 1

  let query = supabase
    .from('listings')
    .select('*, profiles(username, avg_rating, total_reviews, last_sign_in_at)', { count: 'exact' })
    .eq('status', 'active')
    .range(from, to)
    .order('featured', { ascending: false, nullsFirst: false })

  if (sort === 'price_asc') {
    query = query.order('price_gold', { ascending: true, nullsFirst: false })
  } else if (sort === 'price_desc') {
    query = query.order('price_gold', { ascending: false, nullsFirst: false })
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (params.tipo && params.tipo !== 'all')       query = query.eq('type', params.tipo)
  if (params.cat && params.cat !== 'all')         query = query.eq('item_category', params.cat)
  if (params.subcat && params.subcat !== 'all')   query = query.eq('subcategoria', params.subcat)
  if (params.reino && params.reino !== 'all')     query = query.eq('reino', params.reino)
  if (q) query = query.ilike('item_name', `%${q}%`)

  const SUBCLASE_PARENT: Record<string, string> = {
    barbaro: 'guerrero', caballero: 'guerrero',
    brujo: 'mago',       conjurador: 'mago',
    cazador: 'arquero',  tirador: 'arquero',
  }
  if (subclase && subclase !== 'all') {
    const claseParent = SUBCLASE_PARENT[subclase] || ''
    if (claseParent) query = query.or(`clase_requerida.eq.todas,clase_requerida.eq.${claseParent}`)
    query = query.or(`subclase_requerida.is.null,subclase_requerida.eq.todas,subclase_requerida.eq.${subclase}`)
  } else if (clase && clase !== 'all') {
    query = query.or(`clase_requerida.eq.todas,clase_requerida.eq.${clase}`)
  }

  if (rareza && rareza !== 'all') query = query.eq('rareza', rareza)

  if (precioMin !== null) query = query.gte('price_gold', precioMin)
  if (precioMax !== null) {
    query = query.or(`price_gold.is.null,price_gold.lte.${precioMax}`)
  }
  if (danoMin !== null) query = query.gte('dano_min_1', danoMin)
  if (mod) {
    const m = `%${mod}%`
    query = query.or(`slot_1.ilike.${m},slot_2.ilike.${m},slot_3.ilike.${m},slot_4.ilike.${m},slot_5.ilike.${m}`)
  }

  const { data: listings, count } = await query

  const { data: featuredRaw } = await supabase
    .from('listings')
    .select('*, profiles(username, avg_rating, is_premium)')
    .eq('status', 'active')
    .eq('featured', true)
    .or('featured_until.is.null,featured_until.gt.' + new Date().toISOString())
    .limit(30)
  const featuredListings = (featuredRaw || [])
    .sort((a: any, b: any) => {
      const aPrem = a.profiles?.is_premium ? 1 : 0
      const bPrem = b.profiles?.is_premium ? 1 : 0
      if (bPrem !== aPrem) return bPrem - aPrem
      return (b.profiles?.avg_rating || 0) - (a.profiles?.avg_rating || 0)
    })
    .slice(0, 10)

  const { data: { user } } = await supabase.auth.getUser()
  const { data: favData } = user
    ? await supabase.from('favorites').select('listing_id').eq('user_id', user.id)
    : { data: [] }
  const favSet = new Set((favData || []).map((f: any) => f.listing_id))

  return (
    <>
      <div>
        <HeroSection />
        <div style={{ padding: '0 20px 40px' }}>
          {featuredListings && featuredListings.length > 0 && (
            <FeaturedCarousel listings={featuredListings} />
          )}

          <Suspense fallback={<div style={{ height: 120, marginBottom: 28 }} />}>
            <FilterBar />
          </Suspense>

          <ListingsCount count={count || 0} />

          <Suspense fallback={<SkeletonGrid count={12} />}>
            <ListingsGrid
              key={[params.q,params.sort,params.clase,params.rareza,params.tipo,params.cat,params.subcat,params.reino,params.precio_min,params.precio_max,params.dano_min,params.mod,params.page].join('|')}
              initialListings={listings || []}
              initialCount={count || 0}
              initialFavSet={Array.from(favSet)}
            />
          </Suspense>
        </div>
      </div>
    </>
  )
}
