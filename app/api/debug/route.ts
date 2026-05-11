import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const envOk = {
    url: url ? `${url.slice(0, 30)}...` : 'MISSING',
    key: key ? `${key.slice(0, 20)}...` : 'MISSING',
  }

  try {
    const supabase = await createServerSupabase()

    const [
      { data: players, error: e1 },
      { data: tournaments, error: e2 },
      { data: matches, error: e3 },
    ] = await Promise.all([
      supabase.from('players').select('id, nickname_juego, mmr_global').limit(3),
      supabase.from('tournaments').select('id, nombre, estado').limit(3),
      supabase.from('matches').select('id, estado').limit(3),
    ])

    return NextResponse.json({
      env: envOk,
      players: { data: players, error: e1?.message },
      tournaments: { data: tournaments, error: e2?.message },
      matches: { data: matches, error: e3?.message },
    })
  } catch (err: any) {
    return NextResponse.json({ env: envOk, error: err.message }, { status: 500 })
  }
}
