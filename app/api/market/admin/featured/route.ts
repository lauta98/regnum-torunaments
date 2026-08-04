import { createServerSupabase } from '@/lib/supabase-server'

const DIAS_DESTACADO = 7

export async function POST(req: Request) {
  try {
    const { request_id, action } = await req.json() // action: 'approve' | 'reject'
    if (!request_id || !action) return Response.json({ error: 'Parámetros inválidos' }, { status: 400 })

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    // Verificar que es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) return Response.json({ error: 'Sin permisos' }, { status: 403 })

    // Obtener la solicitud
    const { data: request } = await supabase
      .from('featured_requests')
      .select('*, listing:listings(id, user_id, item_name)')
      .eq('id', request_id)
      .single()

    if (!request) return Response.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    if (request.status !== 'pending') return Response.json({ error: 'La solicitud ya fue procesada' }, { status: 400 })

    if (action === 'approve') {
      const featuredUntil = new Date(Date.now() + DIAS_DESTACADO * 24 * 60 * 60 * 1000).toISOString()

      // Activar destacado en el listing
      await supabase
        .from('listings')
        .update({ featured: true, featured_until: featuredUntil })
        .eq('id', request.listing_id)

      // Incrementar matecitos_count en el perfil
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('matecitos_count')
        .eq('id', request.user_id)
        .single()

      await supabase
        .from('profiles')
        .update({ matecitos_count: (sellerProfile?.matecitos_count || 0) + 1 })
        .eq('id', request.user_id)
    }

    // Actualizar estado de la solicitud
    await supabase
      .from('featured_requests')
      .update({ status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', request_id)

    // Notificar al usuario
    const listing = request.listing as { id: string; user_id: string; item_name: string } | null
    if (listing?.user_id) {
      if (action === 'approve') {
        await supabase.from('notifications').insert({
          user_id: listing.user_id,
          type: 'featured_approved',
          title: '⭐ ¡Tu publicación fue destacada!',
          body: `${listing.item_name} aparece ahora en el carrusel por 7 días.`,
          listing_id: listing.id,
        })
      } else {
        await supabase.from('notifications').insert({
          user_id: listing.user_id,
          type: 'featured_rejected',
          title: '❌ Solicitud de destacado rechazada',
          body: `No pudimos verificar el pago para "${listing.item_name}". Contactá a lowir en Discord.`,
          listing_id: listing.id,
        })
      }
    }

    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return Response.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: requests } = await supabase
    .from('featured_requests')
    .select('*, listing:listings(id, item_name, item_category, user_id)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!requests?.length) return Response.json({ requests: [] })

  // Obtener perfiles de los vendedores
  const userIds = [...new Set(requests.map(r => r.user_id))]
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, username, discord')
    .in('id', userIds)

  const sellersMap = Object.fromEntries((sellers || []).map(s => [s.id, s]))

  const enriched = requests.map(r => ({
    ...r,
    seller: sellersMap[r.user_id] || null,
  }))

  return Response.json({ requests: enriched })
}
