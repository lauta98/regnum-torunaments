import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Brackets' }

export default async function BracketsPage() {
  const supabase = await createServerSupabase()

  const { data: tourneys } = await supabase
    .from('tournaments')
    .select('*, registros:tournament_registrations(count)')
    .in('estado', ['live', 'finalizado', 'inscripciones'])
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false })

  const live    = tourneys?.filter((t: any) => t.estado === 'live') ?? []
  const open    = tourneys?.filter((t: any) => t.estado === 'inscripciones') ?? []
  const done    = tourneys?.filter((t: any) => t.estado === 'finalizado') ?? []

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', flex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
            ENFRENTAMIENTOS & BRACKETS
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Seguí los brackets en vivo y los resultados de cada torneo.
          </p>
        </div>

        {live.length > 0 && (
          <Section title="🔴 EN VIVO" tourneys={live} />
        )}
        {open.length > 0 && (
          <Section title="📋 PRÓXIMOS" tourneys={open} />
        )}
        {done.length > 0 && (
          <Section title="✅ FINALIZADOS" tourneys={done} />
        )}

        {!tourneys?.length && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>No hay brackets disponibles aún.</p>
          </div>
        )}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}

function Section({ title, tourneys }: { title: string; tourneys: any[] }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {tourneys.map((t: any) => {
          const fc = FORMAT_COLOR[t.formato as TournamentFormat]
          const st = STATUS_STYLE[t.estado as TournamentStatus]
          return (
            <Link key={t.id} href={`/brackets/${t.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)', border: `1px solid ${t.estado === 'live' ? fc + '66' : 'var(--border)'}`,
                borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s',
              }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${fc}, ${fc}55)` }} />
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ background: `${fc}22`, color: fc, border: `1px solid ${fc}33`, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1 }}>
                      {FORMAT_LABEL[t.formato as TournamentFormat]}
                    </span>
                    <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1 }}>
                      {t.estado === 'live' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F44336', marginRight: 4, animation: 'pulse 1.5s infinite' }} />}
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t.nombre}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      📅 {new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: fc, letterSpacing: 1 }}>VER BRACKET →</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
