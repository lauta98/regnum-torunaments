import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { UserRole } from '@/lib/types'
import { ROLE_LABEL, ROLE_COLOR, ROLE_BG } from '@/lib/roles'
import { FORMAT_COLOR, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'
import PersonajesYHistorial from './PersonajesYHistorial'
import { agruparTrofeos } from '@/lib/campeonatos'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data } = await supabase.from('players').select('discord_username').eq('id', id).single()
  return { title: data?.discord_username ?? 'Jugador' }
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
    .select('personaje_id, tipo, equipo_nombre, puesto, torneo:tournaments(nombre, formato, trofeo:trofeos!tournaments_trofeo_id_fkey(nombre, icono, color, forma), trofeo_subcampeon:trofeos!tournaments_trofeo_subcampeon_id_fkey(nombre, icono, color, forma))')
    .in('personaje_id', personajeIds)
    : { data: null }
  const trofeosPorPersonaje = agruparTrofeos(campeonatos as any)

  /* ── Nicknames anteriores (personajes fusionados que cambiaron de nombre) ── */
  const { data: nicknamesAnteriores } = personajeIds.length ? await supabase
    .from('personaje_nicknames_anteriores')
    .select('personaje_id, nickname')
    .in('personaje_id', personajeIds)
    : { data: null }
  const nicknamesAnterioresPorPersonaje: Record<string, string[]> = {}
  nicknamesAnteriores?.forEach((n: any) => {
    const arr = nicknamesAnterioresPorPersonaje[n.personaje_id] ?? []
    arr.push(n.nickname)
    nicknamesAnterioresPorPersonaje[n.personaje_id] = arr
  })

  /* ── Torneos que organizó (creador) o co-organizó ─────────── */
  const [{ data: torneosCreados }, { data: coOrgRows }] = await Promise.all([
    supabase.from('tournaments').select('id, nombre, formato, estado, created_at').eq('creator_id', id).order('created_at', { ascending: false }),
    supabase.from('tournament_organizers').select('tournament:tournaments(id, nombre, formato, estado, created_at)').eq('player_id', id),
  ])
  const torneosOrganizados = [
    ...(torneosCreados ?? []).map((t: any) => ({ ...t, rol: 'creador' as const })),
    ...(coOrgRows ?? []).filter((r: any) => r.tournament).map((r: any) => ({ ...r.tournament, rol: 'co-organizador' as const })),
  ].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

  /* ── Sesión actual ────────────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user ? player.user_id === user.id : false

  /* ── Nombre a mostrar: el personaje "principal" elegido, si hay uno ── */
  const principal = personajes?.find(p => p.id === player.personaje_principal_id)
  const nombreCuenta = principal?.nickname_juego ?? player.discord_username ?? 'Jugador'

  /* ── MMR history de TODOS los personajes (el usuario elige cuál ver) ── */
  const bestPersonaje = personajes?.[0]
  const { data: mmrHistoryRaw } = personajeIds.length ? await supabase
    .from('mmr_history')
    .select(`
      *, torneo:tournaments(id, nombre, formato, fecha_inicio, subclases_permitidas),
      match:matches(id, ronda, ganador_id, equipo_a:teams!matches_equipo_a_id_fkey(id, nombre), equipo_b:teams!matches_equipo_b_id_fkey(id, nombre))
    `)
    .in('personaje_id', personajeIds) : { data: null }

  // Se ordena por la fecha real del torneo (fecha_inicio), no por created_at:
  // el historial se puede cargar retroactivamente mucho despues de jugado,
  // asi que created_at no refleja el orden cronologico real de los partidos.
  // Despues se agrupa por personaje_id para que el cliente pueda cambiar
  // de un historial a otro sin volver a pedirle datos al servidor.
  const historiasPorPersonaje: Record<string, any[]> = {}
  mmrHistoryRaw
    ?.slice()
    .sort((a: any, b: any) => (b.torneo?.fecha_inicio ?? '').localeCompare(a.torneo?.fecha_inicio ?? ''))
    .forEach((entry: any) => {
      const arr = historiasPorPersonaje[entry.personaje_id] ?? []
      if (arr.length < 100) arr.push(entry)
      historiasPorPersonaje[entry.personaje_id] = arr
    })

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
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 24, textAlign: 'center' }}>
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
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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

            {torneosOrganizados.length > 0 && (
              <div className="card-section">
                <div className="card-section__title">Torneos organizados</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {torneosOrganizados.map(t => {
                    const st = STATUS_STYLE[t.estado as TournamentStatus]
                    return (
                      <Link
                        key={t.id} href={`/brackets/${t.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                          borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none',
                        }}
                      >
                        <span style={{
                          width: 4, height: 22, borderRadius: 2, flexShrink: 0,
                          background: FORMAT_COLOR[t.formato as TournamentFormat] ?? 'var(--gold)',
                        }} />
                        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.nombre}
                        </span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.5, flexShrink: 0 }}>
                          {t.rol === 'creador' ? 'CREADOR' : 'CO-ORGANIZADOR'}
                        </span>
                        {st && (
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: st.color, background: st.bg, padding: '2px 8px', borderRadius: 4, letterSpacing: 0.5, flexShrink: 0 }}>
                            {st.label}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <PersonajesYHistorial
              playerId={id}
              personajes={personajes ?? []}
              isOwner={isOwner}
              personajePrincipalId={player.personaje_principal_id}
              trofeosPorPersonaje={Object.fromEntries(trofeosPorPersonaje)}
              historiasPorPersonaje={historiasPorPersonaje}
              nicknamesAnterioresPorPersonaje={nicknamesAnterioresPorPersonaje}
            />

          </div>
        </div>
      </main>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginTop: 40 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
