'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EliminarTorneoButton({ torneoId, nombre }: { torneoId: string; nombre: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const eliminar = async () => {
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al eliminar'); setLoading(false); setConfirmando(false); return }
    router.refresh()
  }

  if (confirmando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={eliminar} disabled={loading} style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer',
            background: 'rgba(244,67,54,0.18)', border: '1px solid rgba(244,67,54,0.5)', color: '#F44336',
            fontFamily: 'var(--font-display)', letterSpacing: 0.5,
          }}>
            {loading ? '...' : `Confirmar borrado`}
          </button>
          <button onClick={() => setConfirmando(false)} disabled={loading} style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
          }}>
            Cancelar
          </button>
        </div>
        {error && <span style={{ fontSize: 9, color: '#F44336', maxWidth: 200, textAlign: 'right' }}>{error}</span>}
      </div>
    )
  }

  return (
    <button
      title={`Eliminar "${nombre}"`}
      onClick={() => setConfirmando(true)}
      style={{
        fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
        background: 'transparent', border: '1px solid rgba(244,67,54,0.3)', color: 'rgba(244,67,54,0.8)',
        fontFamily: 'var(--font-display)', flexShrink: 0,
      }}
    >
      Eliminar
    </button>
  )
}
