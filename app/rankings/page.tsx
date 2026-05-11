import { Fragment } from 'react'
import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { REINO_COLOR, REINOS, CLASES, getTier } from '@/lib/constants'
import type { Reino, Clase } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Rankings' }

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}
const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; reino?: string; clase?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()
  const PAGE = 50
  const page = parseInt(params.page || '1')
  const from = (page - 1) * PAGE

  let query = supabase
    .from('players')
    .select('*', { count: 'exact' })
    .order('mmr_global', { ascending: false })
    .range(from, from + PAGE - 1)

  if (params.reino) query = query.eq('reino', params.reino as Reino)
  if (params.clase) query = query.eq('clase_principal', params.clase as Clase)
  if (params.q)     query = query.ilike('nickname_juego', `%${params.q}%`)

  const { data: players, count } = await query
  const totalPages = Math.ceil((count || 0) / PAGE)
  const isFiltered = !!(params.q || params.reino || params.clase)

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', flex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
            RANKINGS GLOBALES
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Elite Tier List — {count ?? 0} guerreros clasificados
          </p>
        </div>

        {/* Filters */}
        <form method="GET" style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <input
            name="q" defaultValue={params.q} placeholder="Buscar jugador..."
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
              borderRadius: 8, color: 'var(--text-primary)', padding: '8px 14px',
              fontSize: 13, fontFamily: 'var(--font-display)', outline: 'none',
              minWidth: 200, flex: 1,
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
          <button type="submit" style={{
            background: 'var(--gold-muted)', border: '1px solid var(--border-gold-strong)',
            borderRadius: 8, color: 'var(--gold)', padding: '8px 20px',
            fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1, cursor: 'pointer',
          }}>
            FILTRAR
          </button>
          {isFiltered && (
            <Link href="/rankings" style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-muted)', padding: '8px 16px',
              fontFamily: 'var(--font-display)', fontSize: 12, textDecoration: 'none',
              display: 'flex', alignItems: 'center',
            }}>✕ Limpiar</Link>
          )}
        </form>

        {/* Top 3 podium — only on unfiltered page 1 with enough players */}
        {!isFiltered && page === 1 && players && players.length >= 3 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center', alignItems: 'flex-end' }}>
            {[players[1], players[0], players[2]].map((p: any, idx) => {
              const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3
              const heights = [160, 200, 140]
              const tier = getTier(p.mmr_global)
              return (
                <Link key={p.id} href={`/jugadores/${p.id}`} style={{ textDecoration: 'none', flex: 1, maxWidth: 200 }}>
                  <div style={{
                    background: rank === 1
                      ? 'linear-gradient(160deg, #0f0d00, #1e1700)'
                      : 'var(--bg-card)',
                    border: `1px solid ${rank === 1 ? 'var(--border-gold-strong)' : 'var(--border-gold)'}`,
                    borderRadius: '12px 12px 0 0', padding: '20px 16px',
                    textAlign: 'center', height: heights[idx],
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                    boxShadow: rank === 1 ? '0 0 32px rgba(212,175,55,0.12)' : 'none',
                  }}>
                    <div style={{ fontSize: rank === 1 ? 36 : 28, marginBottom: 8 }}>{MEDAL[rank]}</div>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-surface)', border: `2px solid ${REINO_COLOR[p.reino as Reino]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8, boxShadow: `0 0 12px ${REINO_COLOR[p.reino as Reino]}44` }}>
                      {CLASE_ICON[p.clase_principal]}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: rank === 1 ? 'var(--gold)' : 'var(--text-primary)' }}>{p.nickname_juego}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--gold)', marginTop: 4 }}>{p.mmr_global.toLocaleString()}</div>
                    <span className={`tier-pill ${tier.cssClass}`} style={{ marginTop: 5 }}>{tier.icon} {tier.name}</span>
                    <div style={{ fontSize: 11, color: REINO_COLOR[p.reino as Reino], marginTop: 4 }}>{p.reino}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Rankings table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 110px 120px 100px 90px 80px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {['#', 'JUGADOR', 'REINO', 'CLASE', 'MMR / TIER', 'WINRATE', 'PARTIDAS'].map(col => (
              <div key={col} style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{col}</div>
            ))}
          </div>

          {!players?.length ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              No se encontraron jugadores.
            </div>
          ) : players.map((p: any, i: number) => {
            const globalRank = from + i + 1
            const tier = getTier(p.mmr_global)
            const prevTier = i > 0 ? getTier(players[i - 1].mmr_global) : null
            const showTierDivider = !prevTier || tier.name !== prevTier.name

            return (
              <Fragment key={p.id}>
                {/* Tier section divider */}
                {showTierDivider && (
                  <div style={{
                    padding: '5px 20px 4px',
                    borderBottom: `1px solid ${tier.color}18`,
                    borderLeft: `3px solid ${tier.color}`,
                    background: `${tier.color}07`,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span className={`tier-pill ${tier.cssClass}`}>{tier.icon} {tier.name.toUpperCase()}</span>
                    <span style={{ fontSize: 9, color: tier.color, fontFamily: 'var(--font-display)', opacity: 0.6, letterSpacing: 1 }}>
                      {tier.min > 0 ? `${tier.min}+ MMR` : '< 900 MMR'}
                    </span>
                  </div>
                )}

                {/* Player row */}
                <Link href={`/jugadores/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="row-hover" style={{
                    display: 'grid', gridTemplateColumns: '56px 1fr 110px 120px 100px 90px 80px',
                    padding: '13px 20px',
                    borderBottom: i < players.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center', cursor: 'pointer',
                    borderLeft: `3px solid ${tier.color}22`,
                  }}>
                    {/* Rank */}
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: globalRank <= 3 ? 18 : 14, color: globalRank <= 3 ? 'var(--gold)' : 'var(--text-muted)' }}>
                      {MEDAL[globalRank] ?? globalRank}
                    </div>

                    {/* Player */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-surface)', border: `2px solid ${REINO_COLOR[p.reino as Reino]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, boxShadow: `0 0 8px ${REINO_COLOR[p.reino as Reino]}33` }}>
                        {CLASE_ICON[p.clase_principal]}
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.nickname_juego}</span>
                    </div>

                    {/* Reino */}
                    <div style={{ fontSize: 13, color: REINO_COLOR[p.reino as Reino], fontWeight: 600 }}>{p.reino}</div>

                    {/* Clase */}
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.clase_principal}</div>

                    {/* MMR + Tier badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--gold)', fontWeight: 700 }}>{p.mmr_global.toLocaleString()}</div>
                      <span className={`tier-pill ${tier.cssClass}`}>{tier.icon} {tier.name}</span>
                    </div>

                    {/* Winrate */}
                    <div style={{ fontSize: 13, color: p.winrate >= 70 ? '#4CAF50' : p.winrate >= 55 ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: 600 }}>{p.winrate}%</div>

                    {/* Partidas */}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.partidas_jugadas}</div>
                  </div>
                </Link>
              </Fragment>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/rankings?page=${p}${params.q ? `&q=${params.q}` : ''}${params.reino ? `&reino=${params.reino}` : ''}${params.clase ? `&clase=${params.clase}` : ''}`}
                style={{
                  width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 12, textDecoration: 'none',
                  background: p === page ? 'var(--gold-muted)' : 'var(--bg-card)',
                  border: `1px solid ${p === page ? 'var(--border-gold-strong)' : 'var(--border)'}`,
                  color: p === page ? 'var(--gold)' : 'var(--text-muted)',
                }}>
                {p}
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
