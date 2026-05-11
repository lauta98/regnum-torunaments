import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { REINO_COLOR, REINOS, CLASES } from '@/lib/constants'
import type { Reino } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Jugadores' }

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; reino?: string; clase?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()

  let query = supabase
    .from('players')
    .select('*', { count: 'exact' })
    .order('mmr_global', { ascending: false })
    .limit(60)

  if (params.reino) query = query.eq('reino', params.reino)
  if (params.clase) query = query.eq('clase_principal', params.clase)
  if (params.q)     query = query.ilike('nickname_juego', `%${params.q}%`)

  const { data: players, count } = await query

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', flex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
            JUGADORES
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {count ?? 0} guerreros registrados en CoR
          </p>
        </div>

        {/* Filters */}
        <form method="GET" style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          <input
            name="q" defaultValue={params.q} placeholder="Buscar por nickname..."
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
              borderRadius: 8, color: 'var(--text-primary)', padding: '8px 14px',
              fontSize: 13, fontFamily: 'var(--font-display)', outline: 'none', flex: 1, minWidth: 180,
            }}
          />
          <select name="reino" defaultValue={params.reino || ''} style={selectStyle}>
            <option value="">Todos los reinos</option>
            {REINOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select name="clase" defaultValue={params.clase || ''} style={selectStyle}>
            <option value="">Todas las clases</option>
            {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" style={{ background: 'var(--gold-muted)', border: '1px solid var(--border-gold-strong)', borderRadius: 8, color: 'var(--gold)', padding: '8px 20px', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1, cursor: 'pointer' }}>
            BUSCAR
          </button>
        </form>

        {/* Kingdom stats */}
        {!params.q && !params.reino && !params.clase && players && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            {REINOS.map(r => {
              const n = players.filter((p: any) => p.reino === r).length
              return (
                <Link key={r} href={`/jugadores?reino=${r}`} style={{
                  flex: 1, padding: '14px 20px', borderRadius: 10, textDecoration: 'none',
                  background: `${REINO_COLOR[r]}11`, border: `1px solid ${REINO_COLOR[r]}44`,
                  textAlign: 'center', transition: 'background 0.15s',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: REINO_COLOR[r] }}>{n}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: REINO_COLOR[r], letterSpacing: 1, marginTop: 2 }}>{r.toUpperCase()}</div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Grid */}
        {!players?.length ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>No se encontraron jugadores.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {players.map((p: any, i: number) => (
              <Link key={p.id} href={`/jugadores/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                  ['--hover-color' as string]: REINO_COLOR[p.reino as Reino],
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${REINO_COLOR[p.reino as Reino]}22`, border: `2px solid ${REINO_COLOR[p.reino as Reino]}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px' }}>
                    {CLASE_ICON[p.clase_principal]}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{p.nickname_juego}</div>
                  <div style={{ fontSize: 12, color: REINO_COLOR[p.reino as Reino], marginBottom: 8 }}>{p.reino}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>{p.mmr_global.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>MMR · #{i + 1} ranking</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}

const selectStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
  borderRadius: 8, color: 'var(--text-secondary)', padding: '8px 14px',
  fontSize: 12, fontFamily: 'var(--font-display)', cursor: 'pointer', outline: 'none',
} as const
