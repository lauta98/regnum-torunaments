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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch', width: '100%' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={eliminar} disabled={loading} style={{
            flex: 1, fontSize: 11, padding: '7px 10px', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
            background: 'rgba(244,67,54,0.22)', border: '1px solid rgba(244,67,54,0.6)', color: '#ff6b6b',
            fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 0.3,
          }}>
            {loading ? '...' : 'Confirmar'}
          </button>
          <button onClick={() => setConfirmando(false)} disabled={loading} className="btn btn-ghost" style={{
            flex: 1, fontSize: 11, padding: '7px 10px',
          }}>
            Cancelar
          </button>
        </div>
        {error && <span style={{ fontSize: 10, color: '#ff6b6b' }}>{error}</span>}
      </div>
    )
  }

  return (
    <button
      title={`Eliminar "${nombre}"`}
      onClick={() => setConfirmando(true)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        fontSize: 11, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', width: '100%',
        background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.35)', color: '#ff8a8a',
        fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 0.3,
      }}
    >
      🗑 Eliminar
    </button>
  )
}
