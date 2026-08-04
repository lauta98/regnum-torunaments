import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import StatsBar from '@/components/StatsBar'
import Leaderboard from '@/components/Leaderboard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const IconChart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IconTrophy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createServerSupabase()

  const [
    { data: personajes },
    { count: totalJugadores },
    { count: totalTorneos },
    { count: totalMatches },
  ] = await Promise.all([
    supabase.from('personajes').select('*, player:players(id, discord_username, role)').order('mmr', { ascending: false }).limit(10),
    supabase.from('personajes').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
  ])

  const btnOutline = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'var(--text-secondary)',
    padding: '10px 18px', borderRadius: 8,
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: 0.5,
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7,
    transition: 'all 0.15s',
  } as const

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {error === 'organizador' && (
          <div style={{
            background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
            borderRadius: 10, padding: '12px 18px', marginBottom: 20,
            color: '#f87171', fontSize: 13, fontFamily: 'var(--font-display)',
          }}>
            Todavía no tenés permisos de organizador para crear torneos — pedile a un admin que te los otorgue.
          </div>
        )}

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: 20 }}>

          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, #0c0c0c 0%, #111008 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '44px 40px',
            position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 62, fontWeight: 900,
                color: 'var(--gold)', lineHeight: 0.9, letterSpacing: -1,
              }}>CoR</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
                color: 'var(--text-primary)', letterSpacing: 3, marginTop: 4,
              }}>Community</div>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, marginBottom: 28, lineHeight: 1.7 }}>
              Estadísticas, rankings y rivalidades PvP de Champions of Regnum. Compite, escala posiciones y deja tu nombre en la historia.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/jugadores" style={{ ...btnOutline, color: 'var(--gold)', borderColor: 'rgba(212,175,55,0.35)' }}>
                <IconChart /> Ver Rankings
              </Link>
              <Link href="/organizador/nuevo" style={{ ...btnOutline, color: '#d4af37', borderColor: 'rgba(212,175,55,0.3)' }}>
                <IconTrophy /> Crear Torneo
              </Link>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 32, marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>
                  {(totalJugadores ?? 0).toLocaleString('es-AR')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1.5, marginTop: 2 }}>GUERREROS</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>
                  {(totalTorneos ?? 0).toLocaleString('es-AR')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1.5, marginTop: 2 }}>TORNEOS</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>
                  {(totalMatches ?? 0).toLocaleString('es-AR')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1.5, marginTop: 2 }}>COMBATES</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ───────────────────────────────────────── */}
        <section style={{ marginBottom: 20 }}>
          <StatsBar
            totalTorneos={totalTorneos ?? 0}
            totalJugadores={totalJugadores ?? 0}
            totalMatches={totalMatches ?? 0}
          />
        </section>

        {/* ── Leaderboard ──────────────────────────────────────── */}
        <section>
          <Leaderboard personajes={personajes ?? []} />
        </section>

      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>
        CoR © 2026 — Torneos y Comercio de la comunidad de Champions of Regnum
      </footer>
    </>
  )
}
