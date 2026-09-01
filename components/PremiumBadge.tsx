import { PREMIUM_COLOR_DEFAULT } from '@/lib/premium'

export default function PremiumBadge({ esPremium, color, size = 13 }: { esPremium: boolean; color?: string | null; size?: number }) {
  if (!esPremium) return null
  const c = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : PREMIUM_COLOR_DEFAULT
  return (
    <span title="Cuenta Premium" style={{ fontSize: size, color: c, lineHeight: 1, filter: `drop-shadow(0 0 4px ${c}88)` }}>
      👑
    </span>
  )
}
