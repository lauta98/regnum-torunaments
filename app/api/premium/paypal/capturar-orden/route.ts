import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { capturarOrden } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: me } = await supabase.from('players').select('id, es_premium').eq('user_id', user.id).single()
    if (!me) return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    if (me.es_premium) return NextResponse.json({ ok: true, already: true })

    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

    const captura = await capturarOrden(orderId)

    // No confiar en lo que manda el cliente: la orden capturada tiene que
    // estar completa y pertenecerle al jugador autenticado, no a otro.
    if (captura.status !== 'COMPLETED' || captura.customId !== me.id || !captura.captureId) {
      return NextResponse.json({ error: 'Pago no confirmado' }, { status: 402 })
    }

    const service = createServiceSupabase()

    const { error: insertError } = await service.from('premium_payments').insert({
      player_id: me.id,
      proveedor: 'paypal',
      proveedor_pago_id: captura.captureId,
      moneda: 'USD',
      monto: captura.amount ?? '1.00',
    })
    if (insertError && insertError.code !== '23505') throw insertError // 23505 = ya procesado (idempotencia)

    await service.from('players').update({ es_premium: true, premium_desde: new Date().toISOString() }).eq('id', me.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('premium/paypal/capturar-orden error:', err)
    return NextResponse.json({ error: 'Error al confirmar el pago' }, { status: 500 })
  }
}
