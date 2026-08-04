import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { listing_id } = await req.json()
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const { data: listing } = await supabase
    .from('listings')
    .select('last_bumped_at, user_id')
    .eq('id', listing_id)
    .single()

  if (!listing || listing.user_id !== user.id)
    return Response.json({ error: 'No autorizado' }, { status: 403 })

  // Cooldown de 24h
  if (listing.last_bumped_at) {
    const diff = Date.now() - new Date(listing.last_bumped_at).getTime()
    const COOLDOWN = 24 * 60 * 60 * 1000
    if (diff < COOLDOWN) {
      const horasRestantes = Math.ceil((COOLDOWN - diff) / 3600000)
      return Response.json({ error: 'cooldown', horasRestantes }, { status: 429 })
    }
  }

  const now = new Date().toISOString()
  await supabase.from('listings').update({
    created_at: now,
    last_bumped_at: now,
  }).eq('id', listing_id)

  return Response.json({ ok: true })
}
