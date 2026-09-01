import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceSupabase } from '@/lib/supabase-server'
import { obtenerPago } from '@/lib/mercadopago'

/** Firma documentada por MercadoPago: header `x-signature` trae `ts=...,v1=...`,
 * y el hash se calcula sobre `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * usando el webhook secret. Ver notas de implementación en el plan — MP puede
 * cambiar este formato, confirmar contra la documentación vigente si esto
 * empieza a rechazar firmas válidas. */
function firmaValida(req: NextRequest, dataId: string) {
  const signatureHeader = req.headers.get('x-signature')
  const requestId = req.headers.get('x-request-id')
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!signatureHeader || !requestId || !secret) return false

  const partes = Object.fromEntries(
    signatureHeader.split(',').map(p => p.trim().split('=').map(s => s.trim()) as [string, string])
  )
  const ts = partes.ts
  const v1 = partes.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const esperado = createHmac('sha256', secret).update(manifest).digest('hex')

  const a = Buffer.from(v1)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const dataId = url.searchParams.get('data.id') ?? (await req.json().catch(() => null))?.data?.id
    if (!dataId) return NextResponse.json({ ok: true }) // notificación que no es de pago, nada que hacer

    if (!firmaValida(req, String(dataId))) {
      console.error('webhook mercadopago: firma inválida')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    const pago = await obtenerPago(String(dataId))
    if (pago.status !== 'approved') return NextResponse.json({ ok: true })

    const playerId = pago.external_reference
    if (!playerId) return NextResponse.json({ ok: true })

    const service = createServiceSupabase()

    // Idempotencia: si ya procesamos este pago, no repetir nada.
    const { error: insertError } = await service.from('premium_payments').insert({
      player_id: playerId,
      proveedor: 'mercadopago',
      proveedor_pago_id: String(pago.id),
      moneda: 'ARS',
      monto: pago.transaction_amount,
    })
    if (insertError) {
      if (insertError.code === '23505') return NextResponse.json({ ok: true }) // unique violation = ya procesado
      throw insertError
    }

    await service.from('players').update({ es_premium: true, premium_desde: new Date().toISOString() }).eq('id', playerId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('webhook mercadopago error:', err)
    // MercadoPago reintenta ante cualquier respuesta que no sea 2xx.
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
