import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { REINO_COLOR, FORMAT_LABEL, FORMAT_COLOR, MATCH_STATUS_STYLE } from '@/lib/constants'
import type { Reino, TournamentFormat, MatchStatus } from '@/lib/types'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('players').select('nickname_juego').eq('id', id).single()
  return { title: data?.nickname_juego ?? 'Jugador' }
}

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single()

  if (!player) notFound()

  // Historial de MMR
  const { data: mmrHistory } = await supabase
    .from('mmr_history')
    .select('*, torneo:tournaments(nombre, formato)')
    .eq('player_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Torneos participados
  const { data: torneos } = await supabase
    .from('tournament_registrations')
    .select('tournament_id, tournaments(id, nombre, formato, estado, fecha_inicio)')
    .eq('teams.capitan_id', id)
    .limit(10)

  const rc = REINO_COLOR[player.reino as Reino]

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href="/jugadores" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Jugadores</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)' }}>{player.nickname_juego}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>

          {/* Left: Profile card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: `linear-gradient(160deg, var(--bg-card), ${rc}11)`,
              border: `1px solid ${rc}44`,
              borderRadius: 14, padding: 28, textAlign: 'center',
            }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: `${rc}22`, border: `3px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, margin: '0 auto 16px' }}>
                {CLASE_ICON[player.clase_principal]}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
                {player.nickname_juego}
              </h1>
              <div style={{ fontSize: 13, color: rc, marginBottom: 16 }}>{player.reino} · {player.clase_principal}</div>
              {player.bio && <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>{player.bio}</p>}
            </div>

            {/* Stats */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
              {[
                { label: 'MMR Global',    value: player.mmr_global.toLocaleString(), color: 'var(--gold)' },
                { label: 'Winrate',       value: `${player.winrate}%`,               color: player.winrate >= 60 ? '#4CAF50' : 'var(--text-primary)' },
                { label: 'Partidas',      value: player.partidas_jugadas,             color: 'var(--text-primary)' },
                { label: 'Victorias',     value: player.partidas_ganadas,             color: '#4CAF50' },
                { label: 'Derrotas',      value: player.partidas_jugadas - player.partidas_ganadas, color: '#f87171' },
              ].map(({ label, value, color }, i) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 18px',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>

            {player.discord_username && (
              <div style={{ background: 'rgba(88,101,242,0.08)', border: '1px solid rgba(88,101,242,0.3)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#8ca0f0' }}>
                <svg width="16" height="13" viewBox="0 0 71 55" fill="currentColor"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.7a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.6 37.6 0 0 0 25.5.8a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.8 4.9a.2.2 0 0 0-.1.1C1.6 18.7-.9 32.1.3 45.3a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1c1.4-1.9 2.6-3.9 3.6-5.9a.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4 30 30 0 0 0 .6-.5.2.2 0 0 1 .2 0c11.5 5.2 23.9 5.2 35.3 0a.2.2 0 0 1 .2 0l.6.5a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3c1 2 2.3 4 3.6 5.9a.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-9 .2.2 0 0 0 .1-.2C72.9 30 70 16.7 60.2 5a.2.2 0 0 0-.1-.1Z"/></svg>
                {player.discord_username}
              </div>
            )}
          </div>

          {/* Right: History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* MMR Trend */}
            {mmrHistory && mmrHistory.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>
                  HISTORIAL MMR
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mmrHistory.map((entry: any) => (
                    <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: entry.gano ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', border: `1px solid ${entry.gano ? '#4CAF50' : '#F44336'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                        {entry.gano ? '✓' : '✗'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.torneo?.nombre ?? 'Partido'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(entry.created_at).toLocaleDateString('es-AR')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: entry.delta > 0 ? '#4CAF50' : '#f87171', fontWeight: 700 }}>
                          {entry.delta > 0 ? '+' : ''}{entry.delta}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.mmr_despues.toLocaleString()} MMR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!mmrHistory || mmrHistory.length === 0) && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚔️</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>Sin historial de partidas aún.</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>¡Participá en un torneo para registrar tu primera victoria!</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
