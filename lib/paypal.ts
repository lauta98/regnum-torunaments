const PAYPAL_API = process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com'

export const PREMIUM_USD = '1.00'

async function obtenerAccessToken() {
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal (access token): ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

export async function crearOrden(playerId: string) {
  const token = await obtenerAccessToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: playerId,
        description: 'Cuenta Premium — CoR Tournament Stats',
        amount: { currency_code: 'USD', value: PREMIUM_USD },
      }],
    }),
  })
  if (!res.ok) throw new Error(`PayPal (crear orden): ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.id as string
}

/** Devuelve la orden capturada — el caller debe confirmar `status` y
 * `custom_id` antes de acreditar nada (nunca fiarse de lo que manda el cliente). */
export async function capturarOrden(orderId: string) {
  const token = await obtenerAccessToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`PayPal (capturar orden): ${res.status} ${await res.text()}`)
  const data = await res.json()
  const captura = data.purchase_units?.[0]?.payments?.captures?.[0]
  return {
    status: data.status as string,
    customId: data.purchase_units?.[0]?.custom_id as string | undefined,
    captureId: captura?.id as string | undefined,
    amount: captura?.amount?.value as string | undefined,
  }
}
