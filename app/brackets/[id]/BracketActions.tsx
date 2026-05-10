'use client'
import { useState } from 'react'

export default function BracketActions({
  matchId,
  teamA,
  teamB,
}: {
  matchId: string
  teamA: { id: string; nombre: string }
  teamB: { id: string; nombre: string }
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const submit = async (ganador_id: string) => {
    setLoading(true); setError('')
    const res = await fetch(`/api/matches/${matchId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ganador_id }),
    })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al guardar resultado')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        background: 'var(--gold-muted)', border: '1px solid var(--border-gold-strong)',
        color: 'var(--gold)', padding: '2px 8px', borderRadius: 6,
        fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1, cursor: 'pointer',
      }}>
        RESULTADO
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 0' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>¿QUIÉN GANÓ?</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => submit(teamA.id)} disabled={loading} style={winBtnStyle}>
          {teamA.nombre}
        </button>
        <button onClick={() => submit(teamB.id)} disabled={loading} style={winBtnStyle}>
          {teamB.nombre}
        </button>
        <button onClick={() => setOpen(false)} disabled={loading} style={{ ...winBtnStyle, background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          ✕
        </button>
      </div>
      {error && <span style={{ fontSize: 10, color: '#f87171' }}>{error}</span>}
    </div>
  )
}

const winBtnStyle = {
  padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border-gold)',
  background: 'var(--gold-muted)', color: 'var(--gold)',
  fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, cursor: 'pointer',
} as const
