'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IconTrash, IconCheck } from './AdminIcons'

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
      <span style={{ display: 'flex', color: 'var(--ignis)' }}><IconTrash size={13} /></span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ignis)', letterSpacing: '0.05em' }}>Post borrado</span>
    </div>
  )

  if (status === 'ok_descartar') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'flex', color: 'var(--syrtis)' }}><IconCheck size={13} /></span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--syrtis)', letterSpacing: '0.05em' }}>Reporte descartado</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={() => resolver('quitar')}
        disabled={isPending}
        title="Borra el post compartido"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', cursor: isPending ? 'not-allowed' : 'pointer', background: 'rgba(244,67,54,0.1)', color: '#f87171', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid rgba(244,67,54,0.3)', whiteSpace: 'nowrap' }}
      >
        <IconTrash size={11} /> Quitar
      </button>
      <button
        onClick={() => resolver('descartar')}
        disabled={isPending}
        title="El reporte no tenía razón — el post se queda"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', cursor: isPending ? 'not-allowed' : 'pointer', background: 'rgba(76,175,80,0.08)', color: 'var(--syrtis)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid rgba(76,175,80,0.25)', whiteSpace: 'nowrap' }}
      >
        <IconCheck size={11} /> Descartar reporte
      </button>
      {status === 'error' && (
        <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-mono)' }}>Error</span>
      )}
    </div>
  )
}
