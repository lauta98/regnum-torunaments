import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FORMAT_COLOR, STATUS_STYLE, MATCH_STATUS_STYLE, FORMAT_TEAM_SIZE, BRACKET_TYPE_LABEL, getTier } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus, MatchStatus, BracketType } from '@/lib/types'
import BracketActions from './BracketActions'
import InscripcionActions from './InscripcionActions'
import GenerarBracketButton from './GenerarBracketButton'
import GenerarCopaButton from './GenerarCopaButton'
import AbrirInscripcionesButton from './AbrirInscripcionesButton'
import FinalizarTorneoButton from './FinalizarTorneoButton'
import ExpulsarButton from './ExpulsarButton'
import AgregarParticipanteButton from './AgregarParticipanteButton'
import TeamNameLink from './TeamNameLink'
import SubirFoto from '@/app/salon-de-la-fama/SubirFoto'
import TrofeoBadge from '@/components/TrofeoBadge'
import { esOrganizadorDelTorneo } from '@/lib/roles'
import { previewBracket } from '@/lib/bracketGen'

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
    .select('*, creator:players!tournaments_creator_id_fkey(id, nickname_juego, discord_avatar), escudo:trofeos!tournaments_escudo_id_fkey(nombre, icono, color, forma)')
    .eq('id', id).single()

  if (!torneo) notFound()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      equipo_a:teams!matches_equipo_a_id_fkey(id, nombre, miembros:team_members(personaje:personajes(id, nickname_juego, player_id))),
      equipo_b:teams!matches_equipo_b_id_fkey(id, nombre, miembros:team_members(personaje:personajes(id, nickname_juego, player_id))),
      ganador:teams!matches_ganador_id_fkey(id, nombre)
    `)
    .eq('torneo_id', id)
    .order('ronda_numero', { ascending: true })
    .order('posicion', { ascending: true })

  const { data: inscritos } = await supabase
    .from('tournament_registrations')
    .select(`
      seed, estado, motivo_expulsion, registered_at,
      team:teams(
        id, nombre,
        capitan:players!teams_capitan_id_fkey(id, nickname_juego, discord_username, reino),
        miembros:team_members(personaje:personajes(id, nickname_juego, mmr, clase, player_id))
      )
    `)
    .eq('tournament_id', id)
    .order('seed', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  let isOrganizer = false
  let puedeExpulsar = false
  let playerId: string | null = null
  let personajesElegibles: { id: string; nickname_juego: string; clase: string }[] = []
  let yaInscritoTeamId: string | null = null

  const inscritosActivos = (inscritos ?? []).filter((r: any) => r.estado !== 'expulsado')
  const teamIdsEnEsteTorneo = inscritosActivos.map((r: any) => r.team?.id).filter(Boolean)
  // Para el selector de "cambiar equipo" en cada partido — cualquier
  // equipo activo del torneo, no solo los dos que ya están en ese cruce.
  const equiposParaCambio = inscritosActivos
    .map((r: any) => ({ id: r.team?.id, nombre: r.team?.nombre }))
    .filter((e: any) => e.id)

  // Vista previa del cuadro (sin generar nada todavía) — mismo orden que
  // usaría "Generar cuadro": por semilla si ya se guardó, si no por orden
  // de inscripción.
  const equiposOrdenParaPreview = inscritosActivos
    .map((r: any) => ({ id: r.team?.id, nombre: r.team?.nombre, seed: r.seed as number | null }))
    .filter((e: any) => e.id)
    .sort((a: any, b: any) => (a.seed ?? 999) - (b.seed ?? 999))

  if (user) {
    const { data: player } = await supabase.from('players').select('id, role').eq('user_id', user.id).single()
    if (player) {
      playerId = player.id
      puedeExpulsar = torneo.creator_id === player.id || player.role === 'admin'
      isOrganizer = puedeExpulsar || await esOrganizadorDelTorneo(supabase, id, torneo.creator_id, player)
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
    .map((r: any) => ({ id: r.team?.id, nombre: r.team?.nombre, miembros: r.team?.miembros?.length ?? 1 }))
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

  // Liga + Copa: la fase de liga (bracket='league') se lista aparte de la
  // copa (bracket='main'/'losers'/'grand_final', generada después con un
  // botón manual una vez que la liga termina).
  const ligaEntries = roundEntries.filter(([key]) => key.startsWith('league-'))
  const copaEntries = roundEntries.filter(([key]) => !key.startsWith('league-'))
  const ligaMatches = matches?.filter((m: any) => m.bracket === 'league') ?? []
  const ligaCompleta = ligaMatches.length > 0 && ligaMatches.every((m: any) => m.estado === 'jugado')

  // Solo tiene sentido armar la vista previa cuando todavía no hay cuadro
  // real generado — una vez generado, roundEntries ya no está vacío y se
  // muestra el de verdad.
  const previewEntries = roundEntries.length === 0 && torneo.estado !== 'draft'
    ? previewBracket(torneo.bracket_type, equiposOrdenParaPreview)
    : []

  const fc = FORMAT_COLOR[torneo.formato as TournamentFormat]
  const st = STATUS_STYLE[torneo.estado as TournamentStatus]
  // No usa un count crudo de tournament_registrations — ese incluiría a
  // los expulsados. inscritosActivos ya filtra estado !== 'expulsado'.
  const inscrCount = inscritosActivos.length
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

      {/* Portada del torneo — mismo tratamiento que Salón de la Fama; si
          no hay foto, no ocupa lugar (no queda un hueco vacío). */}
      {(torneo.imagen_url || isOrganizer) && (
        <div style={{
          height: 200, position: 'relative', overflow: 'hidden',
          background: torneo.imagen_url
            ? `url(${torneo.imagen_url}) center/cover`
            : 'radial-gradient(120% 140% at 15% 0%, #1c1600 0%, #0e0c04 45%, #0a0a0a 100%)',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)' }} />
          {isOrganizer && (
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
              <SubirFoto tabla="tournaments" id={torneo.id} campo="imagen_url" label="Cambiar foto del torneo" variant="icon" aspectRatio={5} />
            </div>
          )}
          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 14, zIndex: 1, maxWidth: 1600 - 48, margin: '0 auto' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)', lineHeight: 1.25 }}>
              {torneo.nombre}
            </h1>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1600, width: '100%', margin: '0 auto', padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

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
            <span>👤 Organizado por <Link href={`/jugadores/${torneo.creator.id}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>{torneo.creator.nickname_juego}</Link></span>
          )}
          {torneo.organizador_verificado && (
            <span title="Torneo verificado por la administración" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4CAF50' }}>
              ✓ Verificado
            </span>
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
        <div className="cor-bracket-layout" style={{ display: 'flex', flex: 1, gap: 0, minWidth: 0 }}>

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
                <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 9px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5 }}>
                  {BRACKET_TYPE_LABEL[torneo.bracket_type as BracketType] ?? torneo.bracket_type}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 6 }}>
                {torneo.escudo && <TrofeoBadge trofeo={torneo.escudo} size="sm" title={`Escudo: ${torneo.escudo.nombre}`} />}
                <span>
                  {torneo.nombre}
                  {torneo.organizador_verificado && (
                    <span title="Torneo verificado por la administración" style={{ color: '#4CAF50', marginLeft: 6, fontSize: 12 }}>✓</span>
                  )}
                </span>
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
              {isOrganizer && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href={`/organizador/torneos/${torneo.id}`} className="btn btn-ghost-gold" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '7px 0', fontSize: 10.5, textDecoration: 'none',
                  }}>
                    ✎ Editar torneo
                  </Link>
                  {torneo.estado === 'live' && <FinalizarTorneoButton torneoId={torneo.id} />}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
                  {isOrganizer && torneo.estado !== 'draft' && (
                    <GenerarBracketButton
                      torneoId={torneo.id} inscritos={teamIdsEnEsteTorneo.length} bracketType={torneo.bracket_type}
                      equipos={inscritosActivos.map((r: any) => ({ id: r.team?.id, nombre: r.team?.nombre, seed: r.seed })).filter((e: any) => e.id)}
                    />
                  )}
                  {previewEntries.length > 0 ? (
                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                        fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--neon-cyan)', letterSpacing: 0.5,
                        background: 'var(--neon-cyan-muted)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 'var(--radius-sm)',
                        padding: '9px 14px',
                      }}>
                        👁 VISTA PREVIA — según el orden de semillas actual. El cuadro real se genera cuando {isOrganizer ? 'lo confirmes arriba' : 'el organizador lo confirme'}.
                      </div>
                      {(torneo.bracket_type === 'round_robin' || torneo.bracket_type === 'league_cup') ? (
                        <LigaFechas entries={previewEntries} isOrganizer={false} fc={fc} />
                      ) : (
                        <BracketTree roundEntries={previewEntries} isOrganizer={false} fc={fc} />
                      )}
                    </div>
                  ) : !(isOrganizer && torneo.estado !== 'draft') && (
                    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>El bracket aún no está disponible.</p>
                    </div>
                  )}
                </div>
              ) : torneo.bracket_type === 'round_robin' ? (
                <LigaFechas entries={roundEntries} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposParaCambio} />
              ) : torneo.bracket_type === 'league_cup' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--gold)', letterSpacing: 1.5, marginBottom: 14, textTransform: 'uppercase', fontWeight: 700 }}>
                      Fase de Liga
                    </div>
                    <LigaFechas entries={ligaEntries} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposParaCambio} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--gold)', letterSpacing: 1.5, marginBottom: 14, textTransform: 'uppercase', fontWeight: 700 }}>
                      Copa
                    </div>
                    {copaEntries.length > 0 ? (
                      <BracketTree roundEntries={copaEntries} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposParaCambio} />
                    ) : ligaCompleta ? (
                      isOrganizer ? (
                        <GenerarCopaButton torneoId={torneo.id} cupo={torneo.playoff_cupo ?? 0} />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>La liga terminó — la copa se genera en cualquier momento.</p>
                        </div>
                      )
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Disponible cuando termine la fase de liga.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <BracketTree roundEntries={roundEntries} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposParaCambio} />
              )
            )}

            {/* ── TAB: POSICIONES ─────────────────────────── */}
            {tab === 'posiciones' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                  Tabla de Posiciones
                </div>
                {torneo.bracket_type !== 'round_robin' && torneo.bracket_type !== 'league_cup' ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    Las posiciones están disponibles para torneos Liga y Liga + Copa.
                  </div>
                ) : (() => {
                  // Calcular standings de la fase de liga (para Liga+Copa,
                  // solo cuentan los partidos de la liga, no los de la copa)
                  const matchesLiga = torneo.bracket_type === 'league_cup'
                    ? matches?.filter((m: any) => m.bracket === 'league')
                    : matches
                  type StandRow = { nombre: string; W: number; L: number; D: number; pts: number }
                  const standings: Record<string, StandRow> = {}
                  matchesLiga?.forEach((m: any) => {
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
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {torneo.formato === '7v7' ? 'Clanes participantes' : 'Equipos participantes'} ({inscritos?.length ?? 0})
                  </div>
                  {isOrganizer && (
                    <AgregarParticipanteButton
                      torneoId={torneo.id}
                      formato={torneo.formato as TournamentFormat}
                      subclasesPermitidas={torneo.subclases_permitidas}
                    />
                  )}
                </div>
                {!inscritos?.length ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hay participantes inscritos.</div>
                ) : (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 90px 130px 90px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
                      {['#', torneo.formato === '7v7' ? 'CLAN' : 'EQUIPO', 'MMR', 'INSCRIPTO', ''].map(c => (
                        <div key={c} style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{c}</div>
                      ))}
                    </div>
                    {inscritos.map((r: any, i: number) => {
                      const team = r.team
                      if (!team) return null
                      const expulsado = r.estado === 'expulsado'
                      const miembros = (team.miembros ?? []).filter((m: any) => m.personaje)
                      const esUnico = miembros.length <= 1
                      return (
                        <div key={team.id} className="row-hover" style={{
                          display: 'grid', gridTemplateColumns: '48px 1fr 90px 130px 90px', alignItems: 'center',
                          padding: '10px 20px', gap: 8, opacity: expulsado ? 0.6 : 1,
                          borderBottom: i < inscritos.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)' }}>
                            {r.seed ?? i + 1}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{
                                fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 700,
                                color: expulsado ? 'var(--text-muted)' : 'var(--text-primary)',
                                textDecoration: expulsado ? 'line-through' : 'none',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260,
                              }}>
                                {team.nombre}
                              </span>
                              {team.capitan?.discord_username && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                                  @{team.capitan.discord_username}
                                </span>
                              )}
                              {expulsado && (
                                <span style={{ fontSize: 8, fontFamily: 'var(--font-display)', color: '#f87171', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.25)', borderRadius: 4, padding: '1px 6px', letterSpacing: 0.5, flexShrink: 0 }}>
                                  EXPULSADO
                                </span>
                              )}
                            </div>
                            {team.capitan?.nickname_juego && (
                              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                                Cap: {team.capitan.id ? (
                                  <Link href={`/jugadores/${team.capitan.id}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{team.capitan.nickname_juego}</Link>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)' }}>{team.capitan.nickname_juego}</span>
                                )}
                              </div>
                            )}
                            {!esUnico && miembros.length > 0 && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', flexWrap: 'wrap', gap: '0 4px' }}>
                                {miembros.map((m: any, mi: number) => (
                                  <span key={m.personaje.id}>
                                    {m.personaje.player_id ? (
                                      <Link href={`/jugadores/${m.personaje.player_id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{m.personaje.nickname_juego}</Link>
                                    ) : m.personaje.nickname_juego}
                                    {mi < miembros.length - 1 ? ' ·' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                            {expulsado && puedeExpulsar && r.motivo_expulsion && (
                              <div style={{ fontSize: 10.5, color: '#f87171', marginTop: 2 }}>{r.motivo_expulsion}</div>
                            )}
                          </div>

                          <div>
                            {esUnico && miembros[0] && (
                              <span className={`tier-pill ${getTier(miembros[0].personaje.mmr).cssClass}`} title={`MMR: ${miembros[0].personaje.mmr}`}>
                                {getTier(miembros[0].personaje.mmr).icon} {miembros[0].personaje.mmr}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                            {r.registered_at && new Date(r.registered_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>

                          <div style={{ position: 'relative' }}>
                            {!expulsado && puedeExpulsar && (
                              <ExpulsarButton torneoId={torneo.id} teamId={team.id} teamNombre={team.nombre} />
                            )}
                          </div>
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
// Las tarjetas de partido miden ~103px de alto con el footer (estado +
// acciones de organizador — el organizador SIEMPRE lo ve, jugado o no; un
// visitante solo lo ve si ya está jugado): ROW tiene que ser mayor a eso o
// las filas contiguas de una misma ronda se pisan. CARD_CENTER es la mitad
// de esa altura, para que las líneas conectoras salgan del centro vertical
// real de la tarjeta (medido a mano contra el render — ver brackets/[id]).
const ROW = 118
const COL_W = 224
const CARD_PAD = 8
const HEADER_H = 30
const CARD_CENTER = 52

const SECTION_LABEL: Record<string, string> = {
  losers: 'Llave de Perdedores',
  grand_final: 'Gran Final',
}

/** Fase de liga (round robin puro, o la fase de liga de Liga + Copa):
 *  lista simple de fechas, sin árbol de conectores — acá no hay "quién
 *  avanza a quién", cada fecha es independiente. */
function LigaFechas({ entries, isOrganizer, fc, equiposDisponibles }: { entries: [string, any[]][]; isOrganizer: boolean; fc: string; equiposDisponibles?: { id: string; nombre: string }[] }) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>Sin partidos todavía.</p>
      </div>
    )
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 0, minWidth: entries.length * 240 }}>
        {entries.map(([roundNum, roundMatches]) => {
          const roundName = roundMatches[0]?.ronda ?? `Ronda ${roundNum}`
          return (
            <div key={roundNum} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px 10px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, fontWeight: 600 }}>
                {roundName}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '0 8px', gap: 12 }}>
                {roundMatches.map((match: any) => (
                  <MatchCard key={match.id} match={match} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BracketTree({ roundEntries, isOrganizer, fc, equiposDisponibles }: { roundEntries: [string, any[]][]; isOrganizer: boolean; fc: string; equiposDisponibles?: { id: string; nombre: string }[] }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36, width: '100%' }}>
      {sections.map(section => (
        <BracketSection key={section.bracket} section={section} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} />
      ))}
    </div>
  )
}

/** Busca, de atrás para adelante, el sufijo más largo de rondas donde
 *  cada una tiene exactamente la mitad de partidos que la anterior —
 *  esa parte SÍ se puede armar como llave espejada (mitad izquierda y
 *  derecha convergiendo al centro, como cualquier bracket estándar).
 *  Devuelve el índice donde arranca ese sufijo. Torneos históricos con
 *  byes reales repartidos más allá de la Ronda 1 (ej. Copa Thorkul, con
 *  Ronda 1 de 6 partidos y Ronda 2 de 16) suelen tener la Ronda 1 (o las
 *  primeras) rota pero todo de ahí en más parejo — separar esa parte
 *  rota como una lista simple y espejar el resto mejora la mayoría de
 *  los torneos importados sin inventar partidos que nunca se jugaron.
 *  Si ni siquiera las últimas 2 rondas encajan (algo genuinamente roto,
 *  ej. una cantidad de partidos que sube y baja en vez de solo bajar) no
 *  hay sufijo válido y se sigue usando la vista lineal completa. */
function inicioSufijoParejo(rounds: { matches: any[] }[]): number {
  let inicio = rounds.length - 1
  for (let i = rounds.length - 2; i >= 0; i--) {
    if (rounds[i].matches.length === rounds[i + 1].matches.length * 2) inicio = i
    else break
  }
  return inicio
}

/** Cuando la "Final" que se identificó en realidad tiene K partidos en
 *  vez de 1, puede ser que esto no sea UNA llave con final rota, sino K
 *  llaves independientes en paralelo mostradas juntas (ej. Torneo
 *  Arqueros 1v1 son en verdad dos cuadros de 16 separados, uno por
 *  clase, cada uno con su propia Final real — la "Final de Clase" de acá
 *  no es más que los dos partidos finales de cada llave, uno al lado del
 *  otro). Se parte cada ronda en K bloques contiguos por posición: si
 *  round R tiene el doble de partidos que R+1, cada bloque de R también
 *  debe tener el doble que su bloque correspondiente de R+1, y CADA
 *  sub-secuencia debe terminar en 1 solo partido (su propia Final real).
 *  Si en algún nivel no cierra así, no es este caso y se devuelve null. */
function partirEnSubLlaves(
  rounds: { key: string; roundNum: number; matches: any[] }[],
  k: number,
): { key: string; roundNum: number; matches: any[] }[][] | null {
  if (k < 2) return null
  const subs: { key: string; roundNum: number; matches: any[] }[][] = Array.from({ length: k }, () => [])
  for (const r of rounds) {
    if (r.matches.length % k !== 0) return null
    const tamañoBloque = r.matches.length / k
    for (let i = 0; i < k; i++) {
      subs[i].push({ ...r, key: `${r.key}-sub${i}`, matches: r.matches.slice(i * tamañoBloque, (i + 1) * tamañoBloque) })
    }
  }
  for (const sub of subs) {
    const ultimo = sub[sub.length - 1]
    if (!ultimo || ultimo.matches.length !== 1) return null
    for (let i = 0; i < sub.length - 1; i++) {
      if (sub[i].matches.length !== sub[i + 1].matches.length * 2) return null
    }
  }
  return subs
}

function BracketSection({ section, isOrganizer, fc, equiposDisponibles }: { section: { bracket: string; rounds: { key: string; roundNum: number; matches: any[] }[] }; isOrganizer: boolean; fc: string; equiposDisponibles?: { id: string; nombre: string }[] }) {
  const rounds = section.rounds.map(r => ({ ...r, matches: [...r.matches].sort((a, b) => a.posicion - b.posicion) }))

  if (section.bracket === 'main') {
    const inicio = inicioSufijoParejo(rounds)
    const prefijo = rounds.slice(0, inicio)
    const sufijo = rounds.slice(inicio)
    const ultimaRonda = sufijo[sufijo.length - 1]

    if (sufijo.length >= 2 && ultimaRonda) {
      const numeroInicialBase = prefijo.reduce((acc, r) => acc + r.matches.length, 0)
      const prefijoJsx = prefijo.length > 0 && (
        <LigaFechas entries={prefijo.map(r => [r.key, r.matches] as [string, any[]])} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} />
      )

      if (ultimaRonda.matches.length === 1) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {prefijoJsx}
            <MirroredBracketSection rounds={sufijo} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} numeroInicial={numeroInicialBase} />
          </div>
        )
      }

      const subLlaves = partirEnSubLlaves(sufijo, ultimaRonda.matches.length)
      if (subLlaves) {
        let numeroCorrido = numeroInicialBase
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {prefijoJsx}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 44, justifyContent: 'center' }}>
              {subLlaves.map((sub, idx) => {
                const numeroInicial = numeroCorrido
                numeroCorrido += sub.reduce((acc, r) => acc + r.matches.length, 0)
                return (
                  <MirroredBracketSection key={idx} rounds={sub} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} numeroInicial={numeroInicial} />
                )
              })}
            </div>
          </div>
        )
      }
    }
  }
  return <LinearBracketSection section={section} rounds={rounds} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} />
}

/** Vista espejada — dos mitades convergiendo a una Final central, como
 *  cualquier cuadro de torneo estándar (ver referencia de un bracket de
 *  Mundial). La Ronda 1 se parte en dos por `posicion` (mitad de menor
 *  número = izquierda, mitad de mayor número = derecha); como cada ronda
 *  siguiente tiene exactamente la mitad de partidos y `posicion` en la
 *  ronda N+1 es `ceil(posicion/2)` de la ronda N, la misma regla
 *  "posicion <= mitad de esta ronda" sigue separando correctamente
 *  izquierda/derecha en todas las rondas sin tener que rastrear linaje. */
function MirroredBracketSection({ rounds, isOrganizer, fc, equiposDisponibles, numeroInicial = 0 }: { rounds: { key: string; roundNum: number; matches: any[] }[]; isOrganizer: boolean; fc: string; equiposDisponibles?: { id: string; nombre: string }[]; numeroInicial?: number }) {
  const numEarlier = rounds.length - 1 // rondas antes de la Final
  const finalRound = rounds[rounds.length - 1]
  const finalMatch = finalRound.matches[0]

  // Se separa por ÍNDICE dentro del arreglo ya ordenado por posicion, no
  // por el VALOR de `posicion` — un torneo puede numerar posicion de
  // forma corrida por todo el torneo (1..30) en vez de reiniciar en 1
  // por ronda, y filtrar por "posicion <= mitad" daba una mitad vacía
  // entera apenas los valores reales no empezaban en 1 (ej. una ronda
  // con posicion 17-24: ninguna es <= 4, todas caían del lado derecho).
  const earlier = rounds.slice(0, numEarlier)
  const leftRounds = earlier.map(r => {
    const mitad = Math.ceil(r.matches.length / 2)
    return { ...r, matches: r.matches.slice(0, mitad) }
  })
  const rightRounds = earlier.map(r => {
    const mitad = Math.ceil(r.matches.length / 2)
    return { ...r, matches: r.matches.slice(mitad) }
  })

  const halfCount = leftRounds[0].matches.length
  const height = HEADER_H + halfCount * ROW
  const totalCols = numEarlier * 2 + 1
  const width = totalCols * COL_W
  const finalColX = numEarlier * COL_W
  const rightColX = (i: number) => finalColX + COL_W * (numEarlier - i)

  // Fila balanceada: el partido i de una ronda se centra verticalmente
  // entre sus dos "hijos" estructurales (posiciones 2i/2i+1 de la ronda
  // anterior, DENTRO DE LA MISMA MITAD) — es pura geometría de árbol
  // binario, no depende de que esos partidos ya se hayan jugado, así que
  // un cuadro recién generado (todo TBD) ya se ve balanceado en vez de
  // amontonado arriba del todo.
  function filasBalanceadas(sideRounds: { matches: any[] }[]): number[][] {
    const y: number[][] = [sideRounds[0].matches.map((_, i) => i)]
    for (let idx = 1; idx < sideRounds.length; idx++) {
      y.push(sideRounds[idx].matches.map((_, i) => (y[idx - 1][2 * i] + y[idx - 1][2 * i + 1]) / 2))
    }
    return y
  }
  const leftY = filasBalanceadas(leftRounds)
  const rightY = filasBalanceadas(rightRounds)

  // Numeración corrida — primero toda la mitad izquierda de corrido
  // (Ronda 1 a Semifinal), después la derecha, después la Final. El
  // orden exacto importa poco (no es un dato competitivo, solo evita que
  // se repita "1" en cada ronda) — se prioriza que sea determinístico.
  let numeroGlobal = numeroInicial
  const numeroPorMatch = new Map<string, number>()
  leftRounds.forEach(r => r.matches.forEach(m => numeroPorMatch.set(m.id, ++numeroGlobal)))
  rightRounds.forEach(r => r.matches.forEach(m => numeroPorMatch.set(m.id, ++numeroGlobal)))
  numeroPorMatch.set(finalMatch.id, ++numeroGlobal)

  // Placeholder de un lado sin equipo todavía: "Ganador PVP N" en vez de
  // un "TBD" genérico, referenciando el número del partido real del que
  // depende — igual que se ve en cualquier bracket publicado (ahí suelen
  // usar códigos tipo "W74"). Es estructural (2i/2i+1 de la ronda
  // anterior), no depende de si ese partido ya se jugó.
  const placeholders = new Map<string, { a?: string; b?: string }>()
  function marcarPlaceholders(m: any, fuenteA: any, fuenteB: any) {
    const p: { a?: string; b?: string } = {}
    if (!m.equipo_a_id) p.a = `Ganador PVP ${numeroPorMatch.get(fuenteA.id)}`
    if (!m.equipo_b_id) p.b = `Ganador PVP ${numeroPorMatch.get(fuenteB.id)}`
    placeholders.set(m.id, p)
  }

  const connectors: { x1: number; y1: number; xm: number; x2: number; y2: number }[] = []

  // Mitad izquierda: mismo trazado que la vista lineal (avanza a la
  // derecha) — la línea siempre se dibuja (estructural), haya o no
  // resultado todavía.
  leftRounds.forEach((r, idx) => {
    if (idx === 0) return
    const x1 = idx * COL_W - CARD_PAD, xm = idx * COL_W - COL_W / 2, x2 = idx * COL_W + CARD_PAD
    const prevMatches = leftRounds[idx - 1].matches
    r.matches.forEach((m, i) => {
      const fuenteA = prevMatches[2 * i], fuenteB = prevMatches[2 * i + 1]
      marcarPlaceholders(m, fuenteA, fuenteB)
      const y2 = HEADER_H + leftY[idx][i] * ROW + CARD_CENTER
      connectors.push({ x1, y1: HEADER_H + leftY[idx - 1][2 * i] * ROW + CARD_CENTER, xm, x2, y2 })
      connectors.push({ x1, y1: HEADER_H + leftY[idx - 1][2 * i + 1] * ROW + CARD_CENTER, xm, x2, y2 })
    })
  })

  // Mitad derecha: espejo — avanza a la izquierda, así que los offsets
  // respecto al límite entre columnas se invierten (donde la izquierda
  // suma CARD_PAD/COL_W/2, acá se resta, y viceversa).
  rightRounds.forEach((r, idx) => {
    if (idx === 0) return
    const boundary = rightColX(idx - 1)
    const x1 = boundary + CARD_PAD, xm = boundary + COL_W / 2, x2 = boundary - CARD_PAD
    const prevMatches = rightRounds[idx - 1].matches
    r.matches.forEach((m, i) => {
      const fuenteA = prevMatches[2 * i], fuenteB = prevMatches[2 * i + 1]
      marcarPlaceholders(m, fuenteA, fuenteB)
      const y2 = HEADER_H + rightY[idx][i] * ROW + CARD_CENTER
      connectors.push({ x1, y1: HEADER_H + rightY[idx - 1][2 * i] * ROW + CARD_CENTER, xm, x2, y2 })
      connectors.push({ x1, y1: HEADER_H + rightY[idx - 1][2 * i + 1] * ROW + CARD_CENTER, xm, x2, y2 })
    })
  })

  // Final: converge desde la última ronda de cada mitad (Semifinal
  // izquierda y derecha) — un lado usa la fórmula "hacia la derecha", el
  // otro "hacia la izquierda", igual que arriba. Por construcción, la
  // fila balanceada de la última ronda de cada mitad cae exactamente en
  // el centro vertical de la sección (height/2), que es donde se ubica
  // la tarjeta de la Final.
  {
    const y2 = height / 2
    const lastLeft = leftRounds[numEarlier - 1].matches
    const lastRight = rightRounds[numEarlier - 1].matches
    // La Final solo tiene 1 partido de cada lado como fuente (no 2) —
    // se arma un objeto "de mentira" con esos dos partidos como si
    // fueran las posiciones 0/1 de una ronda anterior común.
    marcarPlaceholders(finalMatch, lastLeft[0], lastRight[0])
    const x1L = numEarlier * COL_W - CARD_PAD, xmL = numEarlier * COL_W - COL_W / 2, x2L = numEarlier * COL_W + CARD_PAD
    connectors.push({ x1: x1L, y1: HEADER_H + leftY[numEarlier - 1][0] * ROW + CARD_CENTER, xm: xmL, x2: x2L, y2 })
    const boundaryR = rightColX(numEarlier - 1)
    const x1R = boundaryR + CARD_PAD, xmR = boundaryR + COL_W / 2, x2R = boundaryR - CARD_PAD
    connectors.push({ x1: x1R, y1: HEADER_H + rightY[numEarlier - 1][0] * ROW + CARD_CENTER, xm: xmR, x2: x2R, y2 })
  }

  const cardStyle = (x: number, y: number) => ({ position: 'absolute' as const, left: x + CARD_PAD, top: y, width: COL_W - CARD_PAD * 2 })
  const headerStyle = (x: number) => ({
    position: 'absolute' as const, left: x, top: 0, width: COL_W, textAlign: 'center' as const,
    fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-secondary)', letterSpacing: 1, fontWeight: 600,
  })

  return (
    <div>
      <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'safe center' }}>
        <div style={{ position: 'relative', width, height, minWidth: width, flexShrink: 0 }}>
          <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            {connectors.map((c, i) => (
              <path key={i} d={`M ${c.x1} ${c.y1} H ${c.xm} V ${c.y2} H ${c.x2}`} fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth={1.5} />
            ))}
          </svg>
          {leftRounds.map((r, colIdx) => (
            <div key={`l-${r.key}`}>
              <div style={headerStyle(colIdx * COL_W)}>{r.matches[0]?.ronda ?? `Ronda ${r.roundNum}`}</div>
              {r.matches.map((match, i) => (
                <div key={match.id} style={cardStyle(colIdx * COL_W, HEADER_H + leftY[colIdx][i] * ROW)}>
                  <MatchCard match={match} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} numero={numeroPorMatch.get(match.id)} placeholderA={placeholders.get(match.id)?.a} placeholderB={placeholders.get(match.id)?.b} />
                </div>
              ))}
            </div>
          ))}
          {rightRounds.map((r, colIdx) => (
            <div key={`r-${r.key}`}>
              <div style={headerStyle(rightColX(colIdx))}>{r.matches[0]?.ronda ?? `Ronda ${r.roundNum}`}</div>
              {r.matches.map((match, i) => (
                <div key={match.id} style={cardStyle(rightColX(colIdx), HEADER_H + rightY[colIdx][i] * ROW)}>
                  <MatchCard match={match} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} numero={numeroPorMatch.get(match.id)} placeholderA={placeholders.get(match.id)?.a} placeholderB={placeholders.get(match.id)?.b} />
                </div>
              ))}
            </div>
          ))}
          <div key="final">
            <div style={headerStyle(finalColX)}>🏆 {finalMatch.ronda}</div>
            <div style={cardStyle(finalColX, height / 2 - CARD_CENTER)}>
              <MatchCard match={finalMatch} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} numero={numeroPorMatch.get(finalMatch.id)} placeholderA={placeholders.get(finalMatch.id)?.a} placeholderB={placeholders.get(finalMatch.id)?.b} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LinearBracketSection({ section, rounds, isOrganizer, fc, equiposDisponibles }: { section: { bracket: string; rounds: { key: string; roundNum: number; matches: any[] }[] }; rounds: { key: string; roundNum: number; matches: any[] }[]; isOrganizer: boolean; fc: string; equiposDisponibles?: { id: string; nombre: string }[] }) {
  // Posición vertical (en "filas") de cada partido = su índice dentro de
  // su propia ronda, ya ordenada por `posicion`. En un cuadro parejo esto
  // ya coincide con el linaje real (partido i de una ronda desciende de
  // los partidos 2i-1/2i de la anterior), así que se ve como un árbol
  // normal. En torneos históricos con byes muy irregulares (ej. Ronda 1
  // con 6 partidos reales y Ronda 2 con 16 porque el resto entró directo
  // por bye) promediar la fila del linaje real terminaba desordenando
  // visualmente los números de partido de arriba a abajo — alinear por
  // índice simple prioriza que el orden 1,2,3... siempre se lea de
  // corrido, a costa de que las líneas conectoras queden en diagonal en
  // vez de rectas en esos casos irregulares.
  const yByRound: number[][] = []
  const sourcesByRound: { a: number | null; b: number | null }[][] = []
  rounds.forEach((r, idx) => {
    yByRound.push(r.matches.map((_, i) => i))
    if (idx === 0) {
      sourcesByRound.push(r.matches.map(() => ({ a: null, b: null })))
      return
    }
    const prevMatches = rounds[idx - 1].matches
    const prevY = yByRound[idx - 1]
    sourcesByRound.push(r.matches.map(m => {
      const srcAIdx = m.equipo_a_id ? prevMatches.findIndex(pm => pm.ganador_id === m.equipo_a_id) : -1
      const srcBIdx = m.equipo_b_id ? prevMatches.findIndex(pm => pm.ganador_id === m.equipo_b_id) : -1
      return {
        a: srcAIdx !== -1 ? prevY[srcAIdx] : null,
        b: srcBIdx !== -1 ? prevY[srcBIdx] : null,
      }
    }))
  })

  const maxY = Math.max(0, ...yByRound.flat())
  const height = HEADER_H + (maxY + 1) * ROW
  const width = rounds.length * COL_W

  // Numeración corrida de todo el cuadro (1, 2, 3... sin reiniciar en
  // cada ronda) — el número por sí solo no dice nada de a quién enfrenta
  // cada equipo (eso ya lo muestra el nombre + la línea conectora), así
  // que reiniciar en 1 en cada ronda solo generaba la falsa sensación de
  // que el partido "1" de Octavos tenía algo que ver con el "1" de
  // Dieciseisavos.
  let numeroGlobal = 0
  const numeroPorMatch = new Map<string, number>()
  rounds.forEach(r => r.matches.forEach(m => numeroPorMatch.set(m.id, ++numeroGlobal)))

  const connectors: { x1: number; y1: number; xm: number; x2: number; y2: number }[] = []
  rounds.forEach((r, idx) => {
    if (idx === 0) return
    const x2 = idx * COL_W + CARD_PAD
    const xm = idx * COL_W - COL_W / 2
    r.matches.forEach((_, i) => {
      const y2 = HEADER_H + yByRound[idx][i] * ROW + CARD_CENTER
      const { a, b } = sourcesByRound[idx][i]
      const x1 = idx * COL_W - CARD_PAD
      if (a !== null) connectors.push({ x1, y1: HEADER_H + a * ROW + CARD_CENTER, xm, x2, y2 })
      if (b !== null) connectors.push({ x1, y1: HEADER_H + b * ROW + CARD_CENTER, xm, x2, y2 })
      // sin origen trazable en la ronda anterior (bye directo, round
      // robin, gran final que junta dos llaves) no se dibuja línea.
    })
  })

  return (
    <div>
      {SECTION_LABEL[section.bracket] && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--gold)', letterSpacing: 1.5, marginBottom: 14, textTransform: 'uppercase', fontWeight: 700 }}>
          {SECTION_LABEL[section.bracket]}
        </div>
      )}
      {/* "safe center" en vez de "center": centra la llave cuando entra
          entera en pantalla, pero si es más ancha que el contenedor (ej.
          la llave de perdedores, con más rondas) cae a alineación normal
          en vez de dejar el borde izquierdo fuera del área de scroll
          alcanzable — "center" a secas puede volver la ronda 1
          inalcanzable cuando el contenido desborda. */}
      <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'safe center' }}>
        <div style={{ position: 'relative', width, height, minWidth: width, flexShrink: 0 }}>
          <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            {connectors.map((c, i) => (
              <path key={i} d={`M ${c.x1} ${c.y1} H ${c.xm} V ${c.y2} H ${c.x2}`} fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth={1.5} />
            ))}
          </svg>
          {rounds.map((r, colIdx) => (
            <div key={r.key}>
              <div style={{ position: 'absolute', left: colIdx * COL_W, top: 0, width: COL_W, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-secondary)', letterSpacing: 1, fontWeight: 600 }}>
                {r.matches[0]?.ronda ?? `Ronda ${r.roundNum}`}
              </div>
              {r.matches.map((match, i) => (
                <div key={match.id} style={{ position: 'absolute', left: colIdx * COL_W + CARD_PAD, top: HEADER_H + yByRound[colIdx][i] * ROW, width: COL_W - CARD_PAD * 2 }}>
                  <MatchCard match={match} isOrganizer={isOrganizer} fc={fc} equiposDisponibles={equiposDisponibles} numero={numeroPorMatch.get(match.id)} />
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
function MatchCard({ match, isOrganizer, fc, equiposDisponibles, numero, placeholderA, placeholderB }: { match: any; isOrganizer: boolean; fc: string; equiposDisponibles?: { id: string; nombre: string }[]; numero?: number; placeholderA?: string; placeholderB?: string }) {
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
    const resultadoLower = match.resultado.toLowerCase()
    const idxA = teamA ? resultadoLower.indexOf(teamA.nombre.toLowerCase()) : -1
    const idxB = teamB ? resultadoLower.indexOf(teamB.nombre.toLowerCase()) : -1
    // Si el texto no tiene ningun nombre de equipo (marcador plano tipo
    // "3-1"), no hay forma de comparar posiciones -- se asume el orden
    // de guardado equipo_a - equipo_b en vez de caer por defecto en "B
    // primero", que invertía el marcador de estos partidos.
    const aApareceAntes = idxA === -1 && idxB === -1 ? true : idxA !== -1 && (idxB === -1 || idxA <= idxB)
    scoreA = Number(aApareceAntes ? scoreMatch[1] : scoreMatch[2])
    scoreB = Number(aApareceAntes ? scoreMatch[2] : scoreMatch[1])
  }
  const isWalkover = isPlayed && !scoreMatch && !!match.resultado

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isPlayed ? fc + '44' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)',
      transition: 'border-color 0.2s',
    }}>
      {/* Top accent — sin overflow:hidden en el padre (recortaría el
          popover de BracketActions), así que redondea sus propias
          esquinas de arriba para no sobresalir del borde de la tarjeta. */}
      <div style={{ height: 2, borderRadius: 'var(--radius-md) var(--radius-md) 0 0', background: isPlayed ? `linear-gradient(90deg, ${fc}, ${fc}44)` : 'rgba(255,255,255,0.06)' }} />

      {/* Team A */}
      <TeamRow
        seed={numero ?? match.posicion}
        team={teamA}
        score={scoreA}
        isWinner={!!ganadorId && ganadorId === teamA?.id}
        isLoser={!!ganadorId && ganadorId !== teamA?.id}
        placeholder={placeholderA}
        borderBottom
      />
      {/* Team B */}
      <TeamRow
        team={teamB}
        score={scoreB}
        isWinner={!!ganadorId && ganadorId === teamB?.id}
        isLoser={!!ganadorId && ganadorId !== teamB?.id}
        placeholder={placeholderB}
        roundBottom={!(isOrganizer || isPlayed)}
      />

      {/* Footer */}
      {(isOrganizer || isPlayed) && (
        <div style={{ padding: '5px 12px', borderRadius: '0 0 var(--radius-md) var(--radius-md)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: isPlayed ? '#4CAF50' : 'var(--text-muted)', letterSpacing: 1 }}>
            {isPlayed ? (isWalkover ? 'JUGADO · W.O.' : 'JUGADO') : 'PENDIENTE'}
          </span>
          {isOrganizer && teamA && teamB && (
            <BracketActions matchId={match.id} teamA={teamA} teamB={teamB} isPlayed={isPlayed} resultadoActual={match.resultado} equiposDisponibles={equiposDisponibles} />
          )}
        </div>
      )}
    </div>
  )
}

function TeamRow({ seed, team, score, isWinner, isLoser, borderBottom, roundBottom, placeholder }: { seed?: number; team: any; score: number | null; isWinner: boolean; isLoser: boolean; borderBottom?: boolean; roundBottom?: boolean; placeholder?: string }) {
  const nameColor = isWinner ? 'var(--text-primary)' : isLoser ? 'var(--text-muted)' : 'var(--text-secondary)'
  const scoreBg = isWinner ? 'rgba(212,175,55,0.2)' : isLoser ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)'
  const scoreColor = isWinner ? 'var(--gold)' : 'var(--text-muted)'

  return (
    <div style={{
      padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
      background: isWinner ? 'rgba(212,175,55,0.04)' : 'transparent',
      borderBottom: borderBottom ? '1px solid rgba(255,255,255,0.06)' : 'none',
      borderRadius: roundBottom ? '0 0 var(--radius-md) var(--radius-md)' : undefined,
    }}>
      {/* Seed */}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', width: 16, textAlign: 'center', flexShrink: 0 }}>
        {seed ?? ''}
      </span>
      {/* Team name — title nativo del navegador como tooltip: si el
          nombre no entra y queda truncado con "...", pasando el mouse se
          ve completo sin tener que agrandar la tarjeta. Clickeable: en
          1v1 lleva directo al perfil, en equipos de varios abre la
          lista de integrantes (TeamNameLink). */}
      {team ? (
        <TeamNameLink
          nombre={team.nombre}
          miembros={(team.miembros ?? []).filter((m: any) => m.personaje).map((m: any) => m.personaje)}
          title={team.nombre}
          style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: isWinner ? 700 : 400, color: nameColor, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        />
      ) : (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: nameColor, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 11 }}>{placeholder ?? 'TBD'}</span>
        </span>
      )}
      {/* Score */}
      {score !== null && score !== undefined && !isNaN(score) && (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: scoreColor, background: scoreBg, width: 26, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, flexShrink: 0 }}>
          {score}
        </span>
      )}
    </div>
  )
}
