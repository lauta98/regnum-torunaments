'use client'
import { useState } from 'react'

export default function ExpulsarButton({ torneoId, teamId, teamNombre }: { torneoId: string; teamId: string; teamNombre: string }) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio'); return }
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/expulsar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: teamId, motivo: motivo.trim() }),
    })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al expulsar')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        background: 'transparent', border: '1px solid rgba(244,67,54,0.4)', color: '#f87171',
        padding: '4px 10px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9,
        letterSpacing: 0.5, cursor: 'pointer',
      }}>
        Expulsar
      </button>
    )
  }

  return (
    <div style={{ background: '#1a0f0f', border: '1px solid rgba(244,67,54,0.35)', borderRadius: 8, padding: 12, minWidth: 220 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#f87171', marginBottom: 8, letterSpacing: 0.5 }}>
        EXPULSAR A {teamNombre.toUpperCase()}
      </div>
      <textarea
        value={motivo}
        onChange={e => { setMotivo(e.target.value); setError('') }}
        placeholder="Motivo de la expulsión (obligatorio)"
        maxLength={300}
        style={{
          width: '100%', minHeight: 60, background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 6, color: 'var(--text-primary)', padding: '8px 10px', fontSize: 12,
          fontFamily: 'inherit', resize: 'vertical', marginBottom: 8, boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={confirmar} disabled={loading} style={{
          background: '#f44336', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6,
          fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5, cursor: 'pointer', flex: 1,
        }}>
          {loading ? 'Expulsando...' : 'Confirmar expulsión'}
        </button>
        <button onClick={() => { setOpen(false); setError('') }} disabled={loading} style={{
          background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)',
          padding: '6px 12px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 10, cursor: 'pointer',
        }}>
          Cancelar
        </button>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: 10, marginTop: 6 }}>{error}</p>}
    </div>
  )
}
