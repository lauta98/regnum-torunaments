import { getSiteOrigin } from '@/lib/market/siteUrl'

const MP_API = 'https://api.mercadopago.com'

export const PREMIUM_ARS = 1500

export async function crearPreferencia(playerId: string) {
  const site = getSiteOrigin()
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [{
        title: 'Cuenta Premium — CoR Tournament Stats',
        quantity: 1,
        unit_price: PREMIUM_ARS,
        currency_id: 'ARS',
      }],
      external_reference: playerId,
      back_urls: {
        success: `${site}/jugadores/${playerId}`,
        pending: `${site}/jugadores/${playerId}`,
        failure: `${site}/jugadores/${playerId}`,
      },
      auto_return: 'approved',
      notification_url: `${site}/api/webhooks/mercadopago`,
    }),
  })

  if (!res.ok) throw new Error(`MercadoPago (crear preferencia): ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.init_point as string
}

/** Nunca confiar en el body del webhook — siempre volver a pedir el pago
 * por su id para confirmar que de verdad está aprobado. */
export async function obtenerPago(paymentId: string) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  })
  if (!res.ok) throw new Error(`MercadoPago (obtener pago): ${res.status} ${await res.text()}`)
  return res.json() as Promise<{ id: number; status: string; external_reference: string; transaction_amount: number }>
}
