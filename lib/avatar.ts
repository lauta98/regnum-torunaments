/** Foto a mostrar para un player: la propia si subió una, si no la de
 *  Discord. No hay aprobación previa — se muestra apenas se sube; la
 *  única moderación es un reporte que revisa un admin después. */
export function avatarSrc(player: { avatar_url?: string | null; discord_avatar?: string | null } | null | undefined): string | null {
  if (!player) return null
  return player.avatar_url ?? player.discord_avatar ?? null
}
