import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { canAdmin } from '@/lib/roles'
import UsuariosTable from './UsuariosTable'
import VerificarPersonaje from './VerificarPersonaje'
import ResolverReclamo from './ResolverReclamo'
import ResolverAvatar from './ResolverAvatar'
import ResolverHighlight from './ResolverHighlight'
import TorneosRecientes from './TorneosRecientes'

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

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Panel Administrador' }

export default async function AdminPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('players')
    .select('id, nickname_juego, role')
    .eq('user_id', user.id)
    .single()

  if (!me || !canAdmin(me.role)) redirect('/')

  /* ── Datos globales ─────────────────────────────────────────── */
  const { data: players } = await supabase
    .from('players')
    .select('id, user_id, nickname_juego, reino, clase_principal, role, discord_username, discord_avatar, avatar_url, mmr_global, created_at')
    .order('created_at', { ascending: false })

  const { data: reports } = await supabase
    .from('nickname_reports')
    .select('*, personaje:personajes(id, nickname_juego, verificado, player:players!personajes_player_id_fkey(id, discord_username)), reporter:players(discord_username)')
    .eq('estado', 'pendiente')
    .eq('tipo', 'reporte')
    .order('created_at', { ascending: false })

  const { data: reclamos } = await supabase
    .from('nickname_reports')
    .select('*, personaje:personajes(id, nickname_juego, player:players!personajes_player_id_fkey(id, discord_username)), claimer:players!claimer_id(id, discord_username)')
    .eq('estado', 'pendiente')
    .eq('tipo', 'reclamo')
    .order('created_at', { ascending: false })

  const { data: avataresReportados } = await supabase
    .from('players')
    .select('id, nickname_juego, discord_username, avatar_url, avatar_reporte_motivo')
    .eq('avatar_reportado', true)
    .order('created_at', { ascending: false })

  const { data: highlightsReportados } = await supabase
    .from('highlights')
    .select('*, jugador:players!highlights_jugador_id_fkey(id, discord_username, nickname_juego)')
    .eq('reportado', true)
    .order('created_at', { ascending: false })

  const { data: allTournaments } = await supabase
    .from('tournaments')
    .select('id, nombre, estado, formato, created_at, creator:players!tournaments_creator_id_fkey(nickname_juego), registros:tournament_registrations(count)')
    .order('created_at', { ascending: false })
    .limit(100)

  const counts = {
    total:      players?.length ?? 0,
    admins:     players?.filter((p: any) => p.role === 'admin').length ?? 0,
    organizers: players?.filter((p: any) => p.role === 'organizer').length ?? 0,
    jugadores:  players?.filter((p: any) => p.role === 'player').length ?? 0,
  }
  const pendingTotal = (reports?.length ?? 0) + (reclamos?.length ?? 0) + (avataresReportados?.length ?? 0) + (highlightsReportados?.length ?? 0)

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Título */}
        <div style={{ marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, background: 'var(--gold)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase' }}>
              Administrador
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display-v2)', fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Panel Administrador
          </h1>
          <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, color: 'var(--text-secondary)', marginTop: 6 }}>
            Bienvenido, <span style={{ color: 'var(--gold)' }}>{me.nickname_juego}</span> — control total del sistema
          </p>
          <Link href="/admin/personajes" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '9px 16px',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase',
            background: 'var(--bg-surface)', border: '1px solid var(--dark-border-gold)', color: 'var(--gold)', textDecoration: 'none',
          }}>
            Gestionar personajes →
          </Link>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Usuarios Totales', value: counts.total,      color: 'var(--text-primary)' },
            { label: 'Administradores',  value: counts.admins,     color: 'var(--gold)' },
            { label: 'Organizadores',    value: counts.organizers, color: 'var(--purple)' },
            { label: 'Jugadores',        value: counts.jugadores,  color: 'var(--text-secondary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Aviso agregado de colas pendientes */}
        {pendingTotal > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '10px 16px',
            background: 'rgba(244,67,54,0.06)', border: '1px solid rgba(244,67,54,0.25)',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#f87171',
          }}>
            <span style={{ width: 6, height: 6, background: '#F44336', flexShrink: 0 }} />
            Colas de moderación activas — {pendingTotal} caso{pendingTotal !== 1 ? 's' : ''} pendiente{pendingTotal !== 1 ? 's' : ''} de resolución
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

          {/* ── Gestión de usuarios ─────────────────────────────── */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
              Gestión de Usuarios
            </div>
            <UsuariosTable players={(players ?? []) as any} meId={me.id} />
          </div>

          {/* ── Últimos torneos ─────────────────────────────────── */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
              Últimos Torneos
            </div>
            <TorneosRecientes torneos={(allTournaments ?? []) as any} />
          </div>
        </div>

        {/* ── Reportes de nickname ────────────────────────── */}
        {(reports?.length ?? 0) > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Reportes de Nickname</div>
              <span style={{ background: 'rgba(244,67,54,0.15)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)', padding: '1px 7px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {reports!.length} pendiente{reports!.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(244,67,54,0.2)', overflow: 'hidden' }}>
              {reports!.map((r: any, i: number) => (
                <div key={r.id} style={{ padding: '14px 20px', borderBottom: i < reports!.length - 1 ? '1px solid var(--border)' : 'none', display: 'grid', gridTemplateColumns: '1fr 160px 160px', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{r.personaje?.nickname_juego}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>reportado por {r.reporter?.discord_username ?? 'anónimo'}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{r.motivo}</p>
                  </div>
                  <VerificarPersonaje
                    personajeId={r.personaje?.id}
                    verificado={r.personaje?.verificado ?? false}
                    reportId={r.id}
                  />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    Dueño: <span style={{ color: 'var(--text-secondary)' }}>{r.personaje?.player?.discord_username ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Fotos de perfil reportadas ──────────────────── */}
        {(avataresReportados?.length ?? 0) > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Fotos de Perfil Reportadas</div>
              <span style={{ background: 'rgba(244,67,54,0.15)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)', padding: '1px 7px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {avataresReportados!.length} pendiente{avataresReportados!.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(244,67,54,0.2)', overflow: 'hidden' }}>
              {avataresReportados!.map((p: any, i: number) => (
                <div key={p.id} style={{ padding: '14px 20px', borderBottom: i < avataresReportados!.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', border: '2px solid rgba(244,67,54,0.4)', flexShrink: 0 }} />
                    : <div style={{ width: 56, height: 56, border: '2px solid rgba(244,67,54,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>sin foto</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{p.nickname_juego ?? p.discord_username ?? '—'}</div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: '3px 0' }}>{p.avatar_reporte_motivo}</p>
                    <Link href={`/jugadores/${p.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>Ver perfil →</Link>
                  </div>
                  <ResolverAvatar targetId={p.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Contenido de Multimedia reportado ──────────── */}
        {(highlightsReportados?.length ?? 0) > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Contenido de Multimedia Reportado</div>
              <span style={{ background: 'rgba(244,67,54,0.15)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)', padding: '1px 7px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {highlightsReportados!.length} pendiente{highlightsReportados!.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(244,67,54,0.2)', overflow: 'hidden' }}>
              {highlightsReportados!.map((h: any, i: number) => (
                <div key={h.id} style={{ padding: '14px 20px', borderBottom: i < highlightsReportados!.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {h.thumbnail_url
                    ? <img src={h.thumbnail_url} alt="" style={{ width: 80, height: 45, objectFit: 'cover', border: '2px solid rgba(244,67,54,0.4)', flexShrink: 0 }} />
                    : <div style={{ width: 80, height: 45, border: '2px solid rgba(244,67,54,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>sin miniatura</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{h.titulo}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', margin: '3px 0' }}>
                      Compartido por {h.jugador?.discord_username ?? h.jugador?.nickname_juego ?? '—'} · {hace(h.created_at)}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: '3px 0' }}>{h.reporte_motivo}</p>
                    <a href={h.video_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>Ver contenido →</a>
                  </div>
                  <ResolverHighlight highlightId={h.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reclamos de personaje ───────────────────── */}
        {(reclamos?.length ?? 0) > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Reclamos de Personaje</div>
              <span style={{ background: 'rgba(255,165,0,0.15)', color: '#FFA500', border: '1px solid rgba(255,165,0,0.35)', padding: '1px 7px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {reclamos!.length} pendiente{reclamos!.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,165,0,0.2)', overflow: 'hidden' }}>
              {reclamos!.map((r: any, i: number) => (
                <div key={r.id} style={{ padding: '16px 20px', borderBottom: i < reclamos!.length - 1 ? '1px solid var(--border)' : 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 120px', alignItems: 'start', gap: 16 }}>

                  {/* Info del personaje reclamado */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,165,0,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Personaje Reclamado</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {r.personaje?.nickname_juego}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      Dueño actual: <span style={{ color: 'var(--text-secondary)' }}>{r.personaje?.player?.discord_username ?? '—'}</span>
                    </div>
                  </div>

                  {/* Info del reclamante y motivo */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,165,0,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reclamante</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#FFA500', marginBottom: 6 }}>
                      {r.claimer?.discord_username ?? '—'}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {r.motivo}
                    </p>
                  </div>

                  {/* Acciones */}
                  <ResolverReclamo reclamoId={r.id} />
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 40 }}>
        CoR Tournament Stats © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
