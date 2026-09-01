import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import type { Metadata } from 'next'
import TorneoCard from '@/components/TorneoCard'

// Página 100% pública, sin nada personalizado por usuario — cachear
// 30s en vez de pegarle a la base en cada visita.
export const revalidate = 30
export const metadata: Metadata = { title: 'Brackets' }

export default async function BracketsPage() {
  const supabase = await createServerSupabase()

  const { data: tourneys } = await supabase
    .from('tournaments')
    .select('*, creator:players!tournaments_creator_id_fkey(nickname_juego, discord_avatar), registros:tournament_registrations(count), escudo:trofeos!tournaments_escudo_id_fkey(nombre, icono, color, forma)')
    .in('estado', ['live', 'finalizado', 'inscripciones'])
    .order('destacado', { ascending: false })
    .order('fecha_inicio', { ascending: false })

  const live = tourneys?.filter((t: any) => t.estado === 'live') ?? []
  const open = tourneys?.filter((t: any) => t.estado === 'inscripciones') ?? []
  const done = tourneys?.filter((t: any) => t.estado === 'finalizado') ?? []

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 64px', flex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
              ENFRENTAMIENTOS &amp; BRACKETS
            </h1>
            {live.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(244,67,54,0.12)', border: '1px solid rgba(244,67,54,0.35)',
                color: '#F44336', padding: '3px 10px', borderRadius: 20,
                fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1, fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F44336', display: 'inline-block' }} />
                {live.length} EN VIVO
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            Seguí los brackets en vivo y los resultados de cada torneo.
          </p>
          <div style={{ width: 64, height: 2, background: 'linear-gradient(90deg, var(--gold), transparent)', marginTop: 16 }} />
        </div>

        {live.length > 0 && <Section title="En vivo" accent="#F44336" tourneys={live} />}
        {open.length > 0 && <Section title="Inscripciones abiertas" accent="#4CAF50" tourneys={open} />}
        {done.length > 0 && <Section title="Finalizados" accent="#8A8A8A" tourneys={done} />}

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

function Section({ title, accent, tourneys }: { title: string; accent: string; tourneys: any[] }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}88` }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-secondary)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>{title}</span>
        <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)' }}>{tourneys.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {tourneys.map((t: any) => <TorneoCard key={t.id} torneo={t} showCreator={false} />)}
      </div>
    </div>
  )
}
