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
