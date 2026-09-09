import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { notifyDiscord, siteUrl } from '@/lib/discord-webhook'
import { formatPrecio, listingHref } from '@/lib/market/constants'
import { getRealItemIcon } from '@/lib/market/icons'

export async function POST(req: NextRequest) {
  const { listingId } = await req.json()
  if (!listingId) return NextResponse.json({ error: 'Falta listingId' }, { status: 400 })

  const svc = createServiceSupabase()
  const { data: listing } = await svc
    .from('listings')
    .select(`
      item_name, short_id, type, price_gold, price_money, currency_label,
      item_category, subcategoria, material, item_image_url, description,
      profiles ( username )
    `)
    .eq('id', listingId)
    .single()

  if (!listing) return NextResponse.json({ ok: false })

  const tipo = listing.type === 'sell' ? 'Vende' : 'Busca'
  const precio = formatPrecio(listing.price_gold, listing.price_money, listing.currency_label)
  // Mismo orden de prioridad que en las cards del sitio: foto real del
  // vendedor primero, después el ícono real (específico de mazmorra si
  // aplica, si no genérico por categoría+material).
  const thumbnailUrl = listing.item_image_url
    || getRealItemIcon(listing.subcategoria || '', listing.item_category, listing.material, `${listing.item_name} ${listing.description || ''}`)
  const vendedor = (listing.profiles as any)?.username

  await notifyDiscord({
    title: `🛒 ${tipo}: ${listing.item_name}`,
    description: precio,
    url: siteUrl(listingHref(listing.item_name, listingId, listing.short_id)),
    footer: 'CoR Market',
    thumbnailUrl,
    author: vendedor ? `Publicado por ${vendedor}` : null,
  })

  return NextResponse.json({ ok: true })
}
