import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { canAdmin } from '@/lib/roles'
import UsuariosTable from './UsuariosTable'
import VerificarPersonaje from './VerificarPersonaje'
import ResolverReclamo from './ResolverReclamo'
import TorneosRecientes from './TorneosRecientes'

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
    .select('id, user_id, nickname_juego, reino, clase_principal, role, discord_username, discord_avatar, mmr_global, created_at')
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

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Título */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 2, color: 'var(--gold)', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 4, padding: '2px 8px' }}>
              ADMINISTRADOR
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2, marginBottom: 4 }}>
            PANEL ADMINISTRADOR
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Bienvenido, <span style={{ color: 'var(--gold)' }}>{me.nickname_juego}</span> — control total del sistema
          </p>
          <Link href="/admin/personajes" style={{
            display: 'inline-block', marginTop: 12, padding: '7px 16px', borderRadius: 8,
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold)',
            fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 0.5, textDecoration: 'none',
          }}>
            Gestionar personajes →
          </Link>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'USUARIOS TOTALES', value: counts.total,      color: 'var(--text-primary)' },
            { label: 'ADMINISTRADORES',  value: counts.admins,     color: 'var(--gold)' },
            { label: 'ORGANIZADORES',    value: counts.organizers, color: '#2196F3' },
            { label: 'JUGADORES',        value: counts.jugadores,  color: '#909090' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

          {/* ── Gestión de usuarios ─────────────────────────────── */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 14 }}>
              GESTIÓN DE USUARIOS
            </div>
            <UsuariosTable players={(players ?? []) as any} meId={me.id} />
          </div>

          {/* ── Últimos torneos ─────────────────────────────────── */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 14 }}>
              ÚLTIMOS TORNEOS
            </div>
            <TorneosRecientes torneos={(allTournaments ?? []) as any} />
          </div>
        </div>

        {/* ── Reportes de nickname ────────────────────────── */}
        {(reports?.length ?? 0) > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 }}>REPORTES DE NICKNAME</div>
              <span style={{ background: 'rgba(244,67,54,0.15)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)', borderRadius: 4, padding: '1px 7px', fontFamily: 'var(--font-display)', fontSize: 9 }}>
                {reports!.length} pendiente{reports!.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(244,67,54,0.2)', borderRadius: 12, overflow: 'hidden' }}>
              {reports!.map((r: any, i: number) => (
                <div key={r.id} style={{ padding: '14px 20px', borderBottom: i < reports!.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'grid', gridTemplateColumns: '1fr 160px 160px', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.personaje?.nickname_juego}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>reportado por {r.reporter?.discord_username ?? 'anónimo'}</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{r.motivo}</p>
                  </div>
                  <VerificarPersonaje
                    personajeId={r.personaje?.id}
                    verificado={r.personaje?.verificado ?? false}
                    reportId={r.id}
                  />
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>
                    Dueño: <span style={{ color: 'var(--text-secondary)' }}>{r.personaje?.player?.discord_username ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reclamos de personaje ───────────────────── */}
        {(reclamos?.length ?? 0) > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 }}>RECLAMOS DE PERSONAJE</div>
              <span style={{ background: 'rgba(255,165,0,0.15)', color: '#FFA500', border: '1px solid rgba(255,165,0,0.35)', borderRadius: 4, padding: '1px 7px', fontFamily: 'var(--font-display)', fontSize: 9 }}>
                {reclamos!.length} pendiente{reclamos!.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: 12, overflow: 'hidden' }}>
              {reclamos!.map((r: any, i: number) => (
                <div key={r.id} style={{ padding: '16px 20px', borderBottom: i < reclamos!.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 120px', alignItems: 'start', gap: 16 }}>

                  {/* Info del personaje reclamado */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(255,165,0,0.6)', letterSpacing: 1 }}>PERSONAJE RECLAMADO</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {r.personaje?.nickname_juego}
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>
                      Dueño actual: <span style={{ color: 'var(--text-secondary)' }}>{r.personaje?.player?.discord_username ?? '—'}</span>
                    </div>
                  </div>

                  {/* Info del reclamante y motivo */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(255,165,0,0.6)', letterSpacing: 1 }}>RECLAMANTE</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#FFA500', marginBottom: 6 }}>
                      {r.claimer?.discord_username ?? '—'}
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
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
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 40 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
