import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE, FORMATS } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Torneos' }

const ESTADOS: TournamentStatus[] = ['live', 'inscripciones', 'finalizado', 'draft']

export default async function TorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ formato?: string; estado?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()

  let query = supabase
    .from('tournaments')
    .select(`
      *,
      creator:players(nickname_juego, discord_avatar),
      registros:tournament_registrations(count)
    `)
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false })

  if (params.formato) query = query.eq('formato', params.formato as TournamentFormat)
  if (params.estado)  query = query.eq('estado',  params.estado)

  const { data: tourneys } = await query

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
            TORNEOS
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Todos los torneos de Champions of Regnum
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          <Link href="/torneos" style={filterPill(!params.formato && !params.estado, false)}>
            Todos
          </Link>
          {FORMATS.map(f => (
            <Link key={f} href={`/torneos?formato=${f}`} style={filterPill(params.formato === f, true, FORMAT_COLOR[f])}>
              {FORMAT_LABEL[f]}
            </Link>
          ))}
          {ESTADOS.map(e => (
            <Link key={e} href={`/torneos?estado=${e}`} style={filterPill(params.estado === e, false, STATUS_STYLE[e].color)}>
              {STATUS_STYLE[e].label}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {!tourneys?.length ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>No hay torneos con esos filtros.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {tourneys.map((t: any) => {
              const st = STATUS_STYLE[t.estado as TournamentStatus]
              const fc = FORMAT_COLOR[t.formato as TournamentFormat]
              const inscritos = t.registros?.[0]?.count ?? 0
              return (
                <Link key={t.id} href={`/brackets/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${t.destacado ? 'rgba(212,175,55,0.5)' : 'var(--border)'}`,
                    borderRadius: 14, overflow: 'hidden',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = fc; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.destacado ? 'rgba(212,175,55,0.5)' : 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                  >
                    {/* Header band */}
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${fc}, ${fc}88)` }} />

                    <div style={{ padding: '20px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <span style={{
                          background: `${fc}22`, color: fc, border: `1px solid ${fc}44`,
                          padding: '3px 10px', borderRadius: 20,
                          fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1,
                        }}>{FORMAT_LABEL[t.formato as TournamentFormat]}</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {t.estado === 'live' && <span className="live-dot" />}
                          <span style={{
                            background: st.bg, color: st.color,
                            padding: '3px 10px', borderRadius: 20,
                            fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1,
                          }}>{st.label}</span>
                        </div>
                      </div>

                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.2 }}>
                        {t.nombre}
                      </h2>

                      {t.descripcion && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5,
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {t.descripcion}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                        <span>📅 {new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                        <span>👥 {inscritos}/{t.max_equipos}</span>
                        {t.premio && <span>🏆 {t.premio}</span>}
                      </div>

                      {t.creator && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', overflow: 'hidden', flexShrink: 0 }}>
                            {t.creator.discord_avatar
                              ? <img src={t.creator.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                              : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 10, color: 'var(--gold)' }}>{t.creator.nickname_juego?.[0]}</span>
                            }
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>por <span style={{ color: 'var(--text-secondary)' }}>{t.creator.nickname_juego}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <PageFooter />
    </>
  )
}

function filterPill(active: boolean, colored: boolean, color?: string): React.CSSProperties {
  return {
    padding: '6px 16px', borderRadius: 20, textDecoration: 'none',
    fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1,
    border: `1px solid ${active ? (color || 'var(--gold)') : 'var(--border)'}`,
    background: active ? `${color || 'var(--gold)'}22` : 'transparent',
    color: active ? (color || 'var(--gold)') : 'var(--text-muted)',
    transition: 'all 0.15s',
  }
}

function PageFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
      CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
    </footer>
  )
}
