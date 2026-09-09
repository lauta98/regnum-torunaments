import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { notifyDiscord, siteUrl } from '@/lib/discord-webhook'
import { formatPrecio, listingHref } from '@/lib/market/constants'

export async function POST(req: NextRequest) {
  const { listingId } = await req.json()
  if (!listingId) return NextResponse.json({ error: 'Falta listingId' }, { status: 400 })

  const svc = createServiceSupabase()
  const { data: listing } = await svc
    .from('listings')
    .select('item_name, short_id, type, price_gold, price_money, currency_label')
    .eq('id', listingId)
    .single()

  if (!listing) return NextResponse.json({ ok: false })

  const tipo = listing.type === 'sell' ? 'Vende' : 'Busca'
  const precio = formatPrecio(listing.price_gold, listing.price_money, listing.currency_label)

  await notifyDiscord({
    title: `🛒 ${tipo}: ${listing.item_name}`,
    description: precio,
    url: siteUrl(listingHref(listing.item_name, listingId, listing.short_id)),
    footer: 'CoR Market',
  })

  return NextResponse.json({ ok: true })
}
