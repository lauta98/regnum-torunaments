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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return setError('El nickname es requerido.')
    setLoading(true); setError('')

    const supabase = createClient()

    // Verificar disponibilidad
    const { data: taken } = await supabase
      .from('personajes')
      .select('id')
      .ilike('nickname_juego', nickname.trim())
      .single()

    if (taken) { setError('Ese nickname ya está en uso.'); setLoading(false); return }

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
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6, color: 'var(--gold)', padding: '5px 12px', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5, cursor: 'pointer' }}>
        + Agregar personaje
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setOpen(false)}>
          <div style={{ background: '#141414', border: '1px solid var(--border-gold)', borderRadius: 14, padding: '32px 40px', width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold)', marginBottom: 20, letterSpacing: 1 }}>Nuevo personaje</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>NICKNAME EN EL JUEGO</label>
                <input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={24} placeholder="Nombre exacto en Regnum"
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', borderRadius: 8, color: 'var(--text-primary)', padding: '9px 13px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>REINO</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {REINOS.map(r => (
                    <button type="button" key={r} onClick={() => setReino(r)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, cursor: 'pointer', border: `2px solid ${reino === r ? REINO_COLOR[r] : 'var(--border)'}`, background: reino === r ? `${REINO_COLOR[r]}18` : 'transparent', color: reino === r ? REINO_COLOR[r] : 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700 }}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>CLASE</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {CLASES.map(c => (
                    <button type="button" key={c} onClick={() => setClase(c)} style={{ padding: '8px 4px', borderRadius: 7, cursor: 'pointer', border: `2px solid ${clase === c ? 'var(--gold)' : 'var(--border)'}`, background: clase === c ? 'var(--gold-muted)' : 'transparent', color: clase === c ? 'var(--gold)' : 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 16 }}>{CLASE_ICON[c]}</span>{c}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Guardando...' : 'AGREGAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
