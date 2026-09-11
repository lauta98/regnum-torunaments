'use client'
/** Íconos de línea de Ranking — reemplaza los emoji que usaba la página
 *  (🥇🥈🥉🔥🎭✓). Las formas de TIER_ICON vienen del mockup de Stitch
 *  (una por posición de rango, 7 en total); los colores/nombres/umbrales
 *  siguen siendo los reales de lib/constants.ts MMR_TIERS, no los que
 *  Stitch inventó. */
import type { CSSProperties } from 'react'

type IconProps = { size?: number; style?: CSSProperties; className?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 })

/** Una forma por posición de rango (índice = posición en MMR_TIERS,
 *  0 = tier más alto). Mismo orden y cantidad que el mockup de Stitch. */
export const TIER_ICON_BY_RANK: React.FC<IconProps>[] = [
  // 0 — Raptor de Almas (tier más alto): estrella de 8 puntas
  ({ size = 14, style, className }) => (
    <svg {...base(size)} style={style} className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  // 1 — Evendim: escudo
  ({ size = 14, style, className }) => (
    <svg {...base(size)} style={style} className={className}>
      <path d="M12 2 3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5Z" strokeLinejoin="round" />
    </svg>
  ),
  // 2 — Daen Rah: espadas cruzadas
  ({ size = 14, style, className }) => (
    <svg {...base(size)} style={style} className={className}>
      <line x1="18" x2="6" y1="2" y2="22" strokeLinecap="round" />
      <line x1="6" x2="18" y1="2" y2="22" strokeLinecap="round" />
    </svg>
  ),
  // 3 — Thorkul: estandarte
  ({ size = 14, style, className }) => (
    <svg {...base(size)} style={style} className={className}>
      <rect x="3" y="3" width="18" height="18" />
      <line x1="3" x2="21" y1="9" y2="9" />
    </svg>
  ),
  // 4 — Aquantis: círculo
  ({ size = 14, style, className }) => (
    <svg {...base(size)} style={style} className={className}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  ),
  // 5 — Mercenario: estandarte simple
  ({ size = 14, style, className }) => (
    <svg {...base(size)} style={style} className={className}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // 6 — Entrenamiento (tier más bajo): línea simple
  ({ size = 14, style, className }) => (
    <svg {...base(size)} style={style} className={className}>
      <line x1="5" x2="19" y1="12" y2="12" strokeLinecap="round" />
    </svg>
  ),
]

export const IconCheck = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className} strokeWidth={2.2}><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

export const IconLayers = ({ size = 13, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="m12 2 9 5-9 5-9-5 9-5Z" strokeLinejoin="round" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

export const IconFire = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

export const IconChart = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><circle cx="12" cy="7" r="4" /><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" strokeLinecap="round" /></svg>
)

export const IconUsers = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

export const IconShield = ({ size = 14, style, className }: IconProps) => (
  <svg {...base(size)} style={style} className={className}><path d="M12 2 3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5Z" strokeLinejoin="round" /></svg>
)

/** Numeral romano para el podio/tabla — mismo criterio que RankMark en
 *  Leaderboard.tsx (Home): reemplaza las medallas 🥇🥈🥉 por I/II/III
 *  coloreados, en vez de inventar un ícono de medalla nuevo. */
export function RankNumeral({ rank, size = 20, color }: { rank: number; size?: number; color: string }) {
  const roman = rank === 1 ? 'I' : rank === 2 ? 'II' : rank === 3 ? 'III' : String(rank)
  return (
    <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: size, fontWeight: 600, color }}>
      {roman}
    </span>
  )
}
