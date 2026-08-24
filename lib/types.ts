export type UserRole = 'player' | 'organizer' | 'admin'

export type Reino = 'Syrtis' | 'Ignis' | 'Alsius'

export type Clase =
  | 'Bárbaro'
  | 'Caballero'
  | 'Conjurador'
  | 'Brujo'
  | 'Tirador'
  | 'Cazador'

export type TournamentFormat = '1v1' | '2v2' | '3v3' | '7v7'

export type TournamentStatus =
  | 'draft'
  | 'inscripciones'
  | 'live'
  | 'finalizado'

export type MatchStatus = 'pendiente' | 'jugado' | 'disputa'

export type BracketType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'league_cup'

export type ReportStatus = 'pendiente' | 'resuelto' | 'rechazado'

/* ── Cuenta Discord (1 por usuario) ─────────────────── */
export interface Player {
  id: string
  user_id: string | null
  discord_username: string | null
  discord_avatar: string | null
  role: UserRole
  created_at: string
  personajes?: Personaje[]
}

/* ── Personaje en juego (N por jugador) ─────────────── */
export interface Personaje {
  id: string
  player_id: string
  nickname_juego: string
  reino: Reino
  clase: Clase
  mmr: number
  winrate: number
  partidas_jugadas: number
  partidas_ganadas: number
  winstreak: number
  verificado: boolean
  created_at: string
  player?: Player
}

/* ── Reporte de nickname ─────────────────────────────── */
export interface NicknameReport {
  id: string
  reporter_id: string | null
  personaje_id: string
  motivo: string
  estado: ReportStatus
  created_at: string
  reporter?: Player
  personaje?: Personaje
}

export interface Team {
  id: string
  nombre: string
  logo_url: string | null
  capitan_id: string
  tipo: TournamentFormat
  created_at: string
  capitan?: Player
  members?: TeamMember[]
}

export interface TeamMember {
  team_id: string
  player_id: string
  personaje_id: string | null
  joined_at: string
  player?: Player
  personaje?: Personaje
}

export interface Tournament {
  id: string
  creator_id: string
  nombre: string
  descripcion: string | null
  formato: TournamentFormat
  clase_requerida: Clase | null
  subclases_permitidas: Clase[] | null
  bracket_type: BracketType
  estado: TournamentStatus
  fecha_inicio: string
  imagen_url: string | null
  max_equipos: number
  premio: string | null
  organizador_verificado: boolean
  created_at: string
  creator?: Player
  equipos_inscritos?: number
}

export interface Match {
  id: string
  torneo_id: string
  ronda: string
  bracket: 'main' | 'losers' | 'grand_final'
  equipo_a_id: string
  equipo_b_id: string
  resultado: string | null
  ganador_id: string | null
  estado: MatchStatus
  created_at: string
  equipo_a?: Team
  equipo_b?: Team
  ganador?: Team
}

export interface MmrHistory {
  id: string
  personaje_id: string
  match_id: string | null
  torneo_id: string | null
  mmr_antes: number
  mmr_despues: number
  delta: number | null
  gano: boolean
  created_at: string
  personaje?: Personaje
  torneo?: Tournament
}
