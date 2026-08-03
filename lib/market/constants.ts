// ─── URL helpers ──────────────────────────────────────────────────
export function listingHref(itemName: string, id: string, shortId?: string | null): string {
  const slug = itemName
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  // Si tiene short_id usarlo, sino caer al UUID completo (links anteriores)
  return shortId ? `/market/listing/${slug}-${shortId}` : `/market/listing/${slug}-${id}`
}

// ─── Rareza ───────────────────────────────────────────────────────
export const RAREZA_COLOR: Record<string, string> = {
  normal: '#9CA3AF',
  especial: '#FBBF24',
  magico: '#22C55E',
  epico: '#8B5CF6',
  legendario: '#EF4444',
}

export const RAREZA_LABEL: Record<string, string> = {
  normal: 'Normal',
  especial: 'Especial',
  magico: 'Mágico',
  epico: 'Épico',
  legendario: 'Legendario',
}

// ─── Calidad / Estado ─────────────────────────────────────────────
export const CALIDAD_COLOR: Record<string, string> = {
  muy_buena: '#22c55e',
  buena: '#86efac',
  normal: '#888',
  mala: '#f87171',
  muy_mala: '#ef4444',
}

export const CALIDAD_LABEL: Record<string, string> = {
  muy_buena: 'Muy buena',
  buena: 'Buena',
  normal: 'Normal',
  mala: 'Mala',
  muy_mala: 'Muy mala',
}

// ─── Clase ────────────────────────────────────────────────────────
export const CLASE_LABEL: Record<string, string> = {
  guerrero: 'Guerrero',
  mago: 'Mago',
  arquero: 'Arquero',
  todas: 'Todas',
}

// ─── Subclase ─────────────────────────────────────────────────────
export const SUBCLASE_LABEL: Record<string, string> = {
  todas: 'Todas',
  barbaro: 'Bárbaro',
  caballero: 'Caballero',
  brujo: 'Brujo',
  conjurador: 'Conjurador',
  cazador: 'Cazador',
  tirador: 'Tirador',
}

// ─── Velocidad ────────────────────────────────────────────────────
export const VELOCIDAD_LABEL: Record<string, string> = {
  muy_lenta: 'Muy lenta',
  lenta: 'Lenta',
  media: 'Media',
  rapida: 'Rápida',
}

// ─── Muesca ───────────────────────────────────────────────────────
export const MUESCA_LABEL: Record<string, string> = {
  sin_muesca: 'Sin muesca',
  vacia: 'Muesca vacía',
  gema: 'Gema insertada',
}

// ─── Status de listing ────────────────────────────────────────────
export const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  active: { bg: 'rgba(46,125,82,0.2)', color: '#5BC98B', border: 'rgba(46,125,82,0.3)', label: 'Activo' },
  reserved: { bg: 'rgba(186,117,23,0.2)', color: '#EF9F27', border: 'rgba(186,117,23,0.3)', label: 'Reservado' },
  completed: { bg: 'rgba(88,88,88,0.2)', color: '#888', border: 'rgba(88,88,88,0.3)', label: 'Completado' },
}

// ─── Status de transacción ────────────────────────────────────────
export const TX_ESTADO_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  completado: { bg: 'rgba(88,88,88,0.2)', color: '#888', border: 'rgba(88,88,88,0.3)', label: 'Completado' },
  pendiente: { bg: 'rgba(186,117,23,0.2)', color: '#EF9F27', border: 'rgba(186,117,23,0.3)', label: 'Pendiente confirmación' },
  iniciado: { bg: 'rgba(91,155,223,0.2)', color: '#5B9BDF', border: 'rgba(91,155,223,0.3)', label: 'En curso' },
}

// ─── Servidores ───────────────────────────────────────────────────
export const SERVIDORES = [
  { val: 'Ra',   label: 'Ra',   desc: 'Servidor principal' },
  { val: 'Amun', label: 'Amun', desc: 'Servidor de pruebas' },
] as const

export type Servidor = typeof SERVIDORES[number]['val']

// ─── Categorías ───────────────────────────────────────────────────
export const CAT_EMOJI: Record<string, string> = {
  armas: '⚔',
  armaduras: '🛡',
  proyectiles: '🏹',
  crafting: '🔨',
  gemas_magicas: '💎',
  joyeria: '💍',
  minerales: '⛏',
  joyas: '💎',
  consumibles: '🧪',
  materiales: '📦',
  monturas: '🐎',
  otros: '🎒',
}

// ─── Lingotes ─────────────────────────────────────────────────────
// 1 Lingote = 500 Magnanitas. Conversión solo visual — DB guarda mag.
const MAG_PER_LINGOTE = 500

export function formatMag(mag: number): string {
  const l = mag / MAG_PER_LINGOTE
  // Máximo 1 decimal; si es entero exacto, no muestra .0
  const display = Math.round(l * 10) / 10
  return `${display} L`
}

// ─── Slot / Mod display ───────────────────────────────────────────
/**
 * Acorta las resistencias específicas para display:
 * "Resistir daño físico específico (Aplastante): 2%"  →  "Resistir (Aplastante): 2%"
 * "Resistir daño mágico específico (Fuego): 3%"       →  "Resistir (Fuego): 3%"
 * Cualquier otro texto se devuelve sin cambios.
 */
export function formatSlot(text: string): string {
  return text.replace(/^Resistir da[ñn]o \S+ espec[ií]fico (\(.+?\))/, 'Resistir $1')
}

// ─── Helpers ──────────────────────────────────────────────────────
export function formatPrecio(priceGold: number | null, priceMoney: number | null, currencyLabel: string): string {
  const parts: string[] = []
  if (priceGold) parts.push(`🪨 ${formatMag(priceGold)}`)
  if (priceMoney) parts.push(`$ ${priceMoney.toLocaleString('es-AR')} ${currencyLabel || ''}`.trim())
  return parts.length ? parts.join('  ·  ') : 'Precio a convenir'
}

export function formatPrecioCard(priceGold: number | null, priceMoney: number | null, currencyLabel: string): { gold: string | null; money: string | null } {
  return {
    gold:  priceGold  ? formatMag(priceGold) : null,
    money: priceMoney ? `$ ${priceMoney.toLocaleString('es-AR')} ${currencyLabel || ''}`.trim() : null,
  }
}

