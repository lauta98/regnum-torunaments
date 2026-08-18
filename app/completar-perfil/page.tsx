'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { REINOS, CLASES, REINO_COLOR } from '@/lib/constants'
import type { Reino, Clase } from '@/lib/types'
import dynamic from 'next/dynamic'

const CLASE_ICON: Record<Clase, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}

function CompletarPerfilPage() {
  const router = useRouter()
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
        setError(body.error || 'No se pudo reclamar la cuenta. Probá de nuevo.')
        setClaiming(false)
        return
      }
      router.push(`/jugadores/${body.playerId}`)
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
      await handleSubmitInner()
    } catch {
      setError('No se pudo conectar con el servidor. Probá de nuevo.')
      setLoading(false)
    }
  }

  const handleSubmitInner = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 1. Verificar disponibilidad del nickname (case-insensitive). Si existe
    // pero es un personaje fantasma (sin cuenta vinculada, no verificado)
    // cargado de un torneo historico, se ofrece reclamarlo en vez de bloquear.
    const { data: taken } = await supabase
      .from('personajes')
      .select('id, verificado, player:players!personajes_player_id_fkey(user_id)')
      .ilike('nickname_juego', nickname.trim())
      .single()

    if (taken) {
      const player = Array.isArray(taken.player) ? taken.player[0] : taken.player
      const esReclamable = !taken.verificado && !player?.user_id
      if (esReclamable) {
        setClaimable({ id: taken.id })
      } else {
        setError('Ese nickname ya está en uso.')
      }
      setLoading(false)
      return
    }

    // 2. Obtener o crear el registro de cuenta (players)
    let playerId: string
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      playerId = existing.id
      // Actualizar avatar por si cambió
      await supabase.from('players').update({
        discord_username: user.user_metadata?.full_name,
        discord_avatar:   user.user_metadata?.avatar_url,
      }).eq('id', playerId)
    } else {
      const { data: created, error: createErr } = await supabase
        .from('players')
        .insert({
          user_id:          user.id,
          discord_username: user.user_metadata?.full_name,
          discord_avatar:   user.user_metadata?.avatar_url,
        })
        .select('id')
        .single()

      if (createErr || !created) {
        setError('Error creando tu cuenta. Intentá de nuevo.')
        setLoading(false)
        return
      }
      playerId = created.id
    }

    // 3. Crear el personaje
    const { error: personajeErr } = await supabase.from('personajes').insert({
      player_id:     playerId,
      nickname_juego: nickname.trim(),
      reino,
      clase,
    })

    if (personajeErr) {
      setError(personajeErr.message.includes('unique')
        ? 'Ese nickname ya está en uso.'
        : personajeErr.message)
      setLoading(false)
    } else {
      router.push(`/jugadores/${playerId}`)
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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--gold)', marginBottom: 6, letterSpacing: 1 }}>
          Tu primer personaje
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
          Registrá tu personaje principal en Champions of Regnum. Podrás agregar más desde tu perfil.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>
              NICKNAME EN EL JUEGO
            </label>
            <input
              style={inputStyle} value={nickname} maxLength={24}
              placeholder="Tu nombre exacto en Regnum"
              onChange={e => { setNickname(e.target.value); setClaimable(null); setError('') }}
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
              CLASE
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

          {claimable ? (
            <div style={{
              border: '1px solid var(--border-gold)', borderRadius: 10, padding: '14px 16px',
              background: 'var(--gold-muted)', display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                Ese nickname ya existe en el historial de torneos pero nadie lo reclamó todavía.
                Si sos vos, reclamalo para heredar tus estadísticas y tu MMR.
              </p>
              <button type="button" onClick={handleReclamar} disabled={claiming} style={{
                padding: '10px', borderRadius: 8, border: 'none',
                background: claiming ? 'var(--bg-surface)' : 'var(--gold)',
                color: claiming ? 'var(--text-muted)' : '#000',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
                cursor: claiming ? 'not-allowed' : 'pointer',
              }}>
                {claiming ? 'Reclamando...' : `RECLAMAR "${nickname.trim()}"`}
              </button>
            </div>
          ) : (
            <button type="submit" disabled={loading} style={{
              padding: '12px', borderRadius: 10, border: 'none',
              background: loading ? 'var(--bg-surface)' : 'var(--gold)',
              color: loading ? 'var(--text-muted)' : '#000',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: 1,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
            }}>
              {loading ? 'Guardando...' : 'EMPEZAR A COMPETIR'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(CompletarPerfilPage), { ssr: false })
