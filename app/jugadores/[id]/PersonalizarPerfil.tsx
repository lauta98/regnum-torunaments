'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PREMIUM_BG_KEYS, PREMIUM_BG_STYLES, PREMIUM_COLOR_DEFAULT, estiloPremium, type PremiumBg } from '@/lib/premium'

/** Botón + popup para que un jugador premium elija su color y estilo de
 * fondo — separado de la card de cuenta (antes estaba siempre visible
 * ahí, "arruinando la estética" según feedback). Escribe directo por
 * RLS (como ElegirPrincipal): los CHECK constraints en la base ya
 * garantizan que esto solo funciona si el jugador es premium. */
export default function PersonalizarPerfil({ playerId, colorActual, bgActual }: { playerId: string; colorActual: string | null; bgActual: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(colorActual || PREMIUM_COLOR_DEFAULT)
  const [bg, setBg] = useState<PremiumBg>((bgActual as PremiumBg) || 'sutil')
  const [guardando, setGuardando] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  const guardar = async () => {
    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').update({ premium_color: color, premium_bg: bg }).eq('id', playerId)
    setGuardando(false)
    if (!error) { setStatus('ok'); router.refresh(); setTimeout(() => setStatus('idle'), 1500) }
    else setStatus('error')
  }

  const preview = estiloPremium(color, bg)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost-gold" style={{ padding: '7px 14px', fontSize: 11 }}>
        🎨 Personalizar perfil
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setOpen(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-strong)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-elevated)', padding: '28px 32px', width: '100%', maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)', marginBottom: 18, letterSpacing: 1, textAlign: 'center' }}>🎨 Personalizar perfil</h2>

            {/* Preview en vivo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 'var(--radius-md)', marginBottom: 20, background: 'var(--bg-surface)', border: `1px solid ${preview.border}`, boxShadow: preview.glow ?? 'none' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: preview.color }}>Vista previa 👑</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <label htmlFor="premium-color" style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>COLOR</label>
              <input id="premium-color" type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 44, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent', padding: 0 }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>FONDO</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PREMIUM_BG_KEYS.map(key => {
                  const activo = bg === key
                  return (
                    <button key={key} type="button" onClick={() => setBg(key)}
                      className={`segmented-btn${activo ? ' is-active' : ''}`} style={{ fontSize: 10, padding: '5px 10px' }}>
                      {PREMIUM_BG_STYLES[key].label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}>Cerrar</button>
              <button type="button" onClick={guardar} disabled={guardando} className="btn btn-ghost-gold" style={{ flex: 1, fontSize: 11 }}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            {status === 'ok'    && <p style={{ fontSize: 10, color: '#4CAF50', fontFamily: 'var(--font-display)', textAlign: 'center', marginTop: 10 }}>Guardado</p>}
            {status === 'error' && <p style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-display)', textAlign: 'center', marginTop: 10 }}>Error al guardar</p>}
          </div>
        </div>
      )}
    </>
  )
}
