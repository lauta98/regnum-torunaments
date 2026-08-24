import type { UserRole } from '@/lib/types'

/* ── Super admins permanentes ───────────────────────────────────
   Estos nicknames tienen rango admin inamovible.
   Ningún otro admin puede cambiar su rol.
──────────────────────────────────────────────────────────────── */
export const SUPER_ADMINS = ['r4f4_', 'dopping', 'lowir'] as const

export function isSuperAdmin(nickname: string | null | undefined): boolean {
  if (!nickname) return false
  return (SUPER_ADMINS as readonly string[]).includes(nickname)
}

/* ── Jerarquía de roles ─────────────────────────────────────────
   admin > organizer > player
   Cada nivel hereda los permisos del nivel inferior.
──────────────────────────────────────────────────────────────── */

export const ROLE_RANK: Record<UserRole, number> = {
  player:    1,
  organizer: 2,
  admin:     3,
}

export const ROLE_LABEL: Record<UserRole, string> = {
  player:    'Jugador',
  organizer: 'Organizador',
  admin:     'Administrador',
}

export const ROLE_COLOR: Record<UserRole, string> = {
  player:    '#909090',
  organizer: '#2196F3',
  admin:     '#d4af37',
}

export const ROLE_BG: Record<UserRole, string> = {
  player:    'rgba(144,144,144,0.10)',
  organizer: 'rgba(33,150,243,0.12)',
  admin:     'rgba(212,175,55,0.12)',
}

/** Devuelve true si `role` tiene al menos el rango de `required` */
export function hasRole(role: UserRole | string | undefined | null, required: UserRole): boolean {
  if (!role) return false
  return (ROLE_RANK[role as UserRole] ?? 0) >= ROLE_RANK[required]
}

/** Puede crear / editar / finalizar SUS torneos */
export const canOrganize = (role?: string | null) => hasRole(role, 'organizer')

/** Puede gestionar TODOS los torneos y asignar roles */
export const canAdmin    = (role?: string | null) => hasRole(role, 'admin')

/** Dueño de un torneo puntual: el creador, un admin, o un co-organizador
 *  agregado a ESE torneo (tabla `tournament_organizers`) — sin importar
 *  su rol global. Da acceso a gestionar el cuadro/resultados/datos del
 *  torneo, pero NO a expulsar jugadores ni a gestionar la lista de
 *  co-organizadores — esas dos acciones siguen chequeando
 *  `creator_id === player.id || role === 'admin'` directo, sin este
 *  helper. */
export async function esOrganizadorDelTorneo(
  supabase: any, torneoId: string, creatorId: string, player: { id: string; role: string }
): Promise<boolean> {
  if (player.role === 'admin' || creatorId === player.id) return true
  const { data } = await supabase
    .from('tournament_organizers').select('player_id')
    .eq('tournament_id', torneoId).eq('player_id', player.id).maybeSingle()
  return !!data
}
