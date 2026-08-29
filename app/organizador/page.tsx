import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'
import { canOrganize, canAdmin } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Panel Organizador' }

export default async function OrganizadorPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: player } = await supabase
    .from('players')
    .select('id, nickname_juego, role')
    .eq('user_id', user.id)
    .single()

  // Torneos donde es co-organizador (colaborador puntual, sin necesitar
  // el rol global) — se suman a los propios en la lista de abajo.
  // Service role: `tournament_organizers` no tiene policy de RLS para
  // el cliente autenticado normal.
  const { data: coOrgRows } = await createServiceSupabase().from('tournament_organizers').select('tournament_id').eq('player_id', player?.id ?? '')
  const coOrgIds = (coOrgRows ?? []).map((r: any) => r.tournament_id)

  if (!player || (!canOrganize(player.role) && coOrgIds.length === 0)) {
    redirect('/')
  }

  // El admin ve TODOS los torneos; el resto solo los propios + los que co-organiza
  const tourneysQuery = supabase
    .from('tournaments')
    .select('*, registros:tournament_registrations(count), partidos:matches(count)')
    .order('created_at', { ascending: false })

  if (!canAdmin(player.role)) {
    tourneysQuery.or(
      coOrgIds.length > 0
        ? `creator_id.eq.${player.id},id.in.(${coOrgIds.join(',')})`
        : `creator_id.eq.${player.id}`
    )
  }

  const { data: torneos } = await tourneysQuery

  const stats = {
    total: torneos?.length ?? 0,
    live: torneos?.filter((t: any) => t.estado === 'live').length ?? 0,
    inscritos: torneos?.reduce((s: number, t: any) => s + (t.registros?.[0]?.count ?? 0), 0) ?? 0,
    partidos: torneos?.reduce((s: number, t: any) => s + (t.partidos?.[0]?.count ?? 0), 0) ?? 0,
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
              PANEL ORGANIZADOR
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
              Bienvenido, <span style={{ color: 'var(--gold)' }}>{player.nickname_juego}</span>
            </p>
          </div>
          <Link href="/organizador/nuevo" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            + CREAR TORNEO
          </Link>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'MIS TORNEOS',  value: stats.total,    color: 'var(--gold)' },
            { label: 'EN VIVO',      value: stats.live,     color: '#F44336' },
            { label: 'INSCRITOS',    value: stats.inscritos, color: '#4CAF50' },
            { label: 'PARTIDOS',     value: stats.partidos, color: '#2196F3' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tournament list */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 14 }}>MIS TORNEOS</div>

        {!torneos?.length ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Aún no creaste ningún torneo.</p>
            <Link href="/organizador/nuevo" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              CREAR MI PRIMER TORNEO
            </Link>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 80px 120px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              {['TORNEO', 'FORMATO', 'ESTADO', 'EQUIPOS', 'PARTIDOS', 'ACCIONES'].map(col => (
                <div key={col} style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{col}</div>
              ))}
            </div>
            {torneos.map((t: any, i: number) => {
              const fc = FORMAT_COLOR[t.formato as TournamentFormat]
              const st = STATUS_STYLE[t.estado as TournamentStatus]
              const inscritos = t.registros?.[0]?.count ?? 0
              const nPartidos = t.partidos?.[0]?.count ?? 0
              return (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 80px 120px', padding: '14px 20px', borderBottom: i < torneos.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{t.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(t.fecha_inicio).toLocaleDateString('es-AR')}</div>
                  </div>
                  <span style={{ background: `${fc}18`, color: fc, border: `1px solid ${fc}33`, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1, width: 'fit-content' }}>
                    {FORMAT_LABEL[t.formato as TournamentFormat]}
                  </span>
                  <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1, width: 'fit-content' }}>
                    {st.label}
                  </span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-primary)' }}>{inscritos}/{t.max_equipos}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-primary)' }}>{nPartidos}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link href={`/organizador/torneos/${t.id}`} style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textDecoration: 'none', letterSpacing: 0.5 }}>
                      EDITAR
                    </Link>
                    <Link href={`/brackets/${t.id}`} style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-display)', textDecoration: 'none', letterSpacing: 0.5 }}>
                      VER →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
