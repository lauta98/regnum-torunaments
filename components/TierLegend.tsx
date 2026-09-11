'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MMR_TIERS, MMR_INITIAL, ELO_K_DEFAULT, ELO_K_VETERAN, ELO_VETERAN_THRESHOLD } from '@/lib/constants'
import { TIER_ICON_BY_RANK } from './RankingIcons'

/* Botón + panel desplegable: cómo se calcula el MMR y qué tiers existen.
 * Colapsado por defecto para no empujar el resto de la página cuando
 * nadie lo está mirando. */
export default function TierLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: open ? 'var(--bg-input)' : 'var(--bg-card)',
          border: `1px solid ${open ? 'var(--gold)' : 'var(--border)'}`,
          padding: '9px 14px', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: open ? 'var(--gold)' : 'var(--text-muted)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="16" y2="12" strokeLinecap="round" /><line x1="12" x2="12.01" y1="8" y2="8" strokeLinecap="round" />
        </svg>
        ¿Cómo funciona el MMR?
        <span style={{ fontSize: 9, transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 20,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          padding: '16px', width: 'min(90vw, 620px)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
            <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, maxWidth: 420 }}>
              Todo personaje arranca en <b style={{ color: 'var(--text-primary)' }}>{MMR_INITIAL}</b>. Cada partida suma o resta puntos según qué tan probable era el resultado. Después de {ELO_VETERAN_THRESHOLD} partidas los cambios se achican (de {ELO_K_DEFAULT} a {ELO_K_VETERAN} puntos por partida) para que el ranking se estabilice.
            </p>
            <Link href="/mmr" onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--gold)', textDecoration: 'none', alignSelf: 'flex-start',
            }}>
              Ver fórmula completa →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            {MMR_TIERS.map((t, i) => {
              const Icon = TIER_ICON_BY_RANK[i]
              return (
                <div key={t.name} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: t.color }}>TIER {MMR_TIERS.length - i}</span>
                    <Icon size={13} style={{ color: t.color }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '6px 0 2px' }}>{t.name}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: t.color, margin: 0 }}>
                    {t.min > 0 ? `${t.min}+ MMR` : '< 900 MMR'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
