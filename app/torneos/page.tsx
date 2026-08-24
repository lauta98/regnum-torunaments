import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { TournamentFormat, TournamentStatus, Clase } from '@/lib/types'
import SubclaseDropdown from './SubclaseDropdown'
import OrdenDropdown from './OrdenDropdown'
import TorneoCard from '@/components/TorneoCard'

type Params = { formato?: string; sub?: string; estado?: string; orden?: string }

// Arma el href de un filtro preservando el resto de los params activos.
function qs(current: Params, changes: Partial<Params>) {
  const next: Record<string, string> = { ...current, ...changes } as Record<string, string>
  Object.keys(next).forEach(k => { if (!next[k]) delete next[k] })
  const s = new URLSearchParams(next).toString()
  return `/torneos${s ? `?${s}` : ''}`
}

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
      padding: '7px 18px', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      border: `1px solid ${active ? c : 'var(--border-input)'}`,
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
  searchParams: Promise<Params>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()
  const ordenAntiguos = params.orden === 'antiguos'

  let query = supabase
    .from('tournaments')
    .select('*, creator:players!tournaments_creator_id_fkey(nickname_juego, discord_avatar), registros:tournament_registrations(count), escudo:trofeos!tournaments_escudo_id_fkey(nombre, icono, color, forma)')
    .order('fecha_inicio', { ascending: ordenAntiguos })

  if (params.formato) query = query.eq('formato', params.formato as TournamentFormat)
  if (params.estado) query = query.eq('estado', params.estado as TournamentStatus)

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: params.formato === '1v1' ? 12 : 24, flexWrap: 'wrap' }}>
          <Pill href={qs(params, { formato: undefined })} active={!params.formato}>Todos</Pill>
          {(['1v1', '2v2', '3v3', '7v7'] as const).map(f => (
            <Pill key={f} href={qs(params, { formato: f })} active={params.formato === f} color={FMT_COLOR[f]}>
              {FMT_LABEL[f]}
            </Pill>
          ))}
          <div style={{ flex: 1 }} />
          <Pill
            href={qs(params, { estado: params.estado === 'finalizado' ? undefined : 'finalizado' })}
            active={params.estado === 'finalizado'}
            color="var(--text-muted)"
          >
            Solo Finalizados
          </Pill>
          <OrdenDropdown />
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

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>
      CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
    </footer>
  )
}
