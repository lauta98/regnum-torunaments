import { NextRequest } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createPublicSupabase } from '@/lib/supabase-server'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

// Misma lógica que tenía app/torneos/page.tsx — ver app/api/jugadores/route.ts
// para el porqué de unstable_cache en vez de solo revalidate.
const obtenerTorneos = unstable_cache(
  async (formato: string | undefined, estado: string | undefined, ordenAntiguos: boolean) => {
    const supabase = createPublicSupabase()
    let query = supabase
      .from('tournaments')
      .select('*, creator:players!tournaments_creator_id_fkey(nickname_juego, discord_avatar), registros:tournament_registrations(count), escudo:trofeos!tournaments_escudo_id_fkey(nombre, icono, color, forma)')
      .order('fecha_inicio', { ascending: ordenAntiguos })

    if (formato) query = query.eq('formato', formato as TournamentFormat)
    if (estado) query = query.eq('estado', estado as TournamentStatus)

    const { data: tourneysDelFormato } = await query
    return tourneysDelFormato ?? []
  },
  ['torneos-lista'],
  { revalidate: 30 }
)

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const tourneysDelFormato = await obtenerTorneos(
    params.get('formato') ?? undefined,
    params.get('estado') ?? undefined,
    params.get('orden') === 'antiguos',
  )
  return Response.json({ tourneysDelFormato })
}
