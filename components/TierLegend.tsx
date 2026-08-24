'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MMR_TIERS, MMR_INITIAL, ELO_K_DEFAULT, ELO_K_VETERAN, ELO_VETERAN_THRESHOLD } from '@/lib/constants'

/* Botón + panel desplegable: cómo se calcula el MMR y qué tiers existen.
 * Colapsado por defecto para no empujar el resto de la página cuando
 * nadie lo está mirando. */
export default function TierLegend() {
  const [open, setOpen] = useState(false)
  const tiersAscendente = [...MMR_TIERS].reverse()

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: open ? 'var(--gold-muted)' : 'var(--bg-card)',
          border: `1px solid ${open ? 'var(--border-gold-strong)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '8px 14px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5,
          color: open ? 'var(--gold)' : 'var(--text-muted)',
        }}
      >
        ¿Cómo funciona el MMR? <span style={{ fontSize: 9, transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 20,
          background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)',
          padding: '14px 16px', width: 260,
          boxShadow: 'var(--shadow-elevated)',
        }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
            Todo personaje arranca en <b style={{ color: 'var(--text-secondary)' }}>{MMR_INITIAL}</b>. Cada partida suma o resta puntos según qué tan probable era el resultado — vencer a alguien mejor rankeado da más puntos que vencer a alguien peor rankeado. Después de {ELO_VETERAN_THRESHOLD} partidas los cambios se achican (de {ELO_K_DEFAULT} a {ELO_K_VETERAN} puntos por partida) para que el ranking se estabilice.
          </p>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {tiersAscendente.map(t => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className={`tier-pill ${t.cssClass}`}>{t.icon} {t.name}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>
                  {t.min > 0 ? `${t.min}+` : '< 900'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
          <Link href="/mmr" onClick={() => setOpen(false)} style={{
            display: 'block', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10.5,
            color: 'var(--gold)', textDecoration: 'none', letterSpacing: 0.3,
          }}>
            Ver la fórmula completa →
          </Link>
        </div>
      )}
    </div>
  )
}
