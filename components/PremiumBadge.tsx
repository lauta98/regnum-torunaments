import { temaPremium } from '@/lib/premium'

export default function PremiumBadge({ esPremium, theme, size = 13 }: { esPremium: boolean; theme?: string | null; size?: number }) {
  if (!esPremium) return null
  const t = temaPremium(theme)
  return (
    <span title="Cuenta Premium" style={{ fontSize: size, color: t.color, lineHeight: 1, filter: `drop-shadow(0 0 4px ${t.glow})` }}>
      👑
    </span>
  )
}
