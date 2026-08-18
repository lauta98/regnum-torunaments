'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

/** Permite al dueño de un personaje corregir su propio nickname_juego —
 * pensado para typos de tipeo (ej. un nombre largo que se cortó por el
 * límite de caracteres del formulario de alta). Mismo chequeo de
 * disponibilidad case-insensitive que completar-perfil/AgregarPersonaje. */
export default function EditarNickname({ personajeId, nicknameActual }: { personajeId: string; nicknameActual: string }) {
  const [open, setOpen]       = useState(false)
  const [nickname, setNickname] = useState(nicknameActual)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    const limpio = nickname.trim()
    if (!limpio || limpio === nicknameActual) { setOpen(false); return }
    setLoading(true); setError('')
    try {
      const supabase = createClient()

      const { data: taken } = await supabase
        .from('personajes')
        .select('id')
        .ilike('nickname_juego', limpio)
        .neq('id', personajeId)
        .maybeSingle()

      if (taken) { setError('Ese nickname ya está en uso.'); setLoading(false); return }

      const { error: updErr } = await supabase.from('personajes').update({ nickname_juego: limpio }).eq('id', personajeId)
      if (updErr) { setError(updErr.message.includes('unique') ? 'Ese nickname ya está en uso.' : updErr.message); setLoading(false); return }

      window.location.reload()
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setNickname(nicknameActual); setError('') }}
        title="Corregir nickname"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, opacity: 0.4, padding: 2, lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
      >
        ✎
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ background: '#141414', border: '1px solid var(--border-gold)', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 400 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)', marginBottom: 6, letterSpacing: 1 }}>
              Corregir nickname
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
              Para arreglar errores de tipeo. Tu historial de partidos y MMR no se pierden.
            </p>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={32}
                autoFocus
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', borderRadius: 8, color: 'var(--text-primary)', padding: '9px 13px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }}
              />
              {error && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 11, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading || !nickname.trim()} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: nickname.trim() ? 'var(--gold)' : 'rgba(212,175,55,0.3)', color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, cursor: nickname.trim() ? 'pointer' : 'not-allowed' }}>
                  {loading ? 'Guardando...' : 'GUARDAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
