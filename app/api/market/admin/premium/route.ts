import { createServerSupabase } from '@/lib/supabase-server'

const DIAS_PREMIUM = 30
const CREDITOS_TOTALES = 24   // pool completo al activar
const CAP_SEMANAL = 6         // máximo usable por semana

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!me?.is_admin) return Response.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: requests } = await supabase
    .from('premium_requests')
    .select('*, seller:profiles!premium_requests_user_id_fkey(username, discord, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(50)

  return Response.json({ requests: requests || [] })
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!me?.is_admin) return Response.json({ error: 'Sin permisos' }, { status: 403 })

  const { request_id, action } = await req.json()
  if (!request_id || !['approve', 'reject'].includes(action)) {
    return Response.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { data: request } = await supabase
    .from('premium_requests')
    .select('*, seller:profiles!premium_requests_user_id_fkey(username)')
    .eq('id', request_id)
    .single()

  if (!request) return Response.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  if (action === 'approve') {
    const premiumUntil = new Date()
    premiumUntil.setDate(premiumUntil.getDate() + DIAS_PREMIUM)

    await supabase.from('profiles').update({
      is_premium: true,
      premium_until: premiumUntil.toISOString(),
      premium_credits: CREDITOS_TOTALES,      // pool de 24
      premium_weekly_used: 0,                 // usados esta semana
      premium_credits_reset_at: new Date().toISOString(),
    }).eq('id', request.user_id)

    await supabase.from('notifications').insert({
      user_id: request.user_id,
      type: 'premium_approved',
      message: `¡Tu suscripción Mercader Elite está activa! Tenés ${CREDITOS_TOTALES} destacados para usar este mes (máximo ${CAP_SEMANAL} por semana).`,
    })
  } else {
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      type: 'premium_rejected',
      message: 'No pudimos verificar tu pago de Mercader Elite. Si ya pagaste, contactanos por Discord.',
    })
  }

  await supabase.from('premium_requests').update({
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }).eq('id', request_id)

  return Response.json({ ok: true })
}
