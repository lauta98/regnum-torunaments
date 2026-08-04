import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FORMAT_COLOR, STATUS_STYLE, CLASE_LABEL } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus, Clase } from '@/lib/types'
import SubclaseDropdown from './SubclaseDropdown'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Torneos' }

// Formato labels con override para 7v7
const FMT_LABEL: Record<string, string> = {
  '1v1': '1VS1', '2v2': '2VS2', '3v3': '3VS3', '7v7': 'Clanes',
}
const FMT_COLOR: Record<string, string> = {
  '1v1': '#8a2be2', '2v2': '#d4af37', '3v3': '#2196F3', '7v7': '#F44336',
}

function Pill({ href, active, color, children }: { href: string; active: boolean; color?: string; children: React.ReactNode }) {
  const c = color ?? 'rgba(212,175,55,1)'
  return (
    <Link href={href} style={{
      padding: '7px 18px', borderRadius: 8, textDecoration: 'none',
      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      border: `1px solid ${active ? c : 'rgba(255,255,255,0.1)'}`,
      background: active ? `${c}18` : 'transparent',
      color: active ? c : 'var(--text-muted)',
      transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {children}
    </Link>
  )
}

export default async function TorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ formato?: string; sub?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()

  let query = supabase
    .from('tournaments')
    .select('*, creator:players(nickname_juego, discord_avatar), registros:tournament_registrations(count)')
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false })

  if (params.formato) query = query.eq('formato', params.formato as TournamentFormat)

  const { data: tourneysDelFormato } = await query

  // Subclases realmente presentes entre los torneos de este formato — el
  // dropdown solo muestra lo que existe, no una lista fija.
  const subclasesDisponibles = Array.from(
    new Set((tourneysDelFormato ?? []).flatMap((t: any) => t.subclases_permitidas ?? []))
  ) as Clase[]

  const tourneys = params.sub
    ? (tourneysDelFormato ?? []).filter((t: any) => (t.subclases_permitidas ?? []).includes(params.sub))
    : tourneysDelFormato

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 1 }}>
              Torneos
            </h1>
            {tourneys && (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-muted)' }}>
                {tourneys.length} torneos
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Todos los torneos de Champions of Regnum
          </p>
        </div>

        {/* Formato filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: params.formato === '1v1' ? 12 : 24, flexWrap: 'wrap' }}>
          <Pill href="/torneos" active={!params.formato}>Todos</Pill>
          {(['1v1', '2v2', '3v3', '7v7'] as const).map(f => (
            <Pill key={f} href={`/torneos?formato=${f}`} active={params.formato === f} color={FMT_COLOR[f]}>
              {FMT_LABEL[f]}
            </Pill>
          ))}
          <div style={{ flex: 1 }} />
          <Pill href="/torneos?estado=finalizado" active={false} color="var(--text-muted)">
            Solo Finalizados
          </Pill>
        </div>

        {/* Subclase: dropdown, solo si hay más de una subclase entre estos torneos */}
        {params.formato && subclasesDisponibles.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SubclaseDropdown
              formato={params.formato}
              actual={params.sub}
              opciones={subclasesDisponibles}
            />
          </div>
        )}

        {/* Grid */}
        {!tourneys?.length ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>No hay torneos con esos filtros.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
            {tourneys.map((t: any) => <TorneoCard key={t.id} torneo={t} />)}
          </div>
        )}

      </main>
      <Footer />
    </>
  )
}

function TorneoCard({ torneo: t }: { torneo: any }) {
  const st = STATUS_STYLE[t.estado as TournamentStatus]
  const fc = FMT_COLOR[t.formato] ?? '#d4af37'
  const fmtLabel = FMT_LABEL[t.formato] ?? t.formato
  const inscritos = t.registros?.[0]?.count ?? 0

  return (
    <Link href={`/brackets/${t.id}`} style={{ textDecoration: 'none' }}>
      <div className="card-hover" style={{
        background: t.destacado
          ? 'linear-gradient(145deg, #120f00 0%, #0d0d0d 50%, #0a0d00 100%)'
          : '#0a0a0a',
        border: `1px solid ${t.destacado ? 'rgba(212,175,55,0.35)' : `${fc}22`}`,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: t.destacado
          ? '0 0 32px rgba(212,175,55,0.08), inset 0 0 60px rgba(0,0,0,0.3)'
          : `inset 0 0 40px rgba(0,0,0,0.2)`,
        ['--hover-color' as string]: fc,
      } as React.CSSProperties}
      >
        {/* Top accent bar con glow */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${fc}cc, ${fc}55, ${fc}11)`, boxShadow: `0 0 8px ${fc}44` }} />

        <div style={{ padding: '20px 22px' }}>
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ background: `${fc}18`, color: fc, border: `1px solid ${fc}33`, padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5 }}>
                {fmtLabel}
              </span>
              {t.destacado && (
                <span style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.3)', padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5 }}>
                  Destacado
                </span>
              )}
            </div>
            <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
              {t.estado === 'live' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F44336' }} />}
              {st.label}
            </span>
          </div>

          {/* Title */}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.35, letterSpacing: 0.5 }}>
            {t.nombre}
          </h2>

          {t.descripcion && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {t.descripcion}
            </p>
          )}

          {/* Meta */}
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', marginBottom: t.creator ? 14 : 0 }}>
            <span>📅 {new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span>👥 {inscritos}/{t.max_equipos}</span>
            {t.premio && <span>🎁 {t.premio}</span>}
          </div>

          {/* Creator */}
          {t.creator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t.creator.discord_avatar
                  ? <img src={t.creator.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : <span style={{ fontSize: 9, color: 'var(--gold)' }}>{t.creator.nickname_juego?.[0]}</span>}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>por <span style={{ color: 'var(--text-secondary)' }}>{t.creator.nickname_juego}</span></span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>
      CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
    </footer>
  )
}
