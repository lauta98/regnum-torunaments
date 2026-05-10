import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Eventos Especiales' }

export default async function EventosPage() {
  const supabase = await createServerSupabase()

  const { data: eventos } = await supabase
    .from('tournaments')
    .select('*, creator:players(nickname_juego), registros:tournament_registrations(count)')
    .eq('destacado', true)
    .order('fecha_inicio', { ascending: true })

  const { data: proximos } = await supabase
    .from('tournaments')
    .select('*, registros:tournament_registrations(count)')
    .in('estado', ['inscripciones', 'draft'])
    .order('fecha_inicio', { ascending: true })
    .limit(6)

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
            EVENTOS ESPECIALES
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Torneos destacados y eventos de la comunidad CoR.
          </p>
        </div>

        {/* Featured events */}
        {eventos && eventos.length > 0 ? (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', letterSpacing: 2, marginBottom: 16 }}>⭐ TORNEOS DESTACADOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, marginBottom: 40 }}>
              {eventos.map((ev: any) => {
                const fc = FORMAT_COLOR[ev.formato as TournamentFormat]
                const st = STATUS_STYLE[ev.estado as TournamentStatus]
                const inscritos = ev.registros?.[0]?.count ?? 0
                return (
                  <Link key={ev.id} href={`/brackets/${ev.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'linear-gradient(160deg, var(--bg-card), #1a1200)',
                      border: '1px solid rgba(212,175,55,0.5)',
                      borderRadius: 14, overflow: 'hidden',
                    }}>
                      <div style={{ height: 4, background: `linear-gradient(90deg, var(--gold), ${fc})` }} />
                      <div style={{ padding: '22px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ background: `${fc}22`, color: fc, border: `1px solid ${fc}33`, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1 }}>
                            {FORMAT_LABEL[ev.formato as TournamentFormat]}
                          </span>
                          <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1 }}>
                            {st.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>⭐</div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>{ev.nombre}</h2>
                        {ev.descripcion && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>{ev.descripcion}</p>}
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                          <span>📅 {new Date(ev.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}</span>
                          <span>👥 {inscritos}/{ev.max_equipos}</span>
                          {ev.premio && <span>🏆 {ev.premio}</span>}
                        </div>
                        {ev.creator && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            Organizado por <span style={{ color: 'var(--text-secondary)' }}>{ev.creator.nickname_juego}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', marginBottom: 32, border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>No hay eventos destacados por el momento.</p>
          </div>
        )}

        {/* Próximos torneos */}
        {proximos && proximos.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>📋 PRÓXIMAS INSCRIPCIONES</div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
              {proximos.map((t: any, i: number) => {
                const fc = FORMAT_COLOR[t.formato as TournamentFormat]
                const st = STATUS_STYLE[t.estado as TournamentStatus]
                const inscritos = t.registros?.[0]?.count ?? 0
                return (
                  <Link key={t.id} href={`/brackets/${t.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                      borderBottom: i < proximos.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${fc}18`, border: `1px solid ${fc}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: fc, fontWeight: 700 }}>{FORMAT_LABEL[t.formato as TournamentFormat]}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{t.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          📅 {new Date(t.fecha_inicio).toLocaleDateString('es-AR')} · 👥 {inscritos}/{t.max_equipos}
                        </div>
                      </div>
                      <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1 }}>
                        {st.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
