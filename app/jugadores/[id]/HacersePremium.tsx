'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window { paypal?: any }
}

export default function HacersePremium({ playerId }: { playerId: string }) {
  const router = useRouter()
  const [metodo, setMetodo] = useState<'elegir' | 'paypal'>('elegir')
  const [status, setStatus] = useState<'idle' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()
  const paypalRef = useRef<HTMLDivElement>(null)
  const botonMontado = useRef(false)

  const pagarConMercadoPago = () => {
    startTransition(async () => {
      const res = await fetch('/api/premium/mercadopago', { method: 'POST' })
      const data = await res.json()
      if (res.ok) window.location.href = data.url
      else setStatus('error')
    })
  }

  useEffect(() => {
    if (metodo !== 'paypal' || botonMontado.current) return

    const montar = () => {
      if (!window.paypal || !paypalRef.current) return
      botonMontado.current = true
      window.paypal.Buttons({
        style: { color: 'gold', shape: 'pill', label: 'pay', height: 40 },
        createOrder: async () => {
          const res = await fetch('/api/premium/paypal/crear-orden', { method: 'POST' })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Error')
          return data.id
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await fetch('/api/premium/paypal/capturar-orden', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          })
          if (res.ok) router.refresh()
          else setStatus('error')
        },
        onError: () => setStatus('error'),
      }).render(paypalRef.current)
    }

    if (window.paypal) { montar(); return }
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`
    script.onload = montar
    document.body.appendChild(script)
  }, [metodo, router])

  if (metodo === 'paypal') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div ref={paypalRef} style={{ minWidth: 200 }} />
        <button type="button" onClick={() => setMetodo('elegir')} className="btn btn-ghost-gold" style={{ padding: '5px 10px', fontSize: 10 }}>
          ← Volver
        </button>
        {status === 'error' && <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-display)' }}>Error al procesar el pago</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button type="button" onClick={pagarConMercadoPago} disabled={isPending} className="btn btn-ghost-gold" style={{ padding: '7px 14px', fontSize: 11 }}>
        👑 Hacerme Premium — $1.500 ARS
      </button>
      <button type="button" onClick={() => setMetodo('paypal')} className="btn btn-ghost-gold" style={{ padding: '7px 14px', fontSize: 11 }}>
        👑 Hacerme Premium — u$d1 (PayPal)
      </button>
      {status === 'error' && <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-display)' }}>Error al iniciar el pago</span>}
    </div>
  )
}
