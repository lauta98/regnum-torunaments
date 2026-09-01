import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import StatsBar from '@/components/StatsBar'
import Leaderboard from '@/components/Leaderboard'
import TorneoCard from '@/components/TorneoCard'
import TrofeoBadge from '@/components/TrofeoBadge'
import Link from 'next/link'
import { CLASE_COLOR, CLASE_ICON } from '@/lib/constants'
import type { Clase } from '@/lib/types'

// Para fechas recientes muestra relativo ("hace 3h"); pasado ese rango un
// "hace N meses/años" deja de ser legible de un vistazo (y para torneos
// históricos importados hace poco pero jugados hace años, es directamente
// confuso) — mejor la fecha real una vez que pasaron unas semanas.
function hace(fecha: string) {
  const diffMs = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  if (days < 21) return `hace ${days}d`
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Página 100% pública, sin nada personalizado por usuario — cachear
// 30s en vez de pegarle a la base en cada visita (era la mayor causa
// de lentitud real, más que el plan de hosting en sí).
export const revalidate = 30

const IconTrophy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)
const IconMedal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="15" r="6"/><path d="M12 10v2l1.5 1.5"/>
    <path d="M8.5 9L6 3M15.5 9L18 3M6 3h3M18 3h-3"/>
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
    { data: torneosActivos },
    { data: campeonesRecientes },
  ] = await Promise.all([
    supabase.from('personajes').select('*, player:players!personajes_player_id_fkey(id, discord_username, role)').order('mmr', { ascending: false }).limit(10),
    supabase.from('personajes').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments')
      .select('*, creator:players!tournaments_creator_id_fkey(nickname_juego, discord_avatar), registros:tournament_registrations(count), escudo:trofeos!tournaments_escudo_id_fkey(nombre, icono, color, forma)')
      .in('estado', ['inscripciones', 'live'])
      .order('fecha_inicio', { ascending: true })
      .limit(6),
    // Ordenar por cuándo se jugó el torneo de verdad (fecha_inicio), no por
    // cuándo se cargó el registro en la base (created_at) — un torneo de
    // 2023 importado ayer no es "actividad reciente" solo porque el import
    // sea reciente. Se trae un lote más grande y se ordena/recorta en JS
    // porque supabase-js no permite ordenar por una columna de una tabla
    // relacionada directamente en el query.
    supabase.from('campeonatos')
      .select('id, personaje_id, player_id, foto_url, personaje:personajes(id, nickname_juego, clase), torneo:tournaments(id, nombre, fecha_inicio, trofeo:trofeos!tournaments_trofeo_id_fkey(nombre, icono, color, forma))')
      .eq('puesto', 1)
      .limit(200),
  ])
  const campeonesOrdenados = (campeonesRecientes ?? [])
    .filter((c: any) => c.torneo?.fecha_inicio)
    .sort((a: any, b: any) => +new Date(b.torneo.fecha_inicio) - +new Date(a.torneo.fecha_inicio))
    .slice(0, 5)

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {error === 'organizador' && (
          <div style={{
            background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
            borderRadius: 'var(--radius-sm)', padding: '12px 18px', marginBottom: 20,
            color: '#f87171', fontSize: 13, fontFamily: 'var(--font-display)',
          }}>
            Todavía no tenés permisos de organizador para crear torneos — pedile a un admin que te los otorgue.
          </div>
        )}

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: 20 }}>

          {/* Hero */}
          <div style={{
            backgroundImage: "linear-gradient(100deg, rgba(9,8,5,0.95) 0%, rgba(9,8,5,0.86) 32%, rgba(9,8,5,0.5) 62%, rgba(9,8,5,0.22) 100%), linear-gradient(0deg, rgba(9,8,5,0.55) 0%, rgba(9,8,5,0) 30%), url('/Gemini_Generated_Image_j0m601j0m601j0m6.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 38%',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 'var(--radius-lg)', padding: '44px 40px',
            position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            minHeight: 420,
          }}>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

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
              <Link href="/salon-de-la-fama" className="btn btn-ghost-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
                <IconMedal /> Salón de la Fama
              </Link>
              <Link href="/organizador/nuevo" className="btn btn-ghost-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
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

        {/* ── Torneos activos ahora ─────────────────────────────── */}
        {(torneosActivos ?? []).length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1 }}>Torneos Activos</h2>
              <Link href="/torneos" style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', textDecoration: 'none' }}>Ver todos →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {torneosActivos!.map((t: any) => <TorneoCard key={t.id} torneo={t} />)}
            </div>
          </section>
        )}

        {/* ── Stats Bar ───────────────────────────────────────── */}
        <section style={{ marginBottom: 20 }}>
          <StatsBar
            totalTorneos={totalTorneos ?? 0}
            totalJugadores={totalJugadores ?? 0}
            totalMatches={totalMatches ?? 0}
          />
        </section>

        {/* ── Actividad reciente (últimos campeones) ──────────────
            El fondo es la foto que el organizador subió al coronar al
            campeón (campeonatos.foto_url, la misma que sale en el Salón de
            la Fama) — con un degradé fuerte encima para que el trofeo y el
            texto se sigan leyendo. Si ese torneo no tiene foto cargada,
            cae al glow dorado liso de antes. */}
        {campeonesOrdenados.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1, marginBottom: 14 }}>Actividad Reciente</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              {campeonesOrdenados.map((c: any) => {
                const clase = c.personaje?.clase as Clase | undefined
                const cc = clase ? CLASE_COLOR[clase] : undefined
                return (
                <Link key={c.id} href={`/jugadores/${c.player_id}`} style={{ textDecoration: 'none', flex: '0 0 240px' }}>
                  <div className="card-hover" style={{
                    position: 'relative', overflow: 'hidden', height: '100%',
                    backgroundImage: c.foto_url
                      ? `linear-gradient(180deg, rgba(8,6,2,0.55) 0%, rgba(8,6,2,0.82) 55%, rgba(8,6,2,0.96) 100%), url('${c.foto_url}')`
                      : 'linear-gradient(160deg, #120f00, #1c1700)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                    border: '1px solid rgba(212,175,55,0.45)',
                    borderRadius: 'var(--radius-md)',
                    padding: '22px 18px',
                    boxShadow: '0 0 0 1px rgba(212,175,55,0.12), 0 0 40px rgba(212,175,55,0.22), inset 0 0 60px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8,
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.85), transparent)' }} />
                    <TrofeoBadge trofeo={c.torneo?.trofeo} puesto={1} size="lg" title={`Campeón de ${c.torneo?.nombre}`} />
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--gold)', letterSpacing: 0.3, marginTop: 2, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
                      {c.personaje?.nickname_juego ?? '—'}
                    </div>
                    {clase && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${cc}22`, border: `1px solid ${cc}55`, borderRadius: 100, padding: '2px 10px' }}>
                        <span style={{ fontSize: 11 }}>{CLASE_ICON[clase]}</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: cc, fontWeight: 600 }}>{clase}</span>
                      </div>
                    )}
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                      {c.torneo?.nombre}
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--text-muted)' }}>{hace(c.torneo.fecha_inicio)}</div>
                  </div>
                </Link>
                )
              })}
            </div>
          </section>
        )}

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
