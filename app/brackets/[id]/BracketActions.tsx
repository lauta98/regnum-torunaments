'use client'
import { useState } from 'react'

function truncar(nombre: string, max = 12) {
  return nombre.length > max ? nombre.slice(0, max - 1) + '…' : nombre
}

export default function BracketActions({
  matchId,
  teamA,
  teamB,
  isPlayed,
  resultadoActual,
}: {
  matchId: string
  teamA: { id: string; nombre: string }
  teamB: { id: string; nombre: string }
  isPlayed?: boolean
  resultadoActual?: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'closed' | 'score' | 'ko'>('closed')

  const scoreMatch = resultadoActual?.match(/(\d+)\s*-\s*(\d+)/)
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [error, setError] = useState('')

  const abrirEdicion = () => {
    if (scoreMatch) { setScoreA(scoreMatch[1]); setScoreB(scoreMatch[2]) }
    setView('score')
  }

  const reset = () => {
    setView('closed'); setScoreA(''); setScoreB(''); setError('')
  }

  const submit = async (body: Record<string, unknown>) => {
    setLoading(true); setError('')
    const res = await fetch(`/api/matches/${matchId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, editar: isPlayed }),
    })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al guardar resultado')
      setLoading(false)
    }
  }

  const submitScore = () => {
    const sa = Number(scoreA)
    const sb = Number(scoreB)
    if (!Number.isInteger(sa) || !Number.isInteger(sb) || sa < 0 || sb < 0 || sa === sb) {
      setError('Marcador inválido')
      return
    }
    const ganador = sa > sb ? teamA : teamB
    submit({ ganador_id: ganador.id, score_ganador: Math.max(sa, sb), score_perdedor: Math.min(sa, sb) })
  }

  const submitWalkover = (ganadorId: string) => submit({ ganador_id: ganadorId, walkover: true })

  if (view === 'closed') {
    if (isPlayed) {
      return (
        <button onClick={abrirEdicion} aria-label="Editar resultado" title="Editar resultado" style={editIconStyle}>
          ✎
        </button>
      )
    }
    return (
      <button onClick={() => setView('score')} style={{
        background: 'var(--gold-muted)', border: '1px solid var(--border-gold-strong)',
        color: 'var(--gold)', padding: '2px 8px', borderRadius: 6,
        fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1, cursor: 'pointer',
      }}>
        RESULTADO
      </button>
    )
  }

  if (view === 'ko') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: 'var(--text-muted)' }}>GANÓ POR ABANDONO:</span>
          <button onClick={() => submitWalkover(teamA.id)} disabled={loading} title={teamA.nombre} style={chipStyle}>{truncar(teamA.nombre)}</button>
          <button onClick={() => submitWalkover(teamB.id)} disabled={loading} title={teamB.nombre} style={chipStyle}>{truncar(teamB.nombre)}</button>
          <button onClick={() => setView('score')} disabled={loading} style={ghostChipStyle}>✕</button>
        </div>
        {error && <span style={{ fontSize: 10, color: '#f87171' }}>{error}</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0' }}>
      {isPlayed && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1 }}>CORREGIR RESULTADO</div>
      )}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <span title={teamA.nombre} style={teamLabelStyle}>{truncar(teamA.nombre)}</span>
        <input
          type="number" min={0} inputMode="numeric" value={scoreA}
          onChange={e => setScoreA(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitScore()}
          style={numInputStyle} aria-label={`Puntos de ${teamA.nombre}`}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>–</span>
        <input
          type="number" min={0} inputMode="numeric" value={scoreB}
          onChange={e => setScoreB(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitScore()}
          style={numInputStyle} aria-label={`Puntos de ${teamB.nombre}`}
        />
        <span title={teamB.nombre} style={teamLabelStyle}>{truncar(teamB.nombre)}</span>
        <button onClick={submitScore} disabled={loading} style={chipStyle}>✓</button>
        <button onClick={() => setView('ko')} disabled={loading} style={{ ...chipStyle, color: '#f87171', borderColor: 'rgba(244,113,113,0.4)' }}>KO</button>
        <button onClick={reset} disabled={loading} style={ghostChipStyle}>✕</button>
      </div>
      {error && <span style={{ fontSize: 10, color: '#f87171' }}>{error}</span>}
    </div>
  )
}

const chipStyle = {
  padding: '3px 7px', borderRadius: 5, border: '1px solid var(--border-gold)',
  background: 'var(--gold-muted)', color: 'var(--gold)',
  fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, cursor: 'pointer',
} as const

const ghostChipStyle = {
  ...chipStyle, background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)',
} as const

const editIconStyle = {
  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
  width: 18, height: 18, borderRadius: 5, fontSize: 10, lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
} as const

const teamLabelStyle = {
  fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-secondary)',
  maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
} as const

const numInputStyle = {
  width: 26, padding: '2px 3px', borderRadius: 5, border: '1px solid var(--border-gold)',
  background: '#0f0f0f', color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)', fontSize: 11, textAlign: 'center',
} as const
