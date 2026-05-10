'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { REINOS, CLASES, REINO_COLOR } from '@/lib/constants'
import type { Reino, Clase } from '@/lib/types'

const CLASE_ICON: Record<Clase, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}

export default function CompletarPerfilPage() {
  const router = useRouter()
  const [nickname, setNickname]   = useState('')
  const [reino, setReino]         = useState<Reino>('Syrtis')
  const [clase, setClase]         = useState<Clase>('Bárbaro')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return setError('El nickname es requerido.')
    setLoading(true); setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('players').upsert({
      user_id:         user.id,
      nickname_juego:  nickname.trim().toUpperCase(),
      reino,
      clase_principal: clase,
      discord_username: user.user_metadata?.full_name,
      discord_avatar:   user.user_metadata?.avatar_url,
    }, { onConflict: 'user_id' })

    if (err) {
      setError(err.message.includes('unique') ? 'Ese nickname ya está en uso.' : err.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-surface)',
    border: '1px solid var(--border-gold)', borderRadius: 8,
    color: 'var(--text-primary)', padding: '10px 14px',
    fontSize: 14, fontFamily: 'var(--font-display)', outline: 'none',
  } as const

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
        borderRadius: 16, padding: '40px 48px', width: '100%', maxWidth: 480,
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--gold)', marginBottom: 8, letterSpacing: 1 }}>
          Completar Perfil
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
          Configurá tu personaje en Champions of Regnum.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>
              NICKNAME EN EL JUEGO
            </label>
            <input
              style={inputStyle} value={nickname} maxLength={24} placeholder="Tu nombre en Regnum"
              onChange={e => setNickname(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>
              REINO
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {REINOS.map(r => (
                <button type="button" key={r} onClick={() => setReino(r)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${reino === r ? REINO_COLOR[r] : 'var(--border)'}`,
                  background: reino === r ? `${REINO_COLOR[r]}18` : 'transparent',
                  color: reino === r ? REINO_COLOR[r] : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                }}>{r}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10 }}>
              CLASE PRINCIPAL
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {CLASES.map(c => (
                <button type="button" key={c} onClick={() => setClase(c)} style={{
                  padding: '10px 6px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${clase === c ? 'var(--gold)' : 'var(--border)'}`,
                  background: clase === c ? 'var(--gold-muted)' : 'transparent',
                  color: clase === c ? 'var(--gold)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 20 }}>{CLASE_ICON[c]}</span>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            padding: '12px', borderRadius: 10, border: 'none',
            background: loading ? 'var(--bg-surface)' : 'var(--gold)',
            color: loading ? 'var(--text-muted)' : '#000',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: 1,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
          }}>
            {loading ? 'Guardando...' : 'EMPEZAR A COMPETIR'}
          </button>
        </form>
      </div>
    </div>
  )
}
