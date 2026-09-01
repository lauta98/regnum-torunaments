export type PremiumTheme = 'dorado' | 'cian' | 'purpura' | 'legendario' | 'syrtis' | 'ignis' | 'alsius'

export const PREMIUM_THEMES: Record<PremiumTheme, { label: string; color: string; border: string; glow: string }> = {
  dorado:     { label: 'Dorado',     color: '#d4af37', border: 'rgba(212,175,55,0.6)', glow: 'rgba(212,175,55,0.22)' },
  cian:       { label: 'Cian',       color: '#00d4ff', border: 'rgba(0,212,255,0.5)',  glow: 'rgba(0,212,255,0.22)' },
  purpura:    { label: 'Púrpura',    color: '#b060ff', border: 'rgba(176,96,255,0.5)', glow: 'rgba(176,96,255,0.22)' },
  legendario: { label: 'Legendario', color: '#ff6b35', border: 'rgba(255,107,53,0.5)', glow: 'rgba(255,107,53,0.22)' },
  syrtis:     { label: 'Syrtis',     color: '#4CAF50', border: 'rgba(76,175,80,0.5)',  glow: 'rgba(76,175,80,0.22)' },
  ignis:      { label: 'Ignis',      color: '#F44336', border: 'rgba(244,67,54,0.5)',  glow: 'rgba(244,67,54,0.22)' },
  alsius:     { label: 'Alsius',     color: '#2196F3', border: 'rgba(33,150,243,0.5)', glow: 'rgba(33,150,243,0.22)' },
}

export const PREMIUM_THEME_KEYS = Object.keys(PREMIUM_THEMES) as PremiumTheme[]

export function temaPremium(theme: string | null | undefined) {
  return PREMIUM_THEMES[theme as PremiumTheme] ?? PREMIUM_THEMES.dorado
}
