import { createPublicSupabase } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

const PAGE_SIZE = 24

export async function GET(req: NextRequest) {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = createPublicSupabase()
  const { data, count } = await supabase
    .from('highlights')
    .select('*, jugador:players!highlights_jugador_id_fkey(id, discord_username, nickname_juego, avatar_url), torneo:tournaments(id, nombre)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  return Response.json({ highlights: data ?? [], count: count ?? 0 })
}
