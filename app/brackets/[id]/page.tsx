import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE, MATCH_STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus, MatchStatus } from '@/lib/types'
import BracketActions from './BracketActions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('tournaments').select('nombre').eq('id', id).single()
  return { title: data?.nombre ?? 'Bracket' }
}

export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: torneo } = await supabase
    .from('tournaments')
    .select('*, creator:players(nickname_juego), registros:tournament_registrations(count)')
    .eq('id', id)
    .single()

  if (!torneo) notFound()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      equipo_a:teams!matches_equipo_a_id_fkey(id, nombre),
      equipo_b:teams!matches_equipo_b_id_fkey(id, nombre),
      ganador:teams!matches_ganador_id_fkey(id, nombre)
    `)
    .eq('torneo_id', id)
    .order('ronda_numero', { ascending: true })
    .order('posicion', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  let isOrganizer = false
  if (user) {
    const { data: player } = await supabase
      .from('players')
      .select('id, role')
      .eq('user_id', user.id)
      .single()
    isOrganizer = !!(player && ['organizer', 'admin'].includes(player.role))
  }

  // Group matches by round
  const rounds: Map<number, any[]> = new Map()
  matches?.forEach((m: any) => {
    if (!rounds.has(m.ronda_numero)) rounds.set(m.ronda_numero, [])
    rounds.get(m.ronda_numero)!.push(m)
  })
  const roundEntries = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0])

  const fc = FORMAT_COLOR[torneo.formato as TournamentFormat]
  const st = STATUS_STYLE[torneo.estado as TournamentStatus]
  const inscritos = torneo.registros?.[0]?.count ?? 0

  const completedMatches = matches?.filter((m: any) => m.estado === 'jugado').length ?? 0
  const totalMatches = matches?.length ?? 0

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href="/brackets" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Brackets</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)' }}>{torneo.nombre}</span>
        </div>

        {/* Header card */}
        <div style={{
          background: 'var(--bg-card)', border: `1px solid ${fc}44`,
          borderRadius: 14, overflow: 'hidden', marginBottom: 32,
        }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${fc}, ${fc}55)` }} />
          <div style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ background: `${fc}22`, color: fc, border: `1px solid ${fc}33`, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1 }}>
                  {FORMAT_LABEL[torneo.formato as TournamentFormat]}
                </span>
                <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1 }}>
                  {torneo.estado === 'live' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F44336', marginRight: 5 }} />}
                  {st.label}
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
                {torneo.nombre}
              </h1>
              {torneo.descripcion && <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 600 }}>{torneo.descripcion}</p>}
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'EQUIPOS', value: `${inscritos}/${torneo.max_equipos}` },
                { label: 'PARTIDOS', value: `${completedMatches}/${totalMatches}` },
                { label: 'FECHA', value: new Date(torneo.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) },
                ...(torneo.premio ? [{ label: 'PREMIO', value: torneo.premio }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bracket */}
        {roundEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>El bracket aún no está disponible.</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Las llaves se generarán cuando el torneo comience.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
            <div style={{ display: 'flex', gap: 0, minWidth: roundEntries.length * 260 }}>
              {roundEntries.map(([roundNum, roundMatches], colIdx) => {
                const isLast = colIdx === roundEntries.length - 1
                const roundName = roundMatches[0]?.ronda ?? `Ronda ${roundNum}`
                return (
                  <div key={roundNum} style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {/* Round label */}
                    <div style={{ padding: '10px 12px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                      {roundName.toUpperCase()}
                    </div>
                    {/* Matches */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '16px 8px', gap: 16 }}>
                      {roundMatches.map((match: any) => (
                        <MatchCard key={match.id} match={match} isOrganizer={isOrganizer} fc={fc} isLast={isLast} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Inscribed teams */}
        <InscritosSection torneoId={id} />

      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}

function MatchCard({ match, isOrganizer, fc, isLast }: { match: any; isOrganizer: boolean; fc: string; isLast: boolean }) {
  const mst = MATCH_STATUS_STYLE[match.estado as MatchStatus]
  const teamA = match.equipo_a
  const teamB = match.equipo_b
  const ganadorId = match.ganador_id

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${match.estado === 'jugado' ? fc + '55' : 'var(--border)'}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        {/* Status bar */}
        <div style={{ height: 2, background: match.estado === 'jugado' ? fc : match.estado === 'live' ? '#F44336' : 'var(--border)' }} />

        {/* Team A */}
        <TeamSlot team={teamA} isWinner={ganadorId === teamA?.id} isLoser={!!ganadorId && ganadorId !== teamA?.id} />
        <div style={{ height: 1, background: 'var(--border)' }} />
        {/* Team B */}
        <TeamSlot team={teamB} isWinner={ganadorId === teamB?.id} isLoser={!!ganadorId && ganadorId !== teamB?.id} />

        {/* Status */}
        <div style={{ padding: '4px 10px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: mst.color, letterSpacing: 1 }}>{mst.label.toUpperCase()}</span>
          {isOrganizer && match.estado !== 'jugado' && teamA && teamB && (
            <BracketActions matchId={match.id} teamA={teamA} teamB={teamB} />
          )}
        </div>
      </div>
    </div>
  )
}

function TeamSlot({ team, isWinner, isLoser }: { team: any; isWinner: boolean; isLoser: boolean }) {
  const color = isWinner ? '#4CAF50' : isLoser ? 'var(--text-muted)' : 'var(--text-primary)'
  return (
    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, background: isWinner ? 'rgba(76,175,80,0.05)' : 'transparent' }}>
      {isWinner && <span style={{ fontSize: 12 }}>🏆</span>}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: isWinner ? 700 : 400, color, flex: 1 }}>
        {team ? team.nombre : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>TBD</span>}
      </span>
    </div>
  )
}

async function InscritosSection({ torneoId }: { torneoId: string }) {
  const supabase = await createServerSupabase()
  const { data: inscritos } = await supabase
    .from('tournament_registrations')
    .select('team:teams(id, nombre, capitan:players!teams_capitan_id_fkey(nickname_juego, reino))')
    .eq('tournament_id', torneoId)

  if (!inscritos?.length) return null

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 14 }}>
        EQUIPOS INSCRITOS ({inscritos.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {inscritos.map((r: any) => {
          const team = r.team
          if (!team) return null
          return (
            <div key={team.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{team.nombre}</div>
              {team.capitan && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cap: {team.capitan.nickname_juego}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
