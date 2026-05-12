'use client'
import { useState, useTransition } from 'react'

export default function VerificarPersonaje({
  personajeId,
  verificado: initialVerificado,
  reportId,
}: {
  personajeId: string
  verificado: boolean
  reportId: string
}) {
  const [verificado, setVerificado] = useState(initialVerificado)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch('/api/admin/verificar-personaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personajeId, verificado: !verificado }),
      })
      if (res.ok) {
        setVerificado(v => !v)
        setStatus('ok')
        setTimeout(() => setStatus('idle'), 1800)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 2000)
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button onClick={toggle} disabled={isPending} style={{
        padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
        background: verificado ? 'rgba(33,150,243,0.15)' : 'rgba(212,175,55,0.1)',
        color: verificado ? '#2196F3' : 'var(--gold)',
        fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5,
        border: `1px solid ${verificado ? 'rgba(33,150,243,0.3)' : 'rgba(212,175,55,0.3)'}`
      }}>
        {verificado ? '✓ Verificado' : 'Marcar verificado'}
      </button>
      {status === 'ok'    && <span style={{ fontSize: 10, color: '#4CAF50', fontFamily: 'var(--font-display)' }}>Guardado</span>}
      {status === 'error' && <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-display)' }}>Error</span>}
    </div>
  )
}
