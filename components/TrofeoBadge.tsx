import { TROFEO_ICONOS } from '@/lib/constants'

export type TrofeoInfo = { nombre: string; icono: string; color: string } | null

const SIZES = {
  xs: { box: 16, icon: 8, stroke: 1.4 },
  sm: { box: 24, icon: 11, stroke: 1.6 },
  md: { box: 44, icon: 18, stroke: 2 },
  lg: { box: 64, icon: 26, stroke: 2.2 },
} as const

/** Insignia de trofeo — una sola silueta de copa reutilizada para TODAS las
 *  copas personalizadas, coloreada por `trofeo.color` con el ícono elegido
 *  centrado. Cuando `trofeo` es null (torneo sin copa asignada, el caso de
 *  todo lo cargado históricamente) cae al look genérico de siempre — 🏆
 *  dorado para individual, 🛡️ azul para clan — cero regresión visual. */
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

  // El subcampeón (puesto 2) siempre cae en el look genérico de medalla de
  // plata — la copa personalizada es un premio de campeón, no se le pone al
  // que salió segundo.
  if (!trofeo || puesto === 2) {
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

  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: s.box, height: s.box, flexShrink: 0 }} title={tooltip}>
      <svg viewBox="0 0 100 100" width={s.box} height={s.box} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`tg-${trofeo.color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trofeo.color} stopOpacity="1" />
            <stop offset="100%" stopColor={trofeo.color} stopOpacity="0.72" />
          </linearGradient>
        </defs>
        {/* asas */}
        <path d="M30 18 C13 18 13 40 31 41" fill="none" stroke={trofeo.color} strokeWidth={s.stroke} strokeLinecap="round" opacity={0.85} />
        <path d="M70 18 C87 18 87 40 69 41" fill="none" stroke={trofeo.color} strokeWidth={s.stroke} strokeLinecap="round" opacity={0.85} />
        {/* copa */}
        <path
          d="M30 14 C30 36 38 49 50 49 C62 49 70 36 70 14 Z"
          fill={`url(#tg-${trofeo.color.replace('#', '')})`}
          stroke={trofeo.color}
          strokeWidth={s.stroke * 0.6}
        />
        <ellipse cx="50" cy="14" rx="20" ry="4" fill={trofeo.color} />
        {/* vastago */}
        <rect x="46" y="49" width="8" height="15" fill={trofeo.color} opacity={0.9} />
        {/* base */}
        <rect x="39" y="64" width="22" height="6" rx="2" fill={trofeo.color} />
        <rect x="31" y="71" width="38" height="7" rx="2.5" fill={trofeo.color} opacity={0.9} />
      </svg>
      <span style={{ position: 'absolute', top: '26%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: s.icon, lineHeight: 1, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}>
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
