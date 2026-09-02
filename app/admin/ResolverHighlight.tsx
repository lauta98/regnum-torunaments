'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function ResolverHighlight({ highlightId }: { highlightId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'ok_quitar' | 'ok_descartar' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  const resolver = (accion: 'quitar' | 'descartar') => {
    startTransition(async () => {
      const res = await fetch('/api/admin/resolver-highlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlightId, accion }),
      })
      if (res.ok) {
        setStatus(accion === 'quitar' ? 'ok_quitar' : 'ok_descartar')
        router.refresh()
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 2500)
      }
    })
  }

  if (status === 'ok_quitar') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 14 }}>🗑️</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#F44336', letterSpacing: 0.5 }}>Post borrado</span>
    </div>
  )

  if (status === 'ok_descartar') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 14 }}>✓</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#4CAF50', letterSpacing: 0.5 }}>Reporte descartado</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={() => resolver('quitar')}
        disabled={isPending}
        title="Borra el post compartido"
        style={{ padding: '6px 10px', borderRadius: 6, cursor: isPending ? 'not-allowed' : 'pointer', background: 'rgba(244,67,54,0.12)', color: '#f87171', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5, border: '1px solid rgba(244,67,54,0.3)', whiteSpace: 'nowrap' }}
      >
        🗑️ Quitar
      </button>
      <button
        onClick={() => resolver('descartar')}
        disabled={isPending}
        title="El reporte no tenía razón — el post se queda"
        style={{ padding: '6px 10px', borderRadius: 6, cursor: isPending ? 'not-allowed' : 'pointer', background: 'rgba(76,175,80,0.08)', color: '#4CAF50', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5, border: '1px solid rgba(76,175,80,0.25)', whiteSpace: 'nowrap' }}
      >
        ✓ Descartar reporte
      </button>
      {status === 'error' && (
        <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-display)' }}>Error</span>
      )}
    </div>
  )
}
