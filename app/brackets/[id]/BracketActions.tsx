'use client'
import { useState } from 'react'

const SCORE_PRESETS = ['2-0', '2-1', '3-0', '3-1', '3-2']

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
  const [ganador, setGanador] = useState<{ id: string; nombre: string } | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [customGanador, setCustomGanador] = useState('')
  const [customPerdedor, setCustomPerdedor] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setOpen(false); setGanador(null); setCustomOpen(false)
    setCustomGanador(''); setCustomPerdedor(''); setError('')
  }

  const submit = async (body: Record<string, unknown>) => {
    setLoading(true); setError('')
    const res = await fetch(`/api/matches/${matchId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al guardar resultado')
      setLoading(false)
    }
  }

  const submitScore = (preset: string) => {
    if (!ganador) return
    const [sg, sp] = preset.split('-').map(Number)
    submit({ ganador_id: ganador.id, score_ganador: sg, score_perdedor: sp })
  }

  const submitWalkover = () => {
    if (!ganador) return
    submit({ ganador_id: ganador.id, walkover: true })
  }

  const submitCustom = () => {
    if (!ganador) return
    const sg = Number(customGanador)
    const sp = Number(customPerdedor)
    if (!Number.isInteger(sg) || !Number.isInteger(sp) || sg <= sp || sg < 0 || sp < 0) {
      setError('Marcador inválido — el ganador tiene que tener más puntos')
      return
    }
    submit({ ganador_id: ganador.id, score_ganador: sg, score_perdedor: sp })
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

  // Paso 1: quién ganó
  if (!ganador) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>¿QUIÉN GANÓ?</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setGanador(teamA)} disabled={loading} style={chipStyle}>{teamA.nombre}</button>
          <button onClick={() => setGanador(teamB)} disabled={loading} style={chipStyle}>{teamB.nombre}</button>
          <button onClick={reset} disabled={loading} style={{ ...chipStyle, background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>✕</button>
        </div>
        {error && <span style={{ fontSize: 10, color: '#f87171' }}>{error}</span>}
      </div>
    )
  }

  // Paso 2: marcador
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 0' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>
        ¿POR CUÁNTO GANÓ {ganador.nombre.toUpperCase()}?
      </div>
      {!customOpen ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {SCORE_PRESETS.map(p => (
            <button key={p} onClick={() => submitScore(p)} disabled={loading} style={chipStyle}>{p}</button>
          ))}
          <button onClick={submitWalkover} disabled={loading} style={{ ...chipStyle, color: '#f87171', borderColor: 'rgba(244,113,113,0.4)' }}>
            Abandono
          </button>
          <button onClick={() => setCustomOpen(true)} disabled={loading} style={{ ...chipStyle, background: 'transparent' }}>
            Otro
          </button>
          <button onClick={() => setGanador(null)} disabled={loading} style={{ ...chipStyle, background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            ← volver
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number" min={0} inputMode="numeric" placeholder="G"
            value={customGanador} onChange={e => setCustomGanador(e.target.value)}
            style={numInputStyle} aria-label={`Puntos de ${ganador.nombre}`}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>–</span>
          <input
            type="number" min={0} inputMode="numeric" placeholder="P"
            value={customPerdedor} onChange={e => setCustomPerdedor(e.target.value)}
            style={numInputStyle} aria-label="Puntos del perdedor"
          />
          <button onClick={submitCustom} disabled={loading} style={chipStyle}>Guardar</button>
          <button onClick={() => setCustomOpen(false)} disabled={loading} style={{ ...chipStyle, background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>✕</button>
        </div>
      )}
      {error && <span style={{ fontSize: 10, color: '#f87171' }}>{error}</span>}
    </div>
  )
}

const chipStyle = {
  padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border-gold)',
  background: 'var(--gold-muted)', color: 'var(--gold)',
  fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, cursor: 'pointer',
} as const

const numInputStyle = {
  width: 34, padding: '3px 4px', borderRadius: 5, border: '1px solid var(--border-gold)',
  background: '#0f0f0f', color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)', fontSize: 11, textAlign: 'center',
} as const
