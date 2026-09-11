import { Suspense } from 'react'
import { createPublicSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Leaderboard from '@/components/Leaderboard'
import TorneoCard from '@/components/TorneoCard'
import TrofeoBadge from '@/components/TrofeoBadge'
import ErrorBanner from '@/components/ErrorBanner'
import Link from 'next/link'
import { CLASE_COLOR } from '@/lib/constants'
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

const IconMedal = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="15" r="6"/><path d="M12 10v2l1.5 1.5"/>
    <path d="M8.5 9L6 3M15.5 9L18 3M6 3h3M18 3h-3"/>
  </svg>
)
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5v15m7.5-7.5h-15"/>
  </svg>
)
const IconArrow = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
  </svg>
)

// Sección con marcador dorado + título label-caps — uno de los 5 roles
// permitidos para mayúsculas espaciadas (docs/design.md). Repetido en
// "Torneos Activos" y "Actividad Reciente", vive acá para no duplicar el markup.
function SectionHeader({ title, href, hrefLabel }: { title: string; href?: string; hrefLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 7, height: 7, background: 'var(--gold)', flexShrink: 0 }} />
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {href && (
        <Link href={href} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          {hrefLabel} <IconArrow />
        </Link>
      )}
    </div>
  )
}

export default async function HomePage() {
  const supabase = createPublicSupabase()

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
      <main style={{ maxWidth: 1360, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        <Suspense fallback={null}>
          <ErrorBanner />
        </Suspense>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: 40 }}>
          <div style={{
            backgroundImage: "linear-gradient(100deg, rgba(5,5,5,0.96) 0%, rgba(5,5,5,0.88) 32%, rgba(5,5,5,0.55) 62%, rgba(5,5,5,0.25) 100%), linear-gradient(0deg, rgba(5,5,5,0.6) 0%, rgba(5,5,5,0) 30%), url('/Gemini_Generated_Image_j0m601j0m601j0m6.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 38%',
            border: '1px solid var(--border)',
            padding: '44px 40px',
            position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            minHeight: 420,
          }}>
            {/* Title */}
            <div style={{ marginBottom: 18 }}>
              <div style={{
                fontFamily: 'var(--font-display-v2)', fontSize: 56, fontWeight: 600,
                color: 'var(--gold)', lineHeight: 0.95, letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>CoR</div>
              <div style={{
                fontFamily: 'var(--font-display-v2)', fontSize: 24, fontWeight: 500,
                color: 'var(--text-primary)', letterSpacing: '0.1em', marginTop: 4, textTransform: 'uppercase',
              }}>Community</div>
            </div>

            <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 17, color: 'var(--text-secondary)', maxWidth: 460, marginBottom: 26, lineHeight: 1.65 }}>
              Centro competitivo y registro oficial de torneos, rankings y crónicas de combate de Champions of Regnum.
            </p>

            {/* CTA buttons — una sola acción primaria (dorado sólido), la otra secundaria */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/organizador/nuevo" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                background: 'var(--gold)', color: '#050505', border: '1px solid var(--gold)',
                padding: '11px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                <IconPlus /> Crear Torneo
              </Link>
              <Link href="/salon-de-la-fama" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
                background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-highlight, #3E3E3E)',
                padding: '11px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                <IconMedal /> Salón de la Fama
              </Link>
            </div>

            {/* Cifras globales — único lugar de la página que las muestra */}
            <div style={{ display: 'flex', gap: 28, marginTop: 30, paddingTop: 22, borderTop: '1px solid var(--border)', maxWidth: 520 }}>
              {[
                { label: 'Jugadores Totales', value: totalJugadores },
                { label: 'Torneos Disputados', value: totalTorneos },
                { label: 'Combates Registrados', value: totalMatches },
              ].map((s, i) => (
                <div key={s.label} style={{ paddingLeft: i > 0 ? 24 : 0, borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {(s.value ?? 0).toLocaleString('es-AR')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Torneos activos ahora ─────────────────────────────── */}
        {(torneosActivos ?? []).length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionHeader title="Torneos Activos" href="/torneos" hrefLabel="Ver todos" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {torneosActivos!.map((t: any) => <TorneoCard key={t.id} torneo={t} />)}
            </div>
          </section>
        )}

        {/* ── Actividad reciente (últimos campeones) ──────────────
            El fondo es la foto que el organizador subió al coronar al
            campeón (campeonatos.foto_url, la misma que sale en el Salón de
            la Fama) — con un degradé fuerte encima para que el trofeo y el
            texto se sigan leyendo. Si ese torneo no tiene foto cargada,
            cae a una superficie neutra lisa. */}
        {campeonesOrdenados.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SectionHeader title="Actividad Reciente" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {campeonesOrdenados.map((c: any) => {
                const clase = c.personaje?.clase as Clase | undefined
                const cc = clase ? CLASE_COLOR[clase] : undefined
                return (
                <Link key={c.id} href={`/jugadores/${c.player_id}`} style={{ textDecoration: 'none' }}>
                  <div className="card-hover" style={{
                    position: 'relative', overflow: 'hidden', height: '100%',
                    backgroundImage: c.foto_url
                      ? `linear-gradient(180deg, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.82) 55%, rgba(5,5,5,0.96) 100%), url('${c.foto_url}')`
                      : undefined,
                    backgroundColor: c.foto_url ? undefined : 'var(--bg-card)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                    border: '1px solid var(--border)',
                    padding: '18px 16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6,
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gold)' }} />
                    <TrofeoBadge trofeo={c.torneo?.trofeo} puesto={1} size="lg" title={`Campeón de ${c.torneo?.nombre}`} />
                    <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 16, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.02em', marginTop: 2, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
                      {c.personaje?.nickname_juego ?? '—'}
                    </div>
                    {clase && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `color-mix(in srgb, ${cc} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${cc} 33%, transparent)`, padding: '2px 9px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: cc, fontWeight: 600 }}>{clase}</span>
                      </div>
                    )}
                    <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                      {c.torneo?.nombre}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{hace(c.torneo.fecha_inicio)}</div>
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

      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        CoR © 2026 — Torneos y Comercio de la comunidad de Champions of Regnum
      </footer>
    </>
  )
}
