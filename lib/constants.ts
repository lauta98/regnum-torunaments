import type { Reino, Clase, TournamentFormat, TournamentStatus, MatchStatus, BracketType } from './types'

export const REINO_COLOR: Record<Reino, string> = {
  Syrtis: '#4CAF50',
  Ignis: '#F44336',
  Alsius: '#2196F3',
}

export const REINO_EMOJI: Record<Reino, string> = {
  Syrtis: '🌿',
  Ignis: '🔥',
  Alsius: '❄️',
}

export const CLASE_LABEL: Record<Clase, string> = {
  Bárbaro: 'Bárbaro',
  Caballero: 'Caballero',
  Conjurador: 'Conjurador',
  Brujo: 'Brujo',
  Tirador: 'Tirador',
  Cazador: 'Cazador',
}

export const FORMAT_LABEL: Record<TournamentFormat, string> = {
  '1v1': '1VS1',
  '2v2': '2VS2',
  '3v3': '3VS3',
  '7v7': '7VS7',
}

export const FORMAT_COLOR: Record<TournamentFormat, string> = {
  '1v1': '#8a2be2',
  '2v2': '#d4af37',
  '3v3': '#2196F3',
  '7v7': '#F44336',
}

export const STATUS_STYLE: Record<TournamentStatus, { label: string; color: string; bg: string }> = {
  draft:        { label: 'Borrador',      color: '#8A8A8A', bg: 'rgba(138,138,138,0.15)' },
  inscripciones:{ label: 'Inscripciones', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
  live:         { label: 'En Vivo',       color: '#F44336', bg: 'rgba(244,67,54,0.15)' },
  finalizado:   { label: 'Finalizado',    color: '#8A8A8A', bg: 'rgba(138,138,138,0.1)' },
}

export const MATCH_STATUS_STYLE: Record<MatchStatus, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#d4af37' },
  jugado:    { label: 'Jugado',    color: '#4CAF50' },
  disputa:   { label: 'Disputa',   color: '#F44336' },
}

export const CLASES: Clase[] = [
  'Bárbaro', 'Caballero', 'Conjurador', 'Brujo', 'Tirador', 'Cazador',
]

export const REINOS: Reino[] = ['Syrtis', 'Ignis', 'Alsius']

export const FORMATS: TournamentFormat[] = ['1v1', '2v2', '3v3', '7v7']

// Cuántos jugadores por equipo necesita cada formato
export const FORMAT_TEAM_SIZE: Record<TournamentFormat, number> = {
  '1v1': 1, '2v2': 2, '3v3': 3, '7v7': 7,
}

export const BRACKET_TYPE_LABEL: Record<BracketType, string> = {
  single_elimination: 'Eliminación simple',
  double_elimination: 'Eliminación doble',
  round_robin: 'Round Robin (todos contra todos)',
}

export const BRACKET_TYPES: BracketType[] = ['single_elimination', 'double_elimination', 'round_robin']

export const ELO_K_DEFAULT         = 32
export const ELO_K_VETERAN         = 16
export const ELO_K_CALIBRATION     = 50   // first 10 games (calibration phase)
export const ELO_VETERAN_THRESHOLD = 50
export const ELO_CALIBRATION_GAMES = 10
export const MMR_INITIAL           = 1200

export const WINSTREAK_BONUS     = 1.2  // ×1.2 MMR gained after this many consecutive wins
export const WINSTREAK_THRESHOLD = 3

// ─── Tier system ────────────────────────────────────────────────────────────
export const MMR_TIERS = [
  { name: 'Legendario', min: 1800, color: '#ff6b35', cssClass: 'tier-legendary', icon: '🔥' },
  { name: 'Diamante',   min: 1500, color: '#00d4ff', cssClass: 'tier-diamond',   icon: '💎' },
  { name: 'Platino',    min: 1350, color: '#b060ff', cssClass: 'tier-platinum',  icon: '⬡'  },
  { name: 'Oro',        min: 1200, color: '#d4af37', cssClass: 'tier-gold',      icon: '⭐' },
  { name: 'Plata',      min: 1050, color: '#9e9e9e', cssClass: 'tier-silver',    icon: '🥈' },
  { name: 'Bronce',     min: 900,  color: '#8d6e63', cssClass: 'tier-bronze',    icon: '🥉' },
  { name: 'Hierro',     min: 0,    color: '#606060', cssClass: 'tier-iron',      icon: '⚒️' },
] as const

export type Tier = typeof MMR_TIERS[number]

export function getTier(mmr: number): Tier {
  return (MMR_TIERS.find(t => mmr >= t.min) ?? MMR_TIERS[MMR_TIERS.length - 1]) as Tier
}

export function calcularEsperado(rA: number, rB: number): number {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400))
}

export function calcularNuevoMMR(
  mmrActual: number,
  ganó: boolean,
  esperado: number,
  k: number = ELO_K_DEFAULT
): number {
  const s = ganó ? 1 : 0
  return Math.round(mmrActual + k * (s - esperado))
}
