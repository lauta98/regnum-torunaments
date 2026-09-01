/** Detalle de firma para las cards del perfil de un jugador premium —
 * una línea de degradé fina arriba, en su color elegido. No hace nada
 * si el jugador de la página no es premium. */
export default function PremiumAccentLine({ color }: { color?: string | null }) {
  if (!color) return null
  return <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
}
