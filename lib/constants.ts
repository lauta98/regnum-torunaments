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

export const CLASE_COLOR: Record<Clase, string> = {
  Bárbaro: '#dc3d3d',
  Caballero: '#4a80c9',
  Conjurador: '#8b6cf6',
  Brujo: '#a21caf',
  Tirador: '#0d9488',
  Cazador: '#c2650c',
}

export const CLASE_ICON: Record<Clase, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}

/** Los tres arquetipos "clásicos" de Regnum — cada uno agrupa 2 subclases.
 *  Cuando un torneo restringe subclases_permitidas exactamente a uno de
 *  estos pares (ej. Conjurador+Brujo) tiene sentido mostrarlo como
 *  "Magos" en vez de listar las 2 subclases sueltas. */
export type Arquetipo = 'guerreros' | 'magos' | 'arqueros'
export const ARQUETIPOS: Record<Arquetipo, { label: string; clases: Clase[]; color: string; icon: string }> = {
  guerreros: { label: 'Guerreros', clases: ['Bárbaro', 'Caballero'], color: '#c0392b', icon: '⚔️' },
  magos:     { label: 'Magos',     clases: ['Conjurador', 'Brujo'],  color: '#8e44ad', icon: '🔮' },
  arqueros:  { label: 'Arqueros',  clases: ['Tirador', 'Cazador'],   color: '#0e8f7e', icon: '🏹' },
}

export type TemaTorneo = { label: string; color: string; icon: string }

/** Deriva el "tema" visual de un torneo a partir de las subclases que
 *  puede jugar: una sola subclase -> el tema de esa subclase; un par que
 *  forma exactamente uno de los 3 arquetipos -> el tema del arquetipo;
 *  cualquier otra combinación (o ninguna restricción) -> sin tema
 *  especial, se usa el color de formato como antes. */
export function temaTorneo(subclasesPermitidas: Clase[] | null | undefined): TemaTorneo | null {
  if (!subclasesPermitidas || subclasesPermitidas.length === 0) return null
  if (subclasesPermitidas.length === 1) {
    const c = subclasesPermitidas[0]
    return { label: CLASE_LABEL[c], color: CLASE_COLOR[c], icon: CLASE_ICON[c] }
  }
  const set = new Set(subclasesPermitidas)
  for (const key of Object.keys(ARQUETIPOS) as Arquetipo[]) {
    const grupo = ARQUETIPOS[key]
    if (grupo.clases.length === set.size && grupo.clases.every(c => set.has(c))) return grupo
  }
  return null
}

export const REINOS: Reino[] = ['Syrtis', 'Ignis', 'Alsius']

export const FORMATS: TournamentFormat[] = ['1v1', '2v2', '3v3', '7v7']

// Cuántos jugadores por equipo necesita cada formato
export const FORMAT_TEAM_SIZE: Record<TournamentFormat, number> = {
  '1v1': 1, '2v2': 2, '3v3': 3, '7v7': 7,
}

export const BRACKET_TYPE_LABEL: Record<BracketType, string> = {
  single_elimination: 'Eliminación simple',
  double_elimination: 'Eliminación doble',
  round_robin: 'Liga (todos contra todos)',
  league_cup: 'Liga + Copa',
}

export const BRACKET_TYPES: BracketType[] = ['single_elimination', 'double_elimination', 'round_robin', 'league_cup']

export const ELO_K_DEFAULT         = 32
export const ELO_K_VETERAN         = 16
export const ELO_K_CALIBRATION     = 50   // first 10 games (calibration phase)
export const ELO_VETERAN_THRESHOLD = 50
export const ELO_CALIBRATION_GAMES = 10
export const MMR_INITIAL           = 1200

export const WINSTREAK_BONUS     = 1.2  // ×1.2 MMR gained after this many consecutive wins
export const WINSTREAK_THRESHOLD = 3

// ─── Tier system ────────────────────────────────────────────────────────────
// Umbrales recalibrados a la escala real de la comunidad (ago 2026): con
// ELO siendo un sistema relativo (converge según la ventaja sobre el
// segundo mejor del pool, no un numero absoluto), un jugador dominante
// sin rivales cercanos se estabiliza bien por debajo de los umbrales
// genericos originales aunque juegue indefinidamente -- 1800 nunca iba a
// ser alcanzable en esta escala. Distribucion real al recalibrar: casi
// todo el pool entre 1050-1350, el tope actual ~1440.
export const MMR_TIERS = [
  { name: 'Raptor de Almas', min: 1520, color: '#ff6b35', cssClass: 'tier-legendary', icon: '🔥' },
  { name: 'Evendim',         min: 1420, color: '#00d4ff', cssClass: 'tier-diamond',   icon: '💎' },
  { name: 'Daen Rah',        min: 1320, color: '#b060ff', cssClass: 'tier-platinum',  icon: '⬡'  },
  { name: 'Thorkul',         min: 1200, color: '#d4af37', cssClass: 'tier-gold',      icon: '⭐' },
  { name: 'Aquantis',        min: 1050, color: '#9e9e9e', cssClass: 'tier-silver',    icon: '🥈' },
  { name: 'Mercenario',      min: 900,  color: '#8d6e63', cssClass: 'tier-bronze',    icon: '🥉' },
  { name: 'Entrenamiento',   min: 0,    color: '#606060', cssClass: 'tier-iron',      icon: '⚒️' },
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

// ─── Copas personalizadas ───────────────────────────────────────────────────
// Paleta e íconos curados para que un organizador arme una copa propia sin
// necesitar diseño gráfico — cualquier combinación de estas dos listas se ve
// prolija (ver components/TrofeoBadge.tsx).
export const TROFEO_COLORES = [
  { nombre: 'Oro', hex: '#d4af37' },
  { nombre: 'Plata', hex: '#c0c0c0' },
  { nombre: 'Bronce', hex: '#cd7f32' },
  { nombre: 'Rubí', hex: '#c0392b' },
  { nombre: 'Zafiro', hex: '#2980b9' },
  { nombre: 'Esmeralda', hex: '#27ae60' },
  { nombre: 'Amatista', hex: '#8e44ad' },
  { nombre: 'Ónix', hex: '#4a4a4a' },
] as const

export const TROFEO_ICONOS: Record<string, string> = {
  espada: '⚔️', escudo: '🛡️', corona: '👑', llama: '🔥', hielo: '❄️',
  hoja: '🌿', rayo: '⚡', estrella: '⭐', craneo: '💀', luna: '🌙',
}
