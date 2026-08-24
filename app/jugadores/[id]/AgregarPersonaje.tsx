'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { REINOS, CLASES, REINO_COLOR } from '@/lib/constants'
import type { Reino, Clase } from '@/lib/types'

const CLASE_ICON: Record<Clase, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}

export default function AgregarPersonaje({ playerId }: { playerId: string }) {
  const [open, setOpen]         = useState(false)
  const [nickname, setNickname] = useState('')
  const [reino, setReino]       = useState<Reino>('Syrtis')
  const [clase, setClase]       = useState<Clase>('Bárbaro')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [claimable, setClaimable] = useState<{ id: string } | null>(null)
  const [claiming, setClaiming] = useState(false)

  const handleReclamar = async () => {
    if (!claimable) return
    setClaiming(true); setError('')
    try {
      const res = await fetch('/api/personajes/reclamar-cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personajeId: claimable.id, nickname: nickname.trim(), reino, clase }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error || 'No se pudo reclamar el personaje.')
        setClaiming(false)
        return
      }
      window.location.reload()
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.')
      setClaiming(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return setError('El nickname es requerido.')
    setLoading(true); setError(''); setClaimable(null)

    try {
      const supabase = createClient()

      // Verificar disponibilidad. Si es un personaje fantasma sin cuenta
      // vinculada (cargado de un torneo historico), se ofrece reclamarlo.
      const { data: taken } = await supabase
        .from('personajes')
        .select('id, verificado, player:players!personajes_player_id_fkey(user_id)')
        .ilike('nickname_juego', nickname.trim())
        .single()

      if (taken) {
        const player = Array.isArray(taken.player) ? taken.player[0] : taken.player
        const esReclamable = !taken.verificado && !player?.user_id
        if (esReclamable) setClaimable({ id: taken.id })
        else setError('Ese nickname ya está en uso.')
        setLoading(false)
        return
      }

      const { error: err } = await supabase.from('personajes').insert({
        player_id: playerId,
        nickname_juego: nickname.trim(),
        reino,
        clase,
      })

      if (err) {
        setError(err.message.includes('unique') ? 'Ese nickname ya está en uso.' : err.message)
        setLoading(false)
      } else {
        window.location.reload()
      }
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-ghost-gold" style={{ padding: '5px 12px', fontSize: 10 }}>
        + Agregar personaje
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setOpen(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', padding: '32px 40px', width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold)', marginBottom: 20, letterSpacing: 1 }}>Nuevo personaje</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="field-label">NICKNAME EN EL JUEGO</label>
                <input value={nickname} onChange={e => { setNickname(e.target.value); setClaimable(null); setError('') }} maxLength={32} placeholder="Nombre exacto en Regnum"
                  className="field" />
              </div>
              <div>
                <label className="field-label">REINO</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {REINOS.map(r => (
                    <button type="button" key={r} onClick={() => setReino(r)} style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: `2px solid ${reino === r ? REINO_COLOR[r] : 'var(--border)'}`, background: reino === r ? `${REINO_COLOR[r]}18` : 'transparent', color: reino === r ? REINO_COLOR[r] : 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700 }}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">CLASE</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {CLASES.map(c => (
                    <button type="button" key={c} onClick={() => setClase(c)} style={{ padding: '8px 4px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: `2px solid ${clase === c ? 'var(--gold)' : 'var(--border)'}`, background: clase === c ? 'var(--gold-muted)' : 'transparent', color: clase === c ? 'var(--gold)' : 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 16 }}>{CLASE_ICON[c]}</span>{c}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center' }}>{error}</p>}
              {claimable ? (
                <div style={{ border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', background: 'var(--gold-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    Ese nickname existe en el historial de torneos y nadie lo reclamó. Si es tuyo, reclamalo para heredar sus estadísticas.
                  </p>
                  <button type="button" onClick={handleReclamar} disabled={claiming} className="btn btn-primary">
                    {claiming ? 'Reclamando...' : `RECLAMAR "${nickname.trim()}"`}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                    {loading ? 'Guardando...' : 'AGREGAR'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
