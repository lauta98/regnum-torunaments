import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FORMAT_COLOR, STATUS_STYLE, MATCH_STATUS_STYLE, FORMAT_TEAM_SIZE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus, MatchStatus } from '@/lib/types'
import BracketActions from './BracketActions'
import InscripcionActions from './InscripcionActions'
import GenerarBracketButton from './GenerarBracketButton'
import AbrirInscripcionesButton from './AbrirInscripcionesButton'
import FinalizarTorneoButton from './FinalizarTorneoButton'
import ExpulsarButton from './ExpulsarButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('tournaments').select('nombre').eq('id', id).single()
  return { title: data?.nombre ?? 'Bracket' }
}

const FMT_LABEL: Record<string, string> = {
  '1v1': '1VS1', '2v2': '2VS2', '3v3': '3VS3', '7v7': 'Clanes',
}

/* ── Icons ─────────────────────────────────────────── */
const IconBracket = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
  </svg>
)
const IconList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconPeople = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

export default async function BracketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const tab = sp.tab ?? 'llave'

  const supabase = await createServerSupabase()

  const { data: torneo } = await supabase
    .from('tournaments')
    .select('*, creator:players(nickname_juego, discord_avatar), registros:tournament_registrations(count)')
    .eq('id', id).single()

  if (!torneo) notFound()

  const { data: matches } = await supabase
    .from('matches')
    .select('*, equipo_a:teams!matches_equipo_a_id_fkey(id, nombre), equipo_b:teams!matches_equipo_b_id_fkey(id, nombre), ganador:teams!matches_ganador_id_fkey(id, nombre)')
    .eq('torneo_id', id)
    .order('ronda_numero', { ascending: true })
    .order('posicion', { ascending: true })

  const { data: inscritos } = await supabase
    .from('tournament_registrations')
    .select('seed, estado, motivo_expulsion, team:teams(id, nombre, capitan:players!teams_capitan_id_fkey(id, nickname_juego, reino), miembros:team_members(count))')
    .eq('tournament_id', id)
    .order('seed', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  let isOrganizer = false
  let playerId: string | null = null
  let personajesElegibles: { id: string; nickname_juego: string; clase: string }[] = []
  let yaInscritoTeamId: string | null = null

  const inscritosActivos = (inscritos ?? []).filter((r: any) => r.estado !== 'expulsado')
  const teamIdsEnEsteTorneo = inscritosActivos.map((r: any) => r.team?.id).filter(Boolean)

  if (user) {
    const { data: player } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
    isOrganizer = !!(player && ['organizer', 'admin'].includes(player.role))
    if (player) {
      playerId = player.id
      const { data: personajes } = await supabase
        .from('personajes')
        .select('id, nickname_juego, clase')
        .eq('player_id', player.id)
      const permitidas: string[] | null = torneo.subclases_permitidas
      personajesElegibles = (personajes ?? []).filter(
        (p: any) => !permitidas || permitidas.length === 0 || permitidas.includes(p.clase)
      )

      if (teamIdsEnEsteTorneo.length > 0) {
        const { data: miMembresia } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('player_id', player.id)
          .in('team_id', teamIdsEnEsteTorneo)
        yaInscritoTeamId = miMembresia?.[0]?.team_id ?? null
      }
    }
  }

  const teamSize = FORMAT_TEAM_SIZE[torneo.formato as TournamentFormat] ?? 1
  const equiposConCupo = inscritosActivos
    .map((r: any) => ({ id: r.team?.id, nombre: r.team?.nombre, miembros: r.team?.miembros?.[0]?.count ?? 1 }))
    .filter((t: any) => t.id && t.miembros < teamSize)

  // Group by (bracket, ronda_numero) — en eliminación doble 'main' y
  // 'losers' pueden compartir el mismo número de ronda, así que agrupar
  // solo por ronda_numero los mezclaría en una sola columna.
  const BRACKET_ORDEN: Record<string, number> = { main: 0, losers: 1, grand_final: 2 }
  const rounds: Map<string, any[]> = new Map()
  matches?.forEach((m: any) => {
    const key = `${m.bracket ?? 'main'}-${m.ronda_numero}`
    if (!rounds.has(key)) rounds.set(key, [])
    rounds.get(key)!.push(m)
  })
  const roundEntries = Array.from(rounds.entries()).sort((a, b) => {
    const [bracketA, roundNumA] = a[1][0] ? [a[1][0].bracket ?? 'main', a[1][0].ronda_numero] : ['main', 0]
    const [bracketB, roundNumB] = b[1][0] ? [b[1][0].bracket ?? 'main', b[1][0].ronda_numero] : ['main', 0]
    const ordenDiff = BRACKET_ORDEN[bracketA] - BRACKET_ORDEN[bracketB]
    return ordenDiff !== 0 ? ordenDiff : roundNumA - roundNumB
  })

  const fc = FORMAT_COLOR[torneo.formato as TournamentFormat]
  const st = STATUS_STYLE[torneo.estado as TournamentStatus]
  const inscrCount = torneo.registros?.[0]?.count ?? 0
  const completedMatches = matches?.filter((m: any) => m.estado === 'jugado').length ?? 0
  const totalMatchCount = matches?.length ?? 0

  const sidebarItems = [
    { id: 'llave',        label: 'Llave',        icon: <IconBracket /> },
    { id: 'posiciones',   label: 'Posiciones',   icon: <IconList /> },
    { id: 'participantes',label: 'Participantes', icon: <IconPeople /> },
  ]

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top meta bar */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 0', display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <Link href="/brackets" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Brackets
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span>👥 {inscrCount} {torneo.formato === '7v7' ? 'clanes' : 'equipos'}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {FMT_LABEL[torneo.formato] ?? torneo.formato}
          </span>
          <span>📅 {new Date(torneo.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          {torneo.creator && (
            <span>👤 Organizado por <span style={{ color: 'var(--gold)' }}>{torneo.creator.nickname_juego}</span></span>
          )}
        </div>

        <style>{`
          @media (max-width: 760px) {
            .cor-bracket-layout { flex-direction: column !important; }
            .cor-bracket-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 12px 0 !important; }
            .cor-bracket-main { padding: 16px !important; }
          }
        `}</style>

        {/* Two-column layout: sidebar + content (se apila en mobile) */}
        <div className="cor-bracket-layout" style={{ display: 'flex', flex: 1, gap: 0 }}>

          {/* Sidebar */}
          <aside className="cor-bracket-sidebar" style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 0' }}>
            {/* Tournament title in sidebar */}
            <div style={{ padding: '0 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <span style={{ background: `${fc}18`, color: fc, border: `1px solid ${fc}33`, padding: '3px 9px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5 }}>
                  {FMT_LABEL[torneo.formato] ?? torneo.formato}
                </span>
                <span style={{ background: st.bg, color: st.color, padding: '3px 9px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {torneo.estado === 'live' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F44336', display: 'inline-block' }} />}
                  {st.label}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {torneo.nombre}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{inscrCount}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>EQUIPOS</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{completedMatches}/{totalMatchCount}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>PARTIDOS</div>
                </div>
              </div>
              {isOrganizer && torneo.estado === 'live' && (
                <div style={{ marginTop: 12 }}>
                  <FinalizarTorneoButton torneoId={torneo.id} />
                </div>
              )}
            </div>

            {/* Nav items */}
            {sidebarItems.map(({ id, label, icon }) => (
              <Link key={id} href={`/brackets/${torneo.id}?tab=${id}`} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                textDecoration: 'none', borderRadius: 8, margin: '2px 8px',
                background: tab === id ? 'rgba(212,175,55,0.1)' : 'transparent',
                color: tab === id ? 'var(--gold)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: tab === id ? 700 : 400,
                transition: 'all 0.15s',
                borderLeft: tab === id ? '3px solid var(--gold)' : '3px solid transparent',
              }}>
                <span style={{ color: tab === id ? 'var(--gold)' : 'var(--text-muted)', display: 'flex' }}>{icon}</span>
                {label}
              </Link>
            ))}
          </aside>

          {/* Main content */}
          <main className="cor-bracket-main" style={{ flex: 1, padding: '24px 28px', overflowX: 'auto', minWidth: 0 }}>

            {torneo.estado === 'draft' && isOrganizer && (
              <AbrirInscripcionesButton torneoId={torneo.id} />
            )}

            {torneo.estado === 'inscripciones' && user && playerId && (
              <InscripcionActions
                torneoId={torneo.id}
                formato={torneo.formato as TournamentFormat}
                playerId={playerId}
                personajesElegibles={personajesElegibles as any}
                yaInscritoTeamId={yaInscritoTeamId}
                equiposConCupo={equiposConCupo as any}
              />
            )}
            {torneo.estado === 'inscripciones' && !user && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
                <a href="/login" style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 13, textDecoration: 'none' }}>
                  Iniciá sesión con Discord para inscribirte →
                </a>
              </div>
            )}

            {/* ── TAB: LLAVE ───────────────────────────────── */}
            {tab === 'llave' && (
              roundEntries.length === 0 ? (
                isOrganizer && torneo.estado !== 'draft' ? (
                  <GenerarBracketButton torneoId={torneo.id} inscritos={teamIdsEnEsteTorneo.length} bracketType={torneo.bracket_type} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>El bracket aún no está disponible.</p>
                  </div>
                )
              ) : torneo.bracket_type === 'round_robin' ? (
                <div style={{ overflowX: 'auto' }}>
                  {/* Round headers */}
                  <div style={{ display: 'flex', gap: 0, minWidth: roundEntries.length * 240 }}>
                    {roundEntries.map(([roundNum, roundMatches]) => {
                      const roundName = roundMatches[0]?.ronda ?? `Ronda ${roundNum}`
                      return (
                        <div key={roundNum} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Round label */}
                          <div style={{ padding: '10px 12px 10px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, fontWeight: 600 }}>
                            {roundName}
                          </div>
                          {/* Matches */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '0 8px', gap: 12 }}>
                            {roundMatches.map((match: any) => (
                              <MatchCard key={match.id} match={match} isOrganizer={isOrganizer} fc={fc} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <BracketTree roundEntries={roundEntries} isOrganizer={isOrganizer} fc={fc} />
              )
            )}

            {/* ── TAB: POSICIONES ─────────────────────────── */}
            {tab === 'posiciones' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                  Tabla de Posiciones
                </div>
                {torneo.bracket_type !== 'round_robin' ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    Las posiciones están disponibles para torneos Round Robin.
                  </div>
                ) : (() => {
                  // Calcular standings para round robin
                  type StandRow = { nombre: string; W: number; L: number; D: number; pts: number }
                  const standings: Record<string, StandRow> = {}
                  matches?.forEach((m: any) => {
                    const na = m.equipo_a?.nombre
                    const nb = m.equipo_b?.nombre
                    if (!na || !nb) return
                    if (!standings[na]) standings[na] = { nombre: na, W: 0, L: 0, D: 0, pts: 0 }
                    if (!standings[nb]) standings[nb] = { nombre: nb, W: 0, L: 0, D: 0, pts: 0 }
                    if (m.estado !== 'jugado') return
                    if (!m.ganador_id) {
                      // Draw
                      standings[na].D++; standings[na].pts++
                      standings[nb].D++; standings[nb].pts++
                    } else if (m.ganador_id === m.equipo_a_id) {
                      standings[na].W++; standings[na].pts += 2
                      standings[nb].L++
                    } else {
                      standings[nb].W++; standings[nb].pts += 2
                      standings[na].L++
                    }
                  })
                  const rows = Object.values(standings).sort((a, b) => b.pts - a.pts || b.W - a.W)
                  return (
                    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 60px 60px 60px 70px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        {['#', 'EQUIPO', 'G', 'E', 'P', 'PTS'].map(c => (
                          <div key={c} style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{c}</div>
                        ))}
                      </div>
                      {rows.map((r, i) => (
                        <div key={r.nombre} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 60px 60px 60px 70px', padding: '12px 20px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: i < 3 ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{r.nombre}</div>
                          <div style={{ fontSize: 12, color: '#4CAF50', fontWeight: 600 }}>{r.W}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.D}</div>
                          <div style={{ fontSize: 12, color: '#f87171' }}>{r.L}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{r.pts}</div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ── TAB: PARTICIPANTES ──────────────────────── */}
            {tab === 'participantes' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                  {torneo.formato === '7v7' ? 'Clanes participantes' : 'Equipos participantes'} ({inscritos?.length ?? 0})
                </div>
                {!inscritos?.length ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay participantes inscritos.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {inscritos.map((r: any, i: number) => {
                      const team = r.team
                      if (!team) return null
                      const expulsado = r.estado === 'expulsado'
                      return (
                        <div key={team.id} style={{
                          background: '#0f0f0f',
                          border: `1px solid ${expulsado ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 10, padding: '14px 16px', opacity: expulsado ? 0.7 : 1,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div>
                              {r.seed && <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>SEED #{r.seed}</div>}
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: expulsado ? 'var(--text-muted)' : 'var(--text-primary)', marginBottom: 4, textDecoration: expulsado ? 'line-through' : 'none' }}>
                                {team.nombre}
                              </div>
                              {team.capitan && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cap: <span style={{ color: 'var(--text-secondary)' }}>{team.capitan.nickname_juego}</span></div>
                              )}
                            </div>
                          </div>

                          {expulsado ? (
                            <div style={{ marginTop: 8, background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)', borderRadius: 6, padding: '6px 10px' }}>
                              <div style={{ fontSize: 9, color: '#f87171', fontFamily: 'var(--font-display)', letterSpacing: 0.5, marginBottom: 2 }}>EXPULSADO</div>
                              {isOrganizer && r.motivo_expulsion && (
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.motivo_expulsion}</div>
                              )}
                            </div>
                          ) : isOrganizer && (
                            <div style={{ marginTop: 10 }}>
                              <ExpulsarButton torneoId={torneo.id} teamId={team.id} teamNombre={team.nombre} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}

/* ── Bracket tree (eliminación simple/doble) ─────────────────
 * A diferencia de round robin, acá cada partido tiene una relación
 * real con el/los que lo alimentan, así que se ubica cada uno en su
 * posición real del árbol (no repartido parejo) y se dibujan líneas
 * conectoras — si no, con byes y "TBD" de por medio no se entiende
 * qué partido sale de cuál. */
const ROW = 58
const COL_W = 184
const CARD_PAD = 6
const HEADER_H = 24
const CARD_CENTER = 25

const SECTION_LABEL: Record<string, string> = {
  losers: 'Llave de Perdedores',
  grand_final: 'Gran Final',
}

function BracketTree({ roundEntries, isOrganizer, fc }: { roundEntries: [string, any[]][]; isOrganizer: boolean; fc: string }) {
  const sections: { bracket: string; rounds: { key: string; roundNum: number; matches: any[] }[] }[] = []
  roundEntries.forEach(([key, matches]) => {
    const bracket = matches[0]?.bracket ?? 'main'
    const roundNum = matches[0]?.ronda_numero ?? 0
    let section = sections.find(s => s.bracket === bracket)
    if (!section) { section = { bracket, rounds: [] }; sections.push(section) }
    section.rounds.push({ key, roundNum, matches })
  })
  sections.forEach(s => s.rounds.sort((a, b) => a.roundNum - b.roundNum))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {sections.map(section => (
        <BracketSection key={section.bracket} section={section} isOrganizer={isOrganizer} fc={fc} />
      ))}
    </div>
  )
}

function BracketSection({ section, isOrganizer, fc }: { section: { bracket: string; rounds: { key: string; roundNum: number; matches: any[] }[] }; isOrganizer: boolean; fc: string }) {
  const rounds = section.rounds.map(r => ({ ...r, matches: [...r.matches].sort((a, b) => a.posicion - b.posicion) }))

  // Posición vertical (en "filas") de cada partido: ronda 1 en orden, y
  // cada ronda siguiente centrada entre los 2 partidos que la alimentan
  // (o alineada 1 a 1 si la ronda anterior tiene la misma cantidad, como
  // pasa en las rondas "mayores" de la llave de perdedores).
  const yByRound: number[][] = []
  rounds.forEach((r, idx) => {
    const n = r.matches.length
    if (idx === 0) { yByRound.push(r.matches.map((_, i) => i)); return }
    const prevY = yByRound[idx - 1]
    const prevN = prevY.length
    if (prevN === n * 2) yByRound.push(r.matches.map((_, i) => (prevY[2 * i] + prevY[2 * i + 1]) / 2))
    else if (prevN === n) yByRound.push(r.matches.map((_, i) => prevY[i]))
    else {
      // Relación irregular (byes repartidos de forma pareja, ronda de
      // "gran final" que junta 2 llaves, etc.) — no hay una única ronda
      // anterior de la que cada partido "sale" 2 a 1, así que en vez de
      // amontonar todo en un punto se reparten a lo largo del mismo rango
      // vertical que ocupó la ronda anterior. Pero si esta ronda tiene MAS
      // partidos que la anterior (bracket con byes concentrados mas
      // adelante, no solo al principio — ese rango queda mas chico que la
      // cantidad de tarjetas a mostrar) repartirlos ahi las amontona: se
      // fuerza un minimo de 1 fila de separacion entre cada una, centrado
      // sobre el rango anterior en vez de comprimido dentro de el.
      const lo = Math.min(...prevY), hi = Math.max(...prevY)
      if (n === 1) {
        yByRound.push([(lo + hi) / 2])
      } else if ((hi - lo) / (n - 1) >= 1) {
        yByRound.push(r.matches.map((_, i) => lo + (i / (n - 1)) * (hi - lo)))
      } else {
        const inicio = (lo + hi) / 2 - (n - 1) / 2
        yByRound.push(r.matches.map((_, i) => inicio + i))
      }
    }
  })

  const maxY = Math.max(0, ...yByRound.flat())
  const height = HEADER_H + (maxY + 1) * ROW
  const width = rounds.length * COL_W

  const connectors: { x1: number; y1: number; xm: number; x2: number; y2: number }[] = []
  rounds.forEach((r, idx) => {
    if (idx === 0) return
    const prevN = rounds[idx - 1].matches.length
    const n = r.matches.length
    const x2 = idx * COL_W + CARD_PAD
    const xm = idx * COL_W - COL_W / 2
    r.matches.forEach((_, i) => {
      const y2 = HEADER_H + yByRound[idx][i] * ROW + CARD_CENTER
      if (prevN === n * 2) {
        [2 * i, 2 * i + 1].forEach(pi => {
          connectors.push({ x1: idx * COL_W - CARD_PAD, y1: HEADER_H + yByRound[idx - 1][pi] * ROW + CARD_CENTER, xm, x2, y2 })
        })
      } else if (prevN === n) {
        connectors.push({ x1: idx * COL_W - CARD_PAD, y1: HEADER_H + yByRound[idx - 1][i] * ROW + CARD_CENTER, xm, x2, y2 })
      }
      // cuando no hay una relación 2:1 ni 1:1 clara (ej. gran final,
      // que junta a las dos llaves) no se traza línea — no hay una
      // única ronda anterior de la que "salga" en términos visuales.
    })
  })

  return (
    <div>
      {SECTION_LABEL[section.bracket] && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--gold)', letterSpacing: 1.5, marginBottom: 14, textTransform: 'uppercase', fontWeight: 700 }}>
          {SECTION_LABEL[section.bracket]}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ position: 'relative', width, height, minWidth: width }}>
          <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            {connectors.map((c, i) => (
              <path key={i} d={`M ${c.x1} ${c.y1} H ${c.xm} V ${c.y2} H ${c.x2}`} fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth={1.5} />
            ))}
          </svg>
          {rounds.map((r, colIdx) => (
            <div key={r.key}>
              <div style={{ position: 'absolute', left: colIdx * COL_W, top: 0, width: COL_W, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1, fontWeight: 600 }}>
                {r.matches[0]?.ronda ?? `Ronda ${r.roundNum}`}
              </div>
              {r.matches.map((match, i) => (
                <div key={match.id} style={{ position: 'absolute', left: colIdx * COL_W + CARD_PAD, top: HEADER_H + yByRound[colIdx][i] * ROW, width: COL_W - CARD_PAD * 2 }}>
                  <MatchCard match={match} isOrganizer={isOrganizer} fc={fc} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Match Card ─────────────────────────────────────────────── */
function MatchCard({ match, isOrganizer, fc }: { match: any; isOrganizer: boolean; fc: string }) {
  const teamA = match.equipo_a
  const teamB = match.equipo_b
  const ganadorId = match.ganador_id
  const isPlayed = match.estado === 'jugado'

  // Parse score — busca el patrón "N - N" en cualquier parte del texto
  // (el resultado puede ser solo el marcador o una frase con nombres,
  // ej. "Elven 2 - 0 Fuxi"), así que no alcanza con partir por "-". El
  // texto siempre empieza con el nombre de quien GANÓ, que no siempre
  // es el equipo A — hay que fijarse cuál nombre aparece primero para
  // no asignarle el número a quien no le corresponde.
  const scoreMatch = match.resultado?.match(/(\d+)\s*-\s*(\d+)/)
  let scoreA: number | null = null
  let scoreB: number | null = null
  if (scoreMatch) {
    const idxA = teamA ? match.resultado.indexOf(teamA.nombre) : -1
    const idxB = teamB ? match.resultado.indexOf(teamB.nombre) : -1
    const aApareceAntes = idxA !== -1 && (idxB === -1 || idxA <= idxB)
    scoreA = Number(aApareceAntes ? scoreMatch[1] : scoreMatch[2])
    scoreB = Number(aApareceAntes ? scoreMatch[2] : scoreMatch[1])
  }
  const isWalkover = isPlayed && !scoreMatch && !!match.resultado

  return (
    <div style={{
      background: '#0f0f0f',
      border: `1px solid ${isPlayed ? fc + '44' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Top accent */}
      <div style={{ height: 2, background: isPlayed ? `linear-gradient(90deg, ${fc}, ${fc}44)` : 'rgba(255,255,255,0.06)' }} />

      {/* Team A */}
      <TeamRow
        seed={match.posicion}
        team={teamA}
        score={scoreA}
        isWinner={!!ganadorId && ganadorId === teamA?.id}
        isLoser={!!ganadorId && ganadorId !== teamA?.id}
        borderBottom
      />
      {/* Team B */}
      <TeamRow
        team={teamB}
        score={scoreB}
        isWinner={!!ganadorId && ganadorId === teamB?.id}
        isLoser={!!ganadorId && ganadorId !== teamB?.id}
      />

      {/* Footer */}
      {(isOrganizer || isPlayed) && (
        <div style={{ padding: '2px 9px', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: isPlayed ? '#4CAF50' : 'var(--text-muted)', letterSpacing: 1 }}>
            {isPlayed ? (isWalkover ? 'JUGADO · W.O.' : 'JUGADO') : 'PENDIENTE'}
          </span>
          {isOrganizer && teamA && teamB && (
            <BracketActions matchId={match.id} teamA={teamA} teamB={teamB} isPlayed={isPlayed} resultadoActual={match.resultado} />
          )}
        </div>
      )}
    </div>
  )
}

function TeamRow({ seed, team, score, isWinner, isLoser, borderBottom }: { seed?: number; team: any; score: number | null; isWinner: boolean; isLoser: boolean; borderBottom?: boolean }) {
  const nameColor = isWinner ? 'var(--text-primary)' : isLoser ? 'var(--text-muted)' : 'var(--text-secondary)'
  const scoreBg = isWinner ? 'rgba(212,175,55,0.2)' : isLoser ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)'
  const scoreColor = isWinner ? 'var(--gold)' : 'var(--text-muted)'

  return (
    <div style={{
      padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 6,
      background: isWinner ? 'rgba(212,175,55,0.04)' : 'transparent',
      borderBottom: borderBottom ? '1px solid rgba(255,255,255,0.06)' : 'none',
    }}>
      {/* Seed */}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', width: 12, textAlign: 'center', flexShrink: 0 }}>
        {seed ?? ''}
      </span>
      {/* Team name */}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: isWinner ? 700 : 400, color: nameColor, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {team ? team.nombre : <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 10 }}>TBD</span>}
      </span>
      {/* Score */}
      {score !== null && score !== undefined && !isNaN(score) && (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: scoreColor, background: scoreBg, width: 20, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, flexShrink: 0 }}>
          {score}
        </span>
      )}
    </div>
  )
}
