'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function GenerarBracketButton({ torneoId, inscritos, bracketType }: { torneoId: string; inscritos: number; bracketType: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [eligiendo, setEligiendo] = useState(false)

  const generarRapido = async () => {
    if (!confirm(`¿Generar el cuadro con los ${inscritos} equipos inscriptos, todos sorteados al azar de una? Ya no se van a poder inscribir más equipos después de esto.`)) return
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/generar-bracket`, { method: 'POST' })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al generar el cuadro')
      setLoading(false)
    }
  }

  const puedeSortearEnVivo = bracketType !== 'round_robin' && bracketType !== 'double_elimination' && bracketType !== 'league_cup'

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
      ) : !eligiendo ? (
        <button onClick={() => setEligiendo(true)} style={{
          background: 'var(--gold)', color: '#000', padding: '12px 28px', borderRadius: 8, border: 'none',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
        }}>
          ⚔ Generar cuadro ({inscritos} equipos)
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 560, margin: '0 auto' }}>
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
        </div>
      )}
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 14 }}>{error}</p>}
    </div>
  )
}
