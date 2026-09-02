const TWITCH_AUTH = 'https://id.twitch.tv/oauth2/token'
const TWITCH_API = 'https://api.twitch.tv/helix'

/** Nombre exacto de la categoría en Twitch — si no coincide letra por
 * letra con como Twitch la tiene cargada, el filtro de abajo no
 * encuentra nada. Confirmar contra https://www.twitch.tv/directory/game/Champions%20of%20Regnum
 * si en algún momento deja de matchear. */
const JUEGO_TWITCH = 'Champions of Regnum'

async function obtenerAccessToken() {
  const res = await fetch(TWITCH_AUTH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) throw new Error(`Twitch (access token): ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

export interface StreamEnVivo {
  username: string
  titulo: string
  espectadores: number
  thumbnailUrl: string
}

/** De la lista de usernames de Twitch que cargaron los jugadores,
 * devuelve solo los que están en vivo AHORA MISMO transmitiendo
 * Champions of Regnum — no cualquier juego. */
export async function streamsEnVivo(usernames: string[]): Promise<StreamEnVivo[]> {
  if (usernames.length === 0) return []

  const token = await obtenerAccessToken()
  // Helix acepta hasta 100 user_login por consulta.
  const params = new URLSearchParams()
  usernames.slice(0, 100).forEach(u => params.append('user_login', u))

  const res = await fetch(`${TWITCH_API}/streams?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
    },
  })
  if (!res.ok) throw new Error(`Twitch (streams): ${res.status} ${await res.text()}`)
  const data = await res.json()

  return (data.data ?? [])
    .filter((s: any) => s.game_name === JUEGO_TWITCH)
    .map((s: any) => ({
      username: s.user_login,
      titulo: s.title,
      espectadores: s.viewer_count,
      thumbnailUrl: (s.thumbnail_url as string).replace('{width}', '440').replace('{height}', '248'),
    }))
}
