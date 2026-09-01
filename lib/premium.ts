export const PREMIUM_COLOR_DEFAULT = '#d4af37' // dorado, mismo que --gold

export type PremiumBg = 'ninguno' | 'sutil' | 'intenso' | 'neon'

export const PREMIUM_BG_STYLES: Record<PremiumBg, { label: string; borderAlpha: number; glowAlpha: number; glowBlur: number }> = {
  ninguno: { label: 'Ninguno', borderAlpha: 0.25, glowAlpha: 0,    glowBlur: 0 },
  sutil:   { label: 'Sutil',   borderAlpha: 0.4,  glowAlpha: 0.12, glowBlur: 20 },
  intenso: { label: 'Intenso', borderAlpha: 0.6,  glowAlpha: 0.22, glowBlur: 30 },
  neon:    { label: 'Neón',    borderAlpha: 0.75, glowAlpha: 0.32, glowBlur: 40 },
}

export const PREMIUM_BG_KEYS = Object.keys(PREMIUM_BG_STYLES) as PremiumBg[]

export function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.substring(0, 2), 16)
  const g = parseInt(m.substring(2, 4), 16)
  const b = parseInt(m.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Combina el color libre + el estilo de fondo elegidos por un jugador
 * premium en los valores CSS ya listos para usar (borde y glow). Si
 * todavía no eligió nada, cae al dorado por defecto del sitio con
 * intensidad "sutil" — se ve igual que un perfil no premium hasta que
 * el jugador decide personalizarlo. */
export interface EstiloPremium { color: string; border: string; glow: string | null }

export function estiloPremium(color: string | null | undefined, bg: string | null | undefined): EstiloPremium {
  const c = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : PREMIUM_COLOR_DEFAULT
  const style = PREMIUM_BG_STYLES[bg as PremiumBg] ?? PREMIUM_BG_STYLES.sutil
  return {
    color: c,
    border: hexToRgba(c, style.borderAlpha),
    glow: style.glowAlpha > 0 ? `0 0 ${style.glowBlur}px ${hexToRgba(c, style.glowAlpha)}` : null,
  }
}

/** Border + boxShadow ya armados para cualquier card del perfil — cae a
 * la estética dorada de siempre si el jugador de la página no es
 * premium, así todas las cards del perfil (no solo la de cuenta) usan
 * el mismo criterio. */
export function cardEstiloPremium(tema: EstiloPremium | null) {
  return {
    border: `1px solid ${tema ? tema.border : 'var(--border-gold)'}`,
    boxShadow: tema?.glow ? `var(--shadow-card), ${tema.glow}` : 'var(--shadow-card)',
  }
}
