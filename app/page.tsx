import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import StatsBar from '@/components/StatsBar'
import Leaderboard from '@/components/Leaderboard'
import FeaturedEvent from '@/components/FeaturedEvent'
import UpcomingEvents from '@/components/UpcomingEvents'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServerSupabase()

  const [{ data: players }, { data: torneos }, { data: featured }, { count: totalJugadores }, { count: totalTorneos }] = await Promise.all([
    supabase.from('players').select('*').order('mmr_global', { ascending: false }).limit(10),
    supabase.from('tournaments').select('id, nombre, formato, estado, fecha_inicio, max_equipos, destacado, registros:tournament_registrations(count)').in('estado', ['live', 'inscripciones', 'finalizado']).order('destacado', { ascending: false }).order('fecha_inicio', { ascending: true }).limit(5),
    supabase.from('tournaments').select('id, nombre, descripcion, formato, estado, fecha_inicio, max_equipos, premio, registros:tournament_registrations(count)').eq('destacado', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
  ])

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* Hero + Featured event */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, marginBottom: 32 }}>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1200 100%)',
            border: '1px solid var(--border-gold)', borderRadius: 16, padding: '48px 40px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '100%', background: 'radial-gradient(ellipse at right, rgba(212,175,55,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 900, color: 'var(--gold)', lineHeight: 0.9, marginBottom: 8 }}>CoR</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 4, marginBottom: 20 }}>Tournament Stats</div>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 380, marginBottom: 32, lineHeight: 1.7 }}>
              Estadísticas, rankings y rivalidades PvP de Champions of Regnum. Compite, escala posiciones y deja tu nombre marcado en la historia de los torneos.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/rankings" style={{ background: 'var(--gold)', color: '#000', padding: '12px 24px', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                📊 VER RANKINGS
              </Link>
              <Link href="/jugadores" style={{ background: 'transparent', color: 'var(--text-primary)', padding: '12px 24px', borderRadius: 8, border: '1px solid var(--border-gold)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                👤 EXPLORAR JUGADORES
              </Link>
              <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" style={{ background: '#5865F2', color: '#fff', padding: '12px 24px', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                UNIRSE AL DISCORD
              </a>
            </div>
            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 24, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>{(totalJugadores ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>GUERREROS</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>{(totalTorneos ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>TORNEOS</div>
              </div>
            </div>
          </div>

          {/* Featured Event */}
          <FeaturedEvent tournament={featured ?? null} />
        </section>

        {/* Stats Bar */}
        <section style={{ marginBottom: 32 }}>
          <StatsBar />
        </section>

        {/* Leaderboard + Upcoming */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <Leaderboard players={players ?? []} />
          <UpcomingEvents tournaments={torneos ?? []} />
        </section>

      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
