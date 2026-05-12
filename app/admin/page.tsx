import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ROLE_LABEL, ROLE_COLOR, ROLE_BG, canAdmin, isSuperAdmin } from '@/lib/roles'
import type { UserRole } from '@/lib/types'
import RoleManager from './RoleManager'
import VerificarPersonaje from './VerificarPersonaje'

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
    .select('id, nickname_juego, reino, clase_principal, role, discord_username, discord_avatar, mmr_global, created_at')
    .order('created_at', { ascending: false })

  const { data: reports } = await supabase
    .from('nickname_reports')
    .select('*, personaje:personajes(id, nickname_juego, verificado, player:players(id, discord_username)), reporter:players(discord_username)')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  const { data: allTournaments } = await supabase
    .from('tournaments')
    .select('id, nombre, estado, formato, created_at, creator:players(nickname_juego), registros:tournament_registrations(count)')
    .order('created_at', { ascending: false })
    .limit(20)

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
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>

              {/* Header tabla */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['JUGADOR', 'ROL ACTUAL', 'CAMBIAR ROL'].map(col => (
                  <div key={col} style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.5 }}>{col}</div>
                ))}
              </div>

              {players?.map((p: any, i: number) => (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 140px',
                  padding: '12px 20px',
                  borderBottom: i < (players.length - 1) ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                }}>
                  {/* Jugador */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {p.discord_avatar
                        ? <img src={p.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)' }}>{p.nickname_juego?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: p.id === me.id ? 'var(--gold)' : 'var(--text-primary)' }}>
                          {p.nickname_juego}
                        </span>
                        {p.id === me.id && (
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>(tú)</span>
                        )}
                        {isSuperAdmin(p.nickname_juego) && (
                          <span style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>🔒</span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {p.reino} · {p.clase_principal}
                      </div>
                    </div>
                  </div>

                  {/* Rol actual */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: ROLE_BG[p.role as UserRole] ?? 'rgba(255,255,255,0.05)',
                    color: ROLE_COLOR[p.role as UserRole] ?? 'var(--text-muted)',
                    border: `1px solid ${ROLE_COLOR[p.role as UserRole] ?? 'transparent'}44`,
                    padding: '3px 9px', borderRadius: 4,
                    fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5,
                    width: 'fit-content',
                  }}>
                    {ROLE_LABEL[p.role as UserRole] ?? p.role}
                  </span>

                  {/* Selector de rol (client component) */}
                  <RoleManager
                    playerId={p.id}
                    currentRole={p.role}
                    isSelf={p.id === me.id}
                    isProtected={isSuperAdmin(p.nickname_juego)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Últimos torneos ─────────────────────────────────── */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 14 }}>
              ÚLTIMOS TORNEOS
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
              {allTournaments?.map((t: any, i: number) => {
                const statusColor: Record<string, string> = {
                  draft: '#606060', inscripciones: '#2196F3', live: '#F44336', finalizado: '#4CAF50',
                }
                const statusLabel: Record<string, string> = {
                  draft: 'Borrador', inscripciones: 'Inscripciones', live: 'EN VIVO', finalizado: 'Finalizado',
                }
                const sc = statusColor[t.estado] ?? '#606060'
                return (
                  <div key={t.id} style={{
                    padding: '12px 16px',
                    borderBottom: i < (allTournaments.length - 1) ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.nombre}
                        </div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          por {t.creator?.nickname_juego ?? '—'} · {t.registros?.[0]?.count ?? 0} equipos
                        </div>
                      </div>
                      <span style={{
                        background: `${sc}18`, color: sc, border: `1px solid ${sc}44`,
                        padding: '2px 7px', borderRadius: 4,
                        fontFamily: 'var(--font-display)', fontSize: 8, letterSpacing: 1,
                        flexShrink: 0,
                      }}>
                        {statusLabel[t.estado] ?? t.estado}
                      </span>
                    </div>
                  </div>
                )
              })}
              {!allTournaments?.length && (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12 }}>
                  No hay torneos creados aún.
                </div>
              )}
            </div>
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

      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 40 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
