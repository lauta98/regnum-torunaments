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

export interface User {
  id: string
  discord_id: string
  discord_username: string
  discord_avatar: string | null
  role: UserRole
  created_at: string
}

export interface Player {
  user_id: string
  nickname_juego: string
  reino: Reino
  clase_principal: Clase
  mmr_global: number
  winrate: number
  partidas_jugadas: number
  user?: User
}

export interface Team {
  id: string
  nombre: string
  logo_url: string | null
  capitan_id: string
  tipo: TournamentFormat
  created_at: string
  capitan?: Player
  members?: Player[]
}

export interface Tournament {
  id: string
  creator_id: string
  nombre: string
  descripcion: string | null
  formato: TournamentFormat
  estado: TournamentStatus
  fecha_inicio: string
  imagen_url: string | null
  max_equipos: number
  premio: string | null
  created_at: string
  creator?: User
  equipos_inscritos?: number
}

export interface Match {
  id: string
  torneo_id: string
  ronda: string
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

export interface Highlight {
  id: string
  titulo: string
  descripcion: string | null
  video_url: string
  thumbnail_url: string | null
  jugador_id: string
  torneo_id: string | null
  likes: number
  created_at: string
  jugador?: Player
}
