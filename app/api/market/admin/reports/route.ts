import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

async function isAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return !!data?.is_admin
}

export async function GET() {
  const supabase = await createServerSupabase()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Sin permisos' }, { status: 403 })

  // Intentar con columna resolved; si falla, intentar sin ella
  let reports: any[] = []
  let { data, error } = await supabase
    .from('reports')
    .select('id, reason, details, created_at, listing_id, reporter_id, resolved')
    .order('created_at', { ascending: false })

  if (error) {
    // Probablemente la columna resolved no existe — intentar sin ella
    const fallback = await supabase
      .from('reports')
      .select('id, reason, details, created_at, listing_id, reporter_id')
      .order('created_at', { ascending: false })
    if (fallback.error) return Response.json({ error: fallback.error.message }, { status: 400 })
    reports = (fallback.data || []).map((r: any) => ({ ...r, resolved: false }))
  } else {
    reports = (data || []).map((r: any) => ({ ...r, resolved: r.resolved ?? false }))
  }

  if (!reports.length) return Response.json({ reports: [] })

  // Traer listings y perfiles por separado
  const listingIds  = [...new Set(reports.map((r: any) => r.listing_id).filter(Boolean))]
  const reporterIds = [...new Set(reports.map((r: any) => r.reporter_id).filter(Boolean))]

  const [{ data: listings }, { data: reporters }] = await Promise.all([
    supabase.from('listings').select('id, item_name, categoria, type, status, user_id').in('id', listingIds),
    supabase.from('profiles').select('id, username').in('id', reporterIds),
  ])

  const sellerIds = [...new Set((listings || []).map((l: any) => l.user_id).filter(Boolean))]
  const { data: sellers } = await supabase.from('profiles').select('id, username').in('id', sellerIds)

  const enriched = reports.map((r: any) => {
    const listing  = (listings  || []).find((l: any) => l.id === r.listing_id)
    const seller   = (sellers   || []).find((s: any) => s.id === listing?.user_id)
    const reporter = (reporters || []).find((p: any) => p.id === r.reporter_id)
    return { ...r, listing: listing ? { ...listing, seller } : null, reporter }
  })

  return Response.json({ reports: enriched })
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Sin permisos' }, { status: 403 })

  const { action, listing_id, report_id } = await req.json()

  if (action === 'delete_listing') {
    if (!listing_id || listing_id === 'undefined') {
      return Response.json({ error: 'listing_id inválido' }, { status: 400 })
    }
    // Usar service role para saltear RLS (admin puede borrar cualquier publicación)
    const adminClient = createServiceSupabase()
    const { error } = await adminClient.from('listings').delete().eq('id', listing_id)
    if (error) return Response.json({ error: error.message }, { status: 400 })
    // Marcar reporte como resuelto
    await adminClient.from('reports').update({ resolved: true }).eq('listing_id', listing_id)
    return Response.json({ ok: true })
  }

  if (action === 'dismiss') {
    const adminClient = createServiceSupabase()
    await adminClient.from('reports').update({ resolved: true }).eq('id', report_id)
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Acción inválida' }, { status: 400 })
}
