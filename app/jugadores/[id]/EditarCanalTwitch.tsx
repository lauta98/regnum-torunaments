'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/** Campo de perfil propio — se define una vez, como el avatar o la bio,
 * a diferencia de un video compartido que sí es un post nuevo cada vez.
 * Escritura directa por RLS (players_update_own), mismo patrón que
 * ElegirPrincipal. */
export default function EditarCanalTwitch({ playerId, usernameActual }: { playerId: string; usernameActual: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState(usernameActual ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const limpiar = (v: string) => v.trim().replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '').replace(/\/+$/, '')

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    const limpio = limpiar(username)
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: updErr } = await supabase.from('players').update({ twitch_username: limpio || null }).eq('id', playerId)
    setLoading(false)
    if (updErr) { setError('No se pudo guardar.'); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setUsername(usernameActual ?? ''); setError('') }}
        className="btn btn-ghost-gold"
        style={{ padding: '6px 12px', fontSize: 10 }}
      >
        {usernameActual ? `🟣 twitch.tv/${usernameActual}` : '🟣 Cargar mi canal de Twitch'}
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setOpen(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', padding: '28px 32px', width: '100%', maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)', marginBottom: 6, letterSpacing: 1 }}>Canal de Twitch</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
              Tu nombre de usuario de Twitch — cuando estés en vivo transmitiendo Champions of Regnum, vas a aparecer en la pestaña Multimedia.
            </p>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="tu_usuario"
                maxLength={64}
                autoFocus
                className="field"
              />
              {error && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
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
