'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Equipo = { id: string; nombre: string; seed: number | null }

export default function GenerarBracketButton({ torneoId, inscritos, bracketType, equipos }: { torneoId: string; inscritos: number; bracketType: string; equipos: Equipo[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [eligiendo, setEligiendo] = useState(false)
  const [ordenando, setOrdenando] = useState(false)
  // Arranca en el orden de semilla ya guardado (si hay), si no en el orden
  // en que llegaron inscriptos.
  const [orden, setOrden] = useState<Equipo[]>(() =>
    [...equipos].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
  )

  const generar = async (body?: { orden: string[] }) => {
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/generar-bracket`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al generar el cuadro')
      setLoading(false)
    }
  }

  const generarRapido = () => {
    if (!confirm(`¿Generar el cuadro con los ${inscritos} equipos inscriptos, todos sorteados al azar de una? Ya no se van a poder inscribir más equipos después de esto.`)) return
    generar()
  }

  const mover = (idx: number, dir: -1 | 1) => {
    setOrden(o => {
      const next = [...o]
      const j = idx + dir
      if (j < 0 || j >= next.length) return o
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  const guardarYGenerar = async () => {
    if (!confirm(`¿Generar el cuadro con este orden de semillas? Ya no se van a poder inscribir más equipos después de esto.`)) return
    setLoading(true); setError('')
    const supabase = createClient()
    // Persiste el número de semilla de cada equipo antes de generar, para
    // que quede guardado como referencia aunque después se regenere.
    for (let i = 0; i < orden.length; i++) {
      await supabase.from('tournament_registrations').update({ seed: i + 1 }).eq('tournament_id', torneoId).eq('team_id', orden[i].id)
    }
    generar({ orden: orden.map(e => e.id) })
  }

  const puedeSortearEnVivo = bracketType !== 'round_robin' && bracketType !== 'double_elimination' && bracketType !== 'league_cup'
  const puedeSembrar = bracketType === 'single_elimination' || bracketType === 'double_elimination'

  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
        El bracket aún no está disponible.
      </p>

      {inscritos < 2 ? (
        <button disabled style={{
          background: 'var(--bg-surface)', color: 'var(--text-muted)',
          padding: '12px 28px', borderRadius: 8, border: 'none',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'not-allowed',
        }}>
          Hacen falta al menos 2 equipos
        </button>
      ) : ordenando ? (
        <div style={{ maxWidth: 380, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>
            El #1 arranca contra el último — así se reparten los favoritos por el cuadro.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {orden.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', width: 20, flexShrink: 0 }}>#{i + 1}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre}</span>
                <button onClick={() => mover(i, -1)} disabled={i === 0} style={arrowStyle}>▲</button>
                <button onClick={() => mover(i, 1)} disabled={i === orden.length - 1} style={arrowStyle}>▼</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setOrdenando(false)} disabled={loading} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--text-muted)', padding: '9px 16px', fontFamily: 'var(--font-display)', fontSize: 11, cursor: 'pointer' }}>
              Volver
            </button>
            <button onClick={guardarYGenerar} disabled={loading} style={{ background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#000', padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Generando...' : 'Generar con este orden'}
            </button>
          </div>
        </div>
      ) : !eligiendo ? (
        <button onClick={() => setEligiendo(true)} style={{
          background: 'var(--gold)', color: '#000', padding: '12px 28px', borderRadius: 8, border: 'none',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
        }}>
          ⚔ Generar cuadro ({inscritos} equipos)
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 780, margin: '0 auto' }}>
          <button onClick={generarRapido} disabled={loading} style={{
            flex: '1 1 220px', background: 'var(--bg-card)', border: '2px solid var(--border-gold)',
            borderRadius: 10, padding: '18px 16px', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
              ⚡ Rápido
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Todos los equipos sorteados de una, al instante.
            </div>
          </button>

          {puedeSortearEnVivo && (
            <Link href={`/brackets/${torneoId}/sorteo`} style={{
              flex: '1 1 220px', background: 'var(--bg-card)', border: '2px solid var(--border-gold)',
              borderRadius: 10, padding: '18px 16px', textDecoration: 'none', display: 'block', textAlign: 'left',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
                🎥 En vivo
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Ideal para stream — se sortea de a un equipo por vez.
              </div>
            </Link>
          )}

          {puedeSembrar && (
            <button onClick={() => setOrdenando(true)} style={{
              flex: '1 1 220px', background: 'var(--bg-card)', border: '2px solid var(--border-gold)',
              borderRadius: 10, padding: '18px 16px', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
                🔢 Por semilla
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Elegís vos el orden — para separar a los favoritos.
              </div>
            </button>
          )}
        </div>
      )}
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 14 }}>{error}</p>}
    </div>
  )
}

const arrowStyle = {
  width: 22, height: 22, borderRadius: 5, cursor: 'pointer', flexShrink: 0,
  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-muted)', fontSize: 9,
} as const
