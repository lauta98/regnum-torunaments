'use client'
import { useState } from 'react'

// Motivos frecuentes de abandono, tildables — evitan tener que redactar
// el mismo texto cada vez y mantienen consistencia entre organizadores.
// "Otro (detallar abajo)" habilita la nota libre para casos puntuales.
const MOTIVOS_ABANDONO = [
  'No se presentó a la hora pactada',
  'Abandonó la partida a mitad de juego',
  'No respondió a los intentos de contacto',
  'Se retiró voluntariamente del torneo',
  'Conducta antideportiva / incumplimiento de reglas',
] as const

export default function ExpulsarButton({ torneoId, teamId, teamNombre }: { torneoId: string; teamId: string; teamNombre: string }) {
  const [open, setOpen] = useState(false)
  const [motivos, setMotivos] = useState<string[]>([])
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleMotivo = (m: string) => {
    setMotivos(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
    setError('')
  }

  const confirmar = async () => {
    const motivo = [...motivos, nota.trim()].filter(Boolean).join(' — ')
    if (!motivo) { setError('Marcá al menos un motivo o agregá una nota'); return }
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/expulsar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: teamId, motivo }),
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
        {MOTIVOS_ABANDONO.map(m => {
          const checked = motivos.includes(m)
          return (
            <label key={m} style={{
              display: 'flex', alignItems: 'flex-start', gap: 7, cursor: 'pointer',
              fontSize: 11, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.3,
            }}>
              <input
                type="checkbox" checked={checked} onChange={() => toggleMotivo(m)}
                style={{ marginTop: 1, accentColor: '#f44336', cursor: 'pointer', flexShrink: 0 }}
              />
              {m}
            </label>
          )
        })}
      </div>
      <textarea
        value={nota}
        onChange={e => { setNota(e.target.value); setError('') }}
        placeholder="Nota adicional (opcional)"
        maxLength={300}
        style={{
          width: '100%', minHeight: 44, background: 'var(--bg-surface)', border: '1px solid var(--border)',
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
