'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window { paypal?: any }
}

export default function HacersePremium({ playerId }: { playerId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [metodo, setMetodo] = useState<'elegir' | 'paypal'>('elegir')
  const [status, setStatus] = useState<'idle' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()
  const paypalRef = useRef<HTMLDivElement>(null)
  const botonMontado = useRef(false)

  const cerrar = () => { setOpen(false); setMetodo('elegir'); setStatus('idle') }

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

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost-gold" style={{ padding: '7px 14px', fontSize: 11 }}>
        👑 Hacerme Premium
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={cerrar}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-strong)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', padding: '28px 32px', width: '100%', maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👑</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold)', marginBottom: 8, letterSpacing: 1 }}>Cuenta Premium</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              Un gesto simbólico para acompañar el proyecto — sin ninguna ventaja competitiva de por medio. A cambio, tu nombre queda marcado en la comunidad:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: 15 }}>👑</span> Una insignia junto a tu nombre, en todo el sitio
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: 15 }}>🎨</span> El color de tu perfil, a tu elección — con el estilo de fondo que prefieras
              </li>
            </ul>

            {metodo === 'paypal' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div ref={paypalRef} style={{ minWidth: 200 }} />
                <button type="button" onClick={() => setMetodo('elegir')} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 10 }}>
                  ← Volver
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button type="button" onClick={pagarConMercadoPago} disabled={isPending} className="btn btn-primary" style={{ padding: '12px 16px', fontSize: 13, letterSpacing: 1 }}>
                  $1.500 ARS — MERCADOPAGO
                </button>
                <button type="button" onClick={() => setMetodo('paypal')} className="btn btn-primary" style={{ padding: '12px 16px', fontSize: 13, letterSpacing: 1 }}>
                  $1 — PAYPAL
                </button>
                <button type="button" onClick={cerrar} className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 11, marginTop: 2 }}>
                  Cancelar
                </button>
              </div>
            )}

            {status === 'error' && <p style={{ fontSize: 11, color: '#f87171', fontFamily: 'var(--font-display)', marginTop: 12 }}>Error al procesar el pago</p>}
          </div>
        </div>
      )}
    </>
  )
}
