import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { REINO_COLOR, getTier, temaTorneo, FORMAT_COLOR } from '@/lib/constants'
import type { Reino, UserRole } from '@/lib/types'
import { ROLE_LABEL, ROLE_COLOR, ROLE_BG } from '@/lib/roles'
import AgregarPersonaje from './AgregarPersonaje'
import ReclamarNickname from './ReclamarNickname'
import ElegirPrincipal from './ElegirPrincipal'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('players').select('discord_username').eq('id', id).single()
  return { title: data?.discord_username ?? 'Jugador' }
}

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}
const SHIELD_SRC: Record<string, string> = {
  Syrtis: '/shield-syrtis.png', Ignis: '/shield-ignis.png', Alsius: '/shield-alsius.png',
}

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  /* ── Cuenta del jugador ───────────────────────────── */
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single()

  if (!player) notFound()

  /* ── Todos sus personajes ─────────────────────────── */
  const { data: personajes } = await supabase
    .from('personajes')
    .select('*')
    .eq('player_id', id)
    .order('mmr', { ascending: false })

  /* ── Campeonatos ganados (por cualquiera de sus personajes) ─ */
  const personajeIds = personajes?.map(p => p.id) ?? []
  const { data: campeonatos } = personajeIds.length ? await supabase
    .from('campeonatos')
    .select('personaje_id, tipo, equipo_nombre, torneo:tournaments(id, nombre)')
    .in('personaje_id', personajeIds)
    : { data: null }
  const campeonatosPorPersonaje = new Map<string, { id: string; nombre: string; tipo: string; equipo_nombre: string | null }[]>()
  campeonatos?.forEach((c: any) => {
    if (!c.torneo) return
    const arr = campeonatosPorPersonaje.get(c.personaje_id) ?? []
    arr.push({ ...c.torneo, tipo: c.tipo ?? 'individual', equipo_nombre: c.equipo_nombre })
    campeonatosPorPersonaje.set(c.personaje_id, arr)
  })

  /* ── Sesión actual ────────────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user ? player.user_id === user.id : false

  /* ── Nombre a mostrar: el personaje "principal" elegido, si hay uno ── */
  const principal = personajes?.find(p => p.id === player.personaje_principal_id)
  const nombreCuenta = principal?.nickname_juego ?? player.discord_username ?? 'Jugador'

  /* ── MMR history del mejor personaje ─────────────── */
  const bestPersonaje = personajes?.[0]
  const { data: mmrHistoryRaw } = bestPersonaje ? await supabase
    .from('mmr_history')
    .select(`
      *, torneo:tournaments(id, nombre, formato, fecha_inicio, subclases_permitidas),
      match:matches(id, ronda, ganador_id, equipo_a:teams!matches_equipo_a_id_fkey(id, nombre), equipo_b:teams!matches_equipo_b_id_fkey(id, nombre))
    `)
    .eq('personaje_id', bestPersonaje.id) : { data: null }

  // Se ordena por la fecha real del torneo (fecha_inicio), no por created_at:
  // el historial se puede cargar retroactivamente mucho despues de jugado,
  // asi que created_at no refleja el orden cronologico real de los partidos.
  const mmrHistory = mmrHistoryRaw
    ?.slice()
    .sort((a: any, b: any) => (b.torneo?.fecha_inicio ?? '').localeCompare(a.torneo?.fecha_inicio ?? ''))
    .slice(0, 15) ?? null

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href="/jugadores" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Ranking</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)' }}>{nombreCuenta}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Panel izquierdo: cuenta ─────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tarjeta cuenta */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', overflow: 'hidden' }}>
                {player.discord_avatar
                  ? <img src={player.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gold)' }}>{nombreCuenta[0]?.toUpperCase()}</span>}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
                {nombreCuenta}
              </h1>
              {player.role && player.role !== 'player' && (
                <span style={{ display: 'inline-block', background: ROLE_BG[player.role as UserRole], color: ROLE_COLOR[player.role as UserRole], border: `1px solid ${ROLE_COLOR[player.role as UserRole]}55`, padding: '3px 10px', borderRadius: 4, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, marginBottom: 8 }}>
                  {ROLE_LABEL[player.role as UserRole]}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'rgba(88,101,242,0.8)' }}>
                <svg width="14" height="11" viewBox="0 0 71 55" fill="currentColor"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.7a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.6 37.6 0 0 0 25.5.8a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.8 4.9a.2.2 0 0 0-.1.1C1.6 18.7-.9 32.1.3 45.3a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1c1.4-1.9 2.6-3.9 3.6-5.9a.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4 30 30 0 0 0 .6-.5.2.2 0 0 1 .2 0c11.5 5.2 23.9 5.2 35.3 0a.2.2 0 0 1 .2 0l.6.5a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3c1 2 2.3 4 3.6 5.9a.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-9 .2.2 0 0 0 .1-.2C72.9 30 70 16.7 60.2 5a.2.2 0 0 0-.1-.1Z"/></svg>
                {player.discord_username}
              </div>
            </div>

            {/* Stats globales */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(212,175,55,0.5)', letterSpacing: 2 }}>
                RESUMEN
              </div>
              {[
                { label: 'Personajes', value: personajes?.length ?? 0, color: 'var(--text-primary)' },
                { label: 'Mejor MMR',  value: bestPersonaje?.mmr ?? '—', color: 'var(--gold)' },
                { label: 'Total PJ',   value: personajes?.reduce((s, p) => s + (p.partidas_jugadas ?? 0), 0) ?? 0, color: 'var(--text-primary)' },
              ].map(({ label, value, color }, i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Panel derecho ──────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Personajes */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>PERSONAJES</span>
                {isOwner && <AgregarPersonaje playerId={id} />}
              </div>

              {!personajes?.length ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13 }}>Sin personajes registrados.</div>
              ) : personajes.map((p, i) => {
                const rc = REINO_COLOR[p.reino as Reino] ?? 'var(--gold)'
                const tier = getTier(p.mmr)
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 36px', padding: '14px 20px', borderBottom: i < personajes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', gap: 8 }}>
                    {/* Personaje info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${rc}18`, border: `2px solid ${rc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                          {CLASE_ICON[p.clase]}
                        </div>
                        {SHIELD_SRC[p.reino] && (
                          <img src={SHIELD_SRC[p.reino]} alt={p.reino} width={13} height={13} className={`shield-${p.reino?.toLowerCase()}`} style={{ objectFit: 'contain', position: 'absolute', bottom: -2, right: -4 }} />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.nickname_juego}</span>
                          {p.verificado && <span style={{ fontSize: 11, color: '#2196F3' }} title="Verificado">✓</span>}
                          {campeonatosPorPersonaje.get(p.id)?.map(t => (
                            <span key={t.id} style={{ fontSize: 12 }} title={t.tipo === 'equipo' ? `Campeón de clan (${t.equipo_nombre}) — ${t.nombre}` : `Campeón de ${t.nombre}`}>
                              {t.tipo === 'equipo' ? '🛡️' : '🏆'}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: rc }}>{p.reino} · {p.clase}</div>
                      </div>
                    </div>
                    {/* MMR */}
                    <div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{p.mmr}</div>
                      <span className={`tier-pill ${tier.cssClass}`} style={{ display: 'inline-flex', marginTop: 2 }}>{tier.icon} {tier.name}</span>
                    </div>
                    {/* WR */}
                    <div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: Number(p.winrate) >= 55 ? '#4CAF50' : 'var(--text-secondary)', fontWeight: 600 }}>{p.winrate}%</div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>{p.partidas_jugadas} PJ</div>
                    </div>
                    {/* WS */}
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: p.winstreak > 0 ? '#4CAF50' : 'var(--text-muted)' }}>
                      {p.winstreak > 0 ? `🔥 ${p.winstreak}` : '—'}
                    </div>
                    {/* Reclamar / elegir principal */}
                    {isOwner
                      ? <ElegirPrincipal playerId={id} personajeId={p.id} esPrincipal={player.personaje_principal_id === p.id} />
                      : <ReclamarNickname personajeId={p.id} nickname={p.nickname_juego} />}
                  </div>
                )
              })}
            </div>

            {/* Historial de enfrentamientos */}
            {mmrHistory && mmrHistory.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>
                    HISTORIAL DE ENFRENTAMIENTOS — {bestPersonaje?.nickname_juego}
                  </span>
                </div>
                <div style={{ padding: '10px 20px 4px', display: 'flex', flexDirection: 'column' }}>
                  {mmrHistory.map((entry: any, i: number) => {
                    const match = entry.match
                    // El equipo de este personaje es el ganador o el
                    // perdedor según `entry.gano` — el rival es el otro
                    // de los dos equipos del partido.
                    const rival = match
                      ? (entry.gano
                          ? (match.ganador_id === match.equipo_a?.id ? match.equipo_b : match.equipo_a)
                          : (match.ganador_id === match.equipo_a?.id ? match.equipo_a : match.equipo_b))
                      : null

                    const tema = temaTorneo(entry.torneo?.subclases_permitidas)
                    const themeColor = tema?.color ?? FORMAT_COLOR[entry.torneo?.formato as keyof typeof FORMAT_COLOR] ?? 'var(--gold)'
                    const themeIcon = tema?.icon ?? '🏆'

                    // Se agrupan filas consecutivas del mismo torneo bajo un
                    // encabezado propio en vez de repetir el nombre en cada
                    // fila — así se distingue de un vistazo a qué torneo
                    // pertenece cada tanda de partidos.
                    const prevTorneoId = i > 0 ? mmrHistory[i - 1].torneo?.id : null
                    const esNuevoGrupo = entry.torneo?.id !== prevTorneoId

                    const content = (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0 7px 12px', borderLeft: `2px solid ${themeColor}55`, marginLeft: 2 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: entry.gano ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', border: `1px solid ${entry.gano ? '#4CAF50' : '#F44336'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                          {entry.gano ? '✓' : '✗'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rival ? <>vs {rival.nombre}</> : 'Rival desconocido'}
                          </div>
                          {match?.ronda && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{match.ronda}</div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: entry.delta > 0 ? '#4CAF50' : '#f87171', fontWeight: 700 }}>
                            {entry.delta > 0 ? '+' : ''}{entry.delta}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.mmr_despues} MMR</div>
                        </div>
                      </div>
                    )

                    return (
                      <div key={entry.id}>
                        {esNuevoGrupo && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            marginTop: i === 0 ? 0 : 14, marginBottom: 4, paddingLeft: 2,
                          }}>
                            <span style={{ fontSize: 12 }}>{themeIcon}</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: themeColor, letterSpacing: 0.5 }}>
                              {entry.torneo?.nombre ?? 'Partido'}
                            </span>
                            {entry.torneo?.fecha_inicio && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {new Date(entry.torneo.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR')}
                              </span>
                            )}
                            <div style={{ flex: 1, height: 1, background: `${themeColor}33` }} />
                          </div>
                        )}
                        {match?.id ? (
                          <Link href={`/brackets/${entry.torneo?.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            {content}
                          </Link>
                        ) : content}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginTop: 40 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
