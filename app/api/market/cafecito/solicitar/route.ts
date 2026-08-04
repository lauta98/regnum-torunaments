import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { listing_id } = await req.json()
    if (!listing_id) return Response.json({ error: 'listing_id requerido' }, { status: 400 })

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    // Verificar que el listing pertenece al usuario y está activo
    const { data: listing } = await supabase
      .from('listings')
      .select('id, item_name, user_id, status, featured, featured_until')
      .eq('id', listing_id)
      .eq('user_id', user.id)
      .single()

    if (!listing) return Response.json({ error: 'Publicación no encontrada' }, { status: 404 })
    if (listing.status !== 'active') return Response.json({ error: 'La publicación debe estar activa' }, { status: 400 })

    // Verificar que no tenga un destacado vigente
    if (listing.featured && listing.featured_until && new Date(listing.featured_until) > new Date()) {
      return Response.json({ error: 'Esta publicación ya está destacada' }, { status: 400 })
    }

    // Verificar que no tenga una solicitud pendiente
    const { data: pendiente } = await supabase
      .from('featured_requests')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (pendiente) return Response.json({ error: 'Ya tenés una solicitud pendiente para esta publicación' }, { status: 400 })

    // Crear la solicitud
    const { data: request, error } = await supabase
      .from('featured_requests')
      .insert({ listing_id, user_id: user.id, status: 'pending' })
      .select('id')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ ok: true, request_id: request.id })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
