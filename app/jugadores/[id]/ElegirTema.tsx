'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PREMIUM_THEMES, PREMIUM_THEME_KEYS, type PremiumTheme } from '@/lib/premium'

/** El picker escribe directo por RLS (como ElegirPrincipal) — el CHECK
 * constraint `premium_theme_requiere_premium` en la base ya garantiza que
 * esto solo funciona si el jugador es premium, así que no hace falta una
 * API route nueva para validarlo del lado del servidor. */
export default function ElegirTema({ playerId, temaActual }: { playerId: string; temaActual: string | null }) {
  const [tema, setTema] = useState<string | null>(temaActual)
  const [loading, setLoading] = useState<PremiumTheme | null>(null)

  const elegir = async (key: PremiumTheme) => {
    if (key === tema || loading) return
    setLoading(key)
    const supabase = createClient()
    const { error } = await supabase.from('players').update({ premium_theme: key }).eq('id', playerId)
    if (!error) setTema(key)
    setLoading(null)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {PREMIUM_THEME_KEYS.map(key => {
        const t = PREMIUM_THEMES[key]
        const activo = tema === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => elegir(key)}
            disabled={loading !== null}
            title={t.label}
            style={{
              width: 22, height: 22, borderRadius: '50%', cursor: loading ? 'not-allowed' : 'pointer',
              background: t.color, border: activo ? '2px solid #fff' : `1px solid ${t.border}`,
              boxShadow: activo ? `0 0 8px ${t.glow}` : 'none', padding: 0,
              opacity: loading && loading !== key ? 0.5 : 1,
            }}
          />
        )
      })}
    </div>
  )
}
