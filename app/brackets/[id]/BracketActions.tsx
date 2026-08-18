'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** El texto guardado es siempre "{nombre del que ganó} {suPuntaje} -
 *  {puntaje del otro} {nombre del que perdió}" — el ganador no
 *  siempre es "equipo A", así que hay que fijarse qué nombre aparece
 *  primero en el texto para saber a quién le corresponde cada número
 *  (asumir el orden a ciegas invierte el resultado al pre-cargarlo). */
function prefillScores(resultado: string | null | undefined, teamA: { nombre: string }, teamB: { nombre: string }): [string, string] {
  if (!resultado) return ['', '']
  const m = resultado.match(/(\d+)\s*-\s*(\d+)/)
  if (!m) return ['', '']
  const idxA = resultado.indexOf(teamA.nombre)
  const idxB = resultado.indexOf(teamB.nombre)
  const aApareceAntes = idxA !== -1 && (idxB === -1 || idxA <= idxB)
  return aApareceAntes ? [m[1], m[2]] : [m[2], m[1]]
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
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'closed' | 'score' | 'ko' | 'revertir'>('closed')
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [error, setError] = useState('')

  const abrirEdicion = () => {
    const [pa, pb] = prefillScores(resultadoActual, teamA, teamB)
    setScoreA(pa); setScoreB(pb)
    setView('score')
  }

  const reset = () => {
    setView('closed'); setScoreA(''); setScoreB(''); setError('')
  }

  const submit = async (body: Record<string, unknown>) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, editar: isPlayed }),
      })
      if (res.ok) {
        router.refresh()
        reset()
        return
      }
      const d = await res.json().catch(() => null)
      setError(d?.error ?? `Error al guardar resultado (${res.status})`)
    } catch {
      setError('No se pudo conectar con el servidor — probá de nuevo')
    } finally {
      setLoading(false)
    }
  }

  const sa = Number(scoreA)
  const sb = Number(scoreB)
  const scoreValido = Number.isInteger(sa) && Number.isInteger(sb) && sa >= 0 && sb >= 0 && sa !== sb && scoreA !== '' && scoreB !== ''
  const ganadorPreview = scoreValido ? (sa > sb ? teamA : teamB) : null

  const submitScore = () => {
    if (!scoreValido) { setError('Marcador inválido'); return }
    const ganador = sa > sb ? teamA : teamB
    submit({ ganador_id: ganador.id, score_ganador: Math.max(sa, sb), score_perdedor: Math.min(sa, sb) })
  }

  const submitWalkover = (ganadorId: string) => submit({ ganador_id: ganadorId, walkover: true })

  const revertir = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
      if (res.ok) { router.refresh(); reset(); return }
      const d = await res.json().catch(() => null)
      setError(d?.error ?? `Error al revertir (${res.status})`)
    } catch {
      setError('No se pudo conectar con el servidor — probá de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {isPlayed ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={abrirEdicion} aria-label="Corregir resultado" style={editBtnStyle}>
            ✎ Corregir
          </button>
          <button onClick={() => setView('revertir')} aria-label="Revertir resultado" title="Revertir a pendiente" style={{ ...editBtnStyle, color: '#f87171', borderColor: 'rgba(244,113,113,0.35)' }}>
            ↺
          </button>
        </div>
      ) : (
        <button onClick={() => setView('score')} style={{
          background: 'var(--gold-muted)', border: '1px solid var(--border-gold-strong)',
          color: 'var(--gold)', padding: '2px 8px', borderRadius: 6,
          fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1, cursor: 'pointer',
        }}>
          RESULTADO
        </button>
      )}

      {view !== 'closed' && (
      <div style={popoverStyle} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: view === 'revertir' ? '#f87171' : 'var(--gold)', letterSpacing: 1, marginBottom: 10 }}>
          {view === 'revertir' ? 'REVERTIR RESULTADO' : isPlayed ? 'CORREGIR RESULTADO' : 'CARGAR RESULTADO'}
        </div>

        {view === 'revertir' && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
              Esto deshace el mmr que se aplicó con este resultado y deja el partido en pendiente otra vez. No se puede si el equipo que ganó ya jugó la ronda siguiente.
            </div>
            {loading ? (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>Revirtiendo…</div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={revertir} style={{ ...btnStyle, flex: 1, color: '#f87171', borderColor: 'rgba(244,113,113,0.4)' }}>Sí, revertir</button>
                <button onClick={reset} style={ghostBtnStyle}>Cancelar</button>
              </div>
            )}
          </>
        )}

        {view === 'score' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              <ScoreRow nombre={teamA.nombre} value={scoreA} onChange={setScoreA} onEnter={submitScore} />
              <ScoreRow nombre={teamB.nombre} value={scoreB} onChange={setScoreB} onEnter={submitScore} />
            </div>

            <div style={{ minHeight: 16, marginBottom: 10, fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
              {ganadorPreview && `→ Gana ${ganadorPreview.nombre} (${Math.max(sa, sb)}-${Math.min(sa, sb)})`}
            </div>

            {loading ? (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>Guardando…</div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={submitScore} style={{ ...btnStyle, flex: 1 }}>Guardar</button>
                <button onClick={() => setView('ko')} style={{ ...btnStyle, color: '#f87171', borderColor: 'rgba(244,113,113,0.4)' }}>Abandono</button>
                <button onClick={reset} style={ghostBtnStyle}>Cancelar</button>
              </div>
            )}
          </>
        )}

        {view === 'ko' && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>¿Quién ganó por abandono del rival?</div>
            {loading ? (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>Guardando…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => submitWalkover(teamA.id)} style={btnStyle}>{teamA.nombre}</button>
                <button onClick={() => submitWalkover(teamB.id)} style={btnStyle}>{teamB.nombre}</button>
                <button onClick={() => setView('score')} style={ghostBtnStyle}>← Volver</button>
              </div>
            )}
          </>
        )}

        {error && <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>{error}</div>}
      </div>
      )}
    </div>
  )
}

function ScoreRow({ nombre, value, onChange, onEnter }: { nombre: string; value: string; onChange: (v: string) => void; onEnter: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {nombre}
      </span>
      <input
        type="number" min={0} inputMode="numeric" value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter()}
        style={numInputStyle} aria-label={`Puntos de ${nombre}`}
      />
    </div>
  )
}

const editBtnStyle = {
  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
  padding: '2px 8px', borderRadius: 6,
  fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, cursor: 'pointer',
} as const

const popoverStyle = {
  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
  width: 230, padding: '12px 14px', borderRadius: 10,
  background: '#141414', border: '1px solid var(--border-gold)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
} as const

const btnStyle = {
  padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-gold)',
  background: 'var(--gold-muted)', color: 'var(--gold)',
  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
} as const

const ghostBtnStyle = {
  ...btnStyle, background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)',
} as const

const numInputStyle = {
  width: 44, padding: '5px 4px', borderRadius: 6, border: '1px solid var(--border-gold)',
  background: '#0f0f0f', color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)', fontSize: 13, textAlign: 'center',
} as const
