'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PREMIUM_BG_KEYS, PREMIUM_BG_STYLES, PREMIUM_COLOR_DEFAULT, estiloPremium, type PremiumBg } from '@/lib/premium'
import { YoutubeIcon, TwitchIcon, KickIcon } from './PlatformIcons'

const LABEL_STYLE: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }
const limpiarHandle = (v: string, dominio: RegExp) => v.trim().replace(dominio, '').replace(/\/+$/, '')

interface Player {
  id: string
  es_premium?: boolean
  premium_color?: string | null
  premium_bg?: string | null
  twitch_username?: string | null
  youtube_channel?: string | null
  kick_username?: string | null
}

/** Modal único de "canales + apariencia" — antes eran dos botones
 * separados en la card del perfil (Personalizar perfil, Cargar mi
 * canal de Twitch). Los canales son para cualquier jugador; la
 * apariencia (color/fondo) solo para premium, igual que antes.
 *
 * Controlado desde afuera (`open`/`onClose`) a propósito: el botón que
 * lo abre vive en el dropdown del Header, que se desmonta apenas se
 * cierra (onMouseLeave / click). Si este componente manejara su propio
 * estado "open", quedaría adentro de ese árbol que se destruye en el
 * mismo click que lo abre — el modal nunca llegaba a verse. */
export default function EditarPerfil({ player, open, onClose }: { player: Player; open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [twitch, setTwitch] = useState(player.twitch_username ?? '')
  const [youtube, setYoutube] = useState(player.youtube_channel ?? '')
  const [kick, setKick] = useState(player.kick_username ?? '')
  const [color, setColor] = useState(player.premium_color || PREMIUM_COLOR_DEFAULT)
  const [bg, setBg] = useState<PremiumBg>((player.premium_bg as PremiumBg) || 'sutil')
  const [guardando, setGuardando] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  const guardar = async () => {
    setGuardando(true)
    const supabase = createClient()
    const payload: Record<string, any> = {
      twitch_username: limpiarHandle(twitch, /^https?:\/\/(www\.)?twitch\.tv\//i) || null,
      youtube_channel: youtube.trim() || null,
      kick_username: limpiarHandle(kick, /^https?:\/\/(www\.)?kick\.com\//i) || null,
    }
    if (player.es_premium) { payload.premium_color = color; payload.premium_bg = bg }

    const { error } = await supabase.from('players').update(payload).eq('id', player.id)
    setGuardando(false)
    if (!error) { setStatus('ok'); router.refresh(); setTimeout(() => { setStatus('idle'); onClose() }, 900) }
    else setStatus('error')
  }

  const preview = estiloPremium(color, bg)

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-strong)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', padding: '28px 32px', width: '100%', maxWidth: 380, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)', marginBottom: 20, letterSpacing: 1, textAlign: 'center' }}>⚙ Editar perfil</h2>

            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'rgba(212,175,55,0.5)', letterSpacing: 2, marginBottom: 12 }}>CANALES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
              <div>
                <label style={LABEL_STYLE}><TwitchIcon /> TWITCH</label>
                <input value={twitch} onChange={e => setTwitch(e.target.value)} placeholder="tu_usuario" className="field" />
              </div>
              <div>
                <label style={LABEL_STYLE}><YoutubeIcon /> YOUTUBE</label>
                <input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/@tu_canal" className="field" />
                {youtube.trim() && !youtube.includes('youtube.com') && !youtube.includes('youtu.be') && (
                  <p style={{ fontSize: 11, color: '#f87171', margin: '6px 0 0' }}>Eso no parece un link de YouTube.</p>
                )}
              </div>
              <div>
                <label style={LABEL_STYLE}><KickIcon /> KICK</label>
                <input value={kick} onChange={e => setKick(e.target.value)} placeholder="tu_usuario" className="field" />
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'rgba(212,175,55,0.5)', letterSpacing: 2, marginBottom: 12 }}>APARIENCIA</div>
            {player.es_premium ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 'var(--radius-md)', marginBottom: 16, background: 'var(--bg-surface)', border: `1px solid ${preview.border}`, boxShadow: preview.glow ?? 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: preview.color }}>Vista previa 👑</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <label htmlFor="premium-color" style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>COLOR</label>
                  <input id="premium-color" type="color" value={color} onChange={e => setColor(e.target.value)}
                    style={{ width: 40, height: 30, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent', padding: 0 }} />
                </div>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>FONDO</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PREMIUM_BG_KEYS.map(key => (
                      <button key={key} type="button" onClick={() => setBg(key)}
                        className={`segmented-btn${bg === key ? ' is-active' : ''}`} style={{ fontSize: 10, padding: '5px 10px' }}>
                        {PREMIUM_BG_STYLES[key].label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 22 }}>
                🔒 El color y fondo del perfil son para cuentas premium — se activa desde tu perfil.
              </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}>Cerrar</button>
              <button type="button" onClick={guardar} disabled={guardando} className="btn btn-primary" style={{ flex: 1, fontSize: 11 }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            {status === 'ok'    && <p style={{ fontSize: 10, color: '#4CAF50', fontFamily: 'var(--font-display)', textAlign: 'center', marginTop: 10 }}>Guardado</p>}
            {status === 'error' && <p style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-display)', textAlign: 'center', marginTop: 10 }}>Error al guardar</p>}
          </div>
    </div>
  )
}
