import { TROFEO_ICONOS } from '@/lib/constants'

export type TrofeoInfo = { nombre: string; icono: string; color: string; forma?: string } | null

const SIZES = {
  xs: { box: 16, icon: 8, stroke: 1.4 },
  sm: { box: 24, icon: 11, stroke: 1.6 },
  md: { box: 44, icon: 18, stroke: 2 },
  lg: { box: 64, icon: 26, stroke: 2.2 },
} as const

/** Cada forma sabe dibujarse a sí misma en un viewBox 0..100 y en qué
 *  altura relativa (`iconTop`, % del alto) va centrado el ícono elegido —
 *  la copa lo lleva arriba (en el cuenco), la medalla y el escudo más al
 *  medio (donde está el círculo/blasón). */
const FORMAS: Record<string, { iconTop: string; render: (color: string, gradId: string, stroke: number) => React.ReactNode }> = {
  copa: {
    iconTop: '26%',
    render: (color, gradId, stroke) => (
      <>
        <path d="M30 18 C13 18 13 40 31 41" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" opacity={0.85} />
        <path d="M70 18 C87 18 87 40 69 41" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" opacity={0.85} />
        <path d="M30 14 C30 36 38 49 50 49 C62 49 70 36 70 14 Z" fill={`url(#${gradId})`} stroke={color} strokeWidth={stroke * 0.6} />
        <ellipse cx="50" cy="14" rx="20" ry="4" fill={color} />
        <rect x="46" y="49" width="8" height="15" fill={color} opacity={0.9} />
        <rect x="39" y="64" width="22" height="6" rx="2" fill={color} />
        <rect x="31" y="71" width="38" height="7" rx="2.5" fill={color} opacity={0.9} />
      </>
    ),
  },
  medalla: {
    iconTop: '58%',
    render: (color, gradId, stroke) => (
      <>
        <path d="M33 6 L50 44 L18 34 Z" fill={color} opacity={0.85} />
        <path d="M67 6 L50 44 L82 34 Z" fill={color} opacity={0.85} />
        <circle cx="50" cy="62" r="31" fill={`url(#${gradId})`} stroke={color} strokeWidth={stroke * 0.7} />
        <circle cx="50" cy="62" r="24" fill="none" stroke={color} strokeWidth={stroke * 0.4} opacity={0.55} />
      </>
    ),
  },
  escudo: {
    iconTop: '46%',
    render: (color, gradId, stroke) => (
      <>
        <path
          d="M50 6 L83 18 L83 44 C83 68 69 85 50 93 C31 85 17 68 17 44 L17 18 Z"
          fill={`url(#${gradId})`} stroke={color} strokeWidth={stroke * 0.7}
        />
        <path d="M50 6 L83 18 L83 44 C83 68 69 85 50 93" fill="none" stroke={color} strokeWidth={stroke * 0.35} opacity={0.5} />
      </>
    ),
  },
}

/** Insignia de trofeo — tres siluetas (copa/medalla/escudo) coloreadas por
 *  `trofeo.color` con el ícono elegido centrado. Cuando `trofeo` es null
 *  (torneo sin copa asignada, el caso de todo lo cargado históricamente)
 *  cae al look genérico de siempre — 🏆 dorado para individual, 🛡️ azul
 *  para clan — cero regresión visual. */
export default function TrofeoBadge({
  trofeo, tipoClan = false, puesto = 1, size = 'sm', count, title,
}: {
  trofeo: TrofeoInfo
  tipoClan?: boolean
  puesto?: 1 | 2
  size?: keyof typeof SIZES
  count?: number
  title?: string
}) {
  const s = SIZES[size]

  // Sin trofeo asignado (ni copa de campeón ni medalla de subcampeón) cae
  // en el look genérico por emoji — puesto solo decide cuál emoji/color.
  if (!trofeo) {
    const emojiSize = Math.round(s.box * 0.62)
    const emoji = puesto === 2 ? '🥈' : (tipoClan ? '🛡️' : '🏆')
    const bubbleColor = puesto === 2 ? '#c0c0c0' : (tipoClan ? '#5b8fd4' : '#d4af37')
    return (
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: s.box, height: s.box, fontSize: emojiSize, lineHeight: 1 }} title={title}>
        {emoji}
        {count && count > 1 && <CountBubble count={count} size={size} color={bubbleColor} />}
      </span>
    )
  }

  const icono = TROFEO_ICONOS[trofeo.icono] ?? '🏆'
  const tooltip = title ?? trofeo.nombre
  const forma = FORMAS[trofeo.forma ?? 'copa'] ?? FORMAS.copa
  const gradId = `tg-${(trofeo.forma ?? 'copa')}-${trofeo.color.replace('#', '')}`

  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: s.box, height: s.box, flexShrink: 0 }} title={tooltip}>
      <svg viewBox="0 0 100 100" width={s.box} height={s.box} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trofeo.color} stopOpacity="1" />
            <stop offset="100%" stopColor={trofeo.color} stopOpacity="0.72" />
          </linearGradient>
        </defs>
        {forma.render(trofeo.color, gradId, s.stroke)}
      </svg>
      <span style={{ position: 'absolute', top: forma.iconTop, left: '50%', transform: 'translate(-50%, -50%)', fontSize: s.icon, lineHeight: 1, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}>
        {icono}
      </span>
      {count && count > 1 && <CountBubble count={count} size={size} color={trofeo.color} />}
    </span>
  )
}

function CountBubble({ count, size, color }: { count: number; size: keyof typeof SIZES; color: string }) {
  const small = size === 'xs' || size === 'sm'
  return (
    <span style={{
      position: 'absolute', bottom: small ? -3 : -2, right: small ? -6 : -4,
      background: '#0a0a0a', border: `1px solid ${color}`, color,
      borderRadius: 20, minWidth: small ? 13 : 16, height: small ? 13 : 16,
      padding: '0 3px', fontSize: small ? 8 : 9, fontWeight: 700, fontFamily: 'var(--font-display)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
    }}>
      ×{count}
    </span>
  )
}
