'use client'
import { Fragment, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { REINO_COLOR, REINOS, CLASES, CLASE_COLOR, getTier, MMR_TIERS } from '@/lib/constants'
import type { Reino, Clase } from '@/lib/types'
import TrofeoBadge from '@/components/TrofeoBadge'
import { avatarSrc } from '@/lib/avatar'
import PremiumBadge from '@/components/PremiumBadge'
import { estiloPremium } from '@/lib/premium'
import { TIER_ICON_BY_RANK, IconCheck, IconLayers, IconFire, IconChart, IconUsers, IconShield, RankNumeral } from '@/components/RankingIcons'

/* ── Shields ─────────────────────────────────────────── */
const SHIELD_SRC: Record<string, string> = {
  Syrtis: '/shield-syrtis.png', Ignis: '/shield-ignis.png', Alsius: '/shield-alsius.png',
}
function KingdomShield({ reino, size = 22 }: { reino: string; size?: number }) {
  const src = SHIELD_SRC[reino]
  if (!src) return null
  return <img src={src} alt={reino} width={size} height={size} className={`shield-${reino.toLowerCase()}`} style={{ objectFit: 'contain', flexShrink: 0, display: 'block' }} />
}

/* ── Class icons ─────────────────────────────────────── */
const CLASE_SVG: Record<string, React.ReactNode> = {
  Bárbaro:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/></svg>,
  Caballero:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Conjurador: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Brujo:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  Tirador:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Cazador:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5"/><path d="M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14"/><path d="M6.5 17.5c-.66.568-1 1.347-1 2.5h11c0-1.153-.34-1.932-1-2.5"/></svg>,
}

const IconX = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" /></svg>
)

function TierIcon({ tierName, size = 11, color }: { tierName: string; size?: number; color: string }) {
  const idx = MMR_TIERS.findIndex(t => t.name === tierName)
  const Icon = TIER_ICON_BY_RANK[idx] ?? TIER_ICON_BY_RANK[TIER_ICON_BY_RANK.length - 1]
  return <Icon size={size} style={{ color }} />
}

function TierPill({ tier, size = 'sm' }: { tier: typeof MMR_TIERS[number]; size?: 'sm' | 'md' }) {
  const fs = size === 'md' ? 11 : 10
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-mono)', fontSize: fs, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
      padding: '2px 7px', color: tier.color,
      background: `color-mix(in srgb, ${tier.color} 12%, transparent)`,
      border: `1px solid color-mix(in srgb, ${tier.color} 35%, transparent)`,
    }}>
      <TierIcon tierName={tier.name} size={fs} color={tier.color} /> {tier.name}
    </span>
  )
}

/** Winrate real + desglose V-D derivado de winrate% × partidas_jugadas
 *  (no viene separado de la base — se calcula, no se inventa). */
function WinrateBar({ value, partidas }: { value: number; partidas?: number }) {
  const color = value >= 70 ? 'var(--syrtis)' : value >= 55 ? 'var(--gold)' : value >= 45 ? 'var(--text-secondary)' : 'var(--ignis)'
  const wins = partidas ? Math.round((partidas * value) / 100) : null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color, fontWeight: 700 }}>{value}%</span>
        {wins !== null && partidas !== undefined && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{wins}V · {partidas - wins}D</span>
        )}
      </div>
      <div style={{ height: 4, background: 'var(--bg-input)', marginTop: 4, width: '100%', maxWidth: 120 }}>
        <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
    </div>
  )
}

const MEDAL_COLOR: Record<number, string> = { 1: 'var(--gold)', 2: 'var(--medal-silver)', 3: 'var(--medal-bronze)' }

function TrofeoRow({ grupos, size = 'xs' }: { grupos: import('@/lib/campeonatos').TrofeoGrupo[]; size?: 'xs' | 'sm' }) {
  if (!grupos || grupos.length === 0) return null
  const visibles = grupos.slice(0, 3)
  const restantes = grupos.length - visibles.length
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {visibles.map((g, i) => (
        <TrofeoBadge
          key={i} trofeo={g.trofeo} tipoClan={g.tipoClan} puesto={g.puesto} size={size} count={g.count}
          title={`${g.puesto === 2 ? 'Subcampeón' : 'Campeón'}${g.tipoClan ? ' de clan' : ''} — ${g.nombres.join(', ')}`}
        />
      ))}
      {restantes > 0 && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>+{restantes}</span>}
    </span>
  )
}

const TABS = [
  { id: 'personajes', label: 'Personajes',        Icon: IconChart },
  { id: 'cuentas',    label: 'Jugadores (Cuentas)', Icon: IconUsers },
  { id: 'reinos',     label: 'Reinos & Balance',    Icon: IconShield },
  { id: 'rachas',     label: 'Rachas de Victoria',  Icon: IconFire },
] as const

export default function RankingContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const reinoFiltro = searchParams.get('reino') ?? ''
  const claseFiltro = searchParams.get('clase') ?? ''
  const vista = searchParams.get('vista') ?? 'personajes'
  const multiclase = searchParams.get('multiclase') ?? ''
  const page = parseInt(searchParams.get('page') || '1')
  const PAGE = 50
  const from = (page - 1) * PAGE

  const [data, setData] = useState<{
    personajes: any[]; count: number; trofeosPorPersonaje: Record<string, any[]>
    cuentas: any[]; porReino: any[]; rachas: any[]
  } | null>(null)

  useEffect(() => {
    setData(null)
    fetch(`/api/jugadores?${searchParams.toString()}`)
      .then(res => res.json())
      .then(setData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  const isFiltered = !!(q || reinoFiltro || claseFiltro)

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = { q: q || undefined, reino: reinoFiltro || undefined, clase: claseFiltro || undefined, page: searchParams.get('page') ?? undefined, vista, multiclase: multiclase || undefined, ...overrides }
    const parts = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    return `/jugadores${parts.length ? '?' + parts.join('&') : ''}`
  }

  if (!data) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)' }}>Cargando...</div>
  }

  const { personajes, count, trofeosPorPersonaje, cuentas, porReino, rachas } = data
  const totalPages = Math.ceil((count || 0) / PAGE)
  const totalReinos = porReino.reduce((s, r) => s + r.count, 0) || 1

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = vista === id
          return (
            <Link key={id} href={buildUrl({ vista: id, page: '1' })} style={{
              display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
              padding: '10px 14px', marginBottom: -1,
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: active ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              <Icon size={14} /> {label}
            </Link>
          )
        })}
      </div>

      {/* Filtros — solo tienen sentido en las vistas paginadas/de lista */}
      {(vista === 'personajes' || vista === 'cuentas') && (
      <form method="GET" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="hidden" name="vista" value={vista} />
        <input name="q" defaultValue={q} placeholder="Buscar personaje o jugador..."
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '8px 12px', minWidth: 220, flex: 1 }} />
        <select name="reino" defaultValue={reinoFiltro} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '8px 12px' }}>
          <option value="">Reino: Todos</option>
          {REINOS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select name="clase" defaultValue={claseFiltro} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '8px 12px' }}>
          <option value="">Clase: Todas</option>
          {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--gold)',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase',
          padding: '8px 16px', cursor: 'pointer',
        }}>Filtrar</button>
        {isFiltered && (
          <Link href={buildUrl({ q: undefined, reino: undefined, clase: undefined, page: '1' })} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'var(--error)', textDecoration: 'none', padding: '8px 12px',
          }}><IconX size={9} /> Limpiar</Link>
        )}
      </form>
      )}

      {/* ── VISTA PERSONAJES ─────────────────────────────── */}
      {vista === 'personajes' && (
        <>
          {/* Podio top 3 */}
          {!isFiltered && page === 1 && personajes && personajes.length >= 3 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
              {[personajes[1], personajes[0], personajes[2]].map((p: any, idx) => {
                const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3
                const tier = getTier(p.mmr)
                const mc = MEDAL_COLOR[rank]
                const rc = REINO_COLOR[p.reino as Reino]
                const isChampion = rank === 1
                return (
                  <Link key={p.id} href={`/jugadores/${p.player_id}`} style={{ textDecoration: 'none', flex: '1 1 220px', minWidth: 220, order: rank === 1 ? 0 : rank }}>
                    <div style={{
                      background: 'var(--bg-card)', border: `1px solid ${isChampion ? 'var(--gold)' : 'var(--border)'}`,
                      borderTop: `2px solid ${rc}`, padding: '18px 16px', height: '100%',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <RankNumeral rank={rank} size={isChampion ? 26 : 20} color={mc} />
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10,
                          letterSpacing: '0.08em', textTransform: 'uppercase', color: rc, border: `1px solid ${rc}`, padding: '2px 7px',
                        }}>
                          <span style={{ width: 5, height: 5, background: rc }} /> {p.reino}
                        </span>
                      </div>

                      <div style={{ width: isChampion ? 56 : 44, height: isChampion ? 56 : 44, background: `color-mix(in srgb, ${rc} 12%, transparent)`, border: `2px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display-v2)', fontSize: isChampion ? 22 : 17, fontWeight: 600, color: rc, marginBottom: 10 }}>
                        {p.nickname_juego?.[0]?.toUpperCase()}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <h3 style={{ fontFamily: 'var(--font-display-v2)', fontSize: isChampion ? 22 : 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.nickname_juego}</h3>
                        {p.verificado && <IconCheck size={14} style={{ color: mc, flexShrink: 0 }} />}
                        <PremiumBadge esPremium={p.player?.es_premium} color={p.player?.premium_color} size={11} />
                      </div>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>{p.reino} · {p.clase}</p>
                      <TrofeoRow grupos={trofeosPorPersonaje[p.id] ?? []} />

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: isChampion ? 24 : 19, fontWeight: 700, color: mc }}>{p.mmr}</span>
                        <TierPill tier={tier} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Tabla */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px 1.6fr 110px 120px 130px 150px 90px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              {['#', 'PERSONAJE', 'REINO', 'CLASE', 'MMR / TIER', 'WINRATE', 'PJ'].map(col => (
                <div key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{col}</div>
              ))}
            </div>

            {!personajes?.length ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)' }}>No se encontraron personajes.</div>
            ) : personajes.map((p: any, i: number) => {
              const globalRank = from + i + 1
              const tier = getTier(p.mmr)
              const prevTier = i > 0 ? getTier(personajes[i - 1].mmr) : null
              const showDivider = !prevTier || tier.name !== prevTier.name
              const rc = REINO_COLOR[p.reino as Reino]
              const isTop = globalRank <= 3

              return (
                <Fragment key={p.id}>
                  {showDivider && (
                    <div style={{ padding: '6px 16px', borderBottom: '1px solid var(--border)', borderLeft: `3px solid ${tier.color}`, background: `color-mix(in srgb, ${tier.color} 6%, transparent)`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <TierPill tier={tier} size="md" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: tier.color, letterSpacing: '0.08em' }}>{tier.min > 0 ? `${tier.min}+ MMR` : '< 900 MMR'}</span>
                    </div>
                  )}
                  <Link href={`/jugadores/${p.player_id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '52px 1.6fr 110px 120px 130px 150px 90px', padding: '12px 16px', borderBottom: i < personajes.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer', borderLeft: isTop ? `3px solid ${MEDAL_COLOR[globalRank]}` : `3px solid color-mix(in srgb, ${tier.color} 18%, transparent)` }}>
                      {/* Rank */}
                      <div>
                        {isTop ? <RankNumeral rank={globalRank} size={16} color={MEDAL_COLOR[globalRank]} />
                          : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{globalRank}</span>}
                      </div>
                      {/* Nombre */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: `color-mix(in srgb, ${rc} 9%, transparent)`, border: `2px solid color-mix(in srgb, ${rc} ${isTop ? '73%' : '27%'}, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display-v2)', fontSize: 13, fontWeight: 600, color: rc, flexShrink: 0 }}>
                          {p.nickname_juego?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 14, fontWeight: 600, color: p.player?.es_premium ? estiloPremium(p.player.premium_color, p.player.premium_bg).color : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {p.nickname_juego}
                            {p.verificado && <IconCheck size={12} style={{ color: 'var(--alsius)', flexShrink: 0 }} />}
                            <PremiumBadge esPremium={p.player?.es_premium} color={p.player?.premium_color} size={11} />
                            <TrofeoRow grupos={trofeosPorPersonaje[p.id] ?? []} />
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{p.player?.discord_username ?? '—'}</div>
                        </div>
                      </div>
                      {/* Reino */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <KingdomShield reino={p.reino} size={16} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: rc, fontWeight: 600 }}>{p.reino}</span>
                      </div>
                      {/* Clase */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>{CLASE_SVG[p.clase]}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{p.clase}</span>
                      </div>
                      {/* MMR */}
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: isTop ? MEDAL_COLOR[globalRank] : 'var(--gold)', fontWeight: 700 }}>{p.mmr}</div>
                        <div style={{ marginTop: 3 }}><TierPill tier={tier} /></div>
                      </div>
                      {/* WR */}
                      <WinrateBar value={p.winrate ?? 0} partidas={p.partidas_jugadas} />
                      {/* PJ */}
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{p.partidas_jugadas}</div>
                    </div>
                  </Link>
                </Fragment>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <Link key={pg} href={buildUrl({ page: String(pg) })} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, textDecoration: 'none', background: pg === page ? 'var(--gold)' : 'var(--bg-card)', border: `1px solid ${pg === page ? 'var(--gold)' : 'var(--border)'}`, color: pg === page ? '#050505' : 'var(--text-muted)' }}>{pg}</Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── VISTA CUENTAS ────────────────────────────────── */}
      {vista === 'cuentas' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Link
              href={buildUrl({ multiclase: multiclase ? undefined : '1' })}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '7px 12px', border: `1px solid ${multiclase ? 'var(--gold)' : 'var(--border)'}`,
                background: multiclase ? 'color-mix(in srgb, var(--gold) 12%, transparent)' : 'var(--bg-card)',
                color: multiclase ? 'var(--gold)' : 'var(--text-muted)',
              }}
              title="Jugadores que compitieron con 2 o más subclases distintas (aunque sea con personajes separados)"
            >
              <IconLayers size={12} /> Solo multiclase
            </Link>
            {multiclase && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{cuentas.length} jugadores</span>
            )}
          </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 160px 110px 100px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {['#', 'JUGADOR', 'MEJOR PERSONAJE', 'SUBCLASES', 'BEST MMR'].map(col => (
              <div key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{col}</div>
            ))}
          </div>

          {!cuentas.length ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)' }}>
              {multiclase ? 'Ningún jugador compitió con 2+ subclases todavía.' : 'No hay jugadores registrados.'}
            </div>
          ) : cuentas.map((c: any, i: number) => {
            const bp = c.best_personaje
            const rc = REINO_COLOR[bp?.reino as Reino] ?? 'var(--gold)'
            const tier = getTier(bp?.mmr ?? 0)
            return (
              <Link key={c.id} href={`/jugadores/${c.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 160px 110px 100px', padding: '12px 16px', borderBottom: i < cuentas.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {avatarSrc(c)
                        ? <img src={avatarSrc(c)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 12, color: 'var(--text-muted)' }}>{c.nombre_mostrado?.[0]?.toUpperCase()}</span>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.nombre_mostrado ?? '—'}</span>
                    {c.esMulticlase && <IconLayers size={12} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KingdomShield reino={bp?.reino} size={14} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: rc, fontWeight: 600 }}>{bp?.nickname_juego}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{bp?.clase}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.clasesDistintas.map((cl: Clase) => (
                        <span key={cl} title={cl} style={{ color: CLASE_COLOR[cl], display: 'flex' }}>{CLASE_SVG[cl]}</span>
                      ))}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{c.personajes.length} personaje{c.personajes.length === 1 ? '' : 's'}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{bp?.mmr ?? '—'}</div>
                    <div style={{ marginTop: 2 }}><TierPill tier={tier} /></div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        </>
      )}

      {/* ── VISTA REINOS ─────────────────────────────────── */}
      {vista === 'reinos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {porReino.map(({ reino, count, avgWr, topMmr, tiers, top5 }) => {
            const rc = REINO_COLOR[reino as Reino]
            const totalTiers = tiers.reduce((s: number, x: any) => s + x.n, 0) || 1
            const share = Math.round((count / totalReinos) * 1000) / 10
            return (
              <div key={reino} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `2px solid ${rc}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <KingdomShield reino={reino} size={26} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 17, fontWeight: 600, color: rc }}>{reino}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{count} combatientes · {share}% del total</div>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: rc }}>{topMmr || '—'}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>MMR MÁS ALTO</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{avgWr}%</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>WR PROMEDIO</div>
                  </div>
                </div>
                {tiers.length > 0 && (
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', height: 5, marginBottom: 6 }}>
                      {tiers.map(({ tier, n }: any) => (
                        <div key={tier.name} title={`${tier.name}: ${n}`} style={{ width: `${(n / totalTiers) * 100}%`, background: tier.color }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
                      {tiers.map(({ tier, n }: any) => (
                        <span key={tier.name} style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 10, color: tier.color }}>
                          <TierIcon tierName={tier.name} size={9} color={tier.color} /> {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {top5.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)', fontSize: 13 }}>Sin personajes.</div>
                ) : top5.map((p: any, i: number) => {
                  const tier = getTier(p.mmr)
                  return (
                    <Link key={p.id} href={`/jugadores/${p.player_id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: i < top5.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', width: 14 }}>{i + 1}</span>
                        <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname_juego}</span>
                        <TierPill tier={tier} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: tier.color, fontWeight: 700 }}>{p.mmr}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ── VISTA RACHAS ─────────────────────────────────── */}
      {vista === 'rachas' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 110px 110px 90px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {['#', 'PERSONAJE', 'REINO', 'RACHA', 'MMR'].map(col => (
              <div key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{col}</div>
            ))}
          </div>
          {rachas.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)' }}>Nadie tiene una racha activa ahora mismo.</div>
          ) : rachas.map((p: any, i: number) => {
            const rc = REINO_COLOR[p.reino as Reino]
            const tier = getTier(p.mmr)
            return (
              <Link key={p.id} href={`/jugadores/${p.player_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 110px 110px 90px', padding: '12px 16px', borderBottom: i < rachas.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: `color-mix(in srgb, ${rc} 9%, transparent)`, border: `2px solid color-mix(in srgb, ${rc} 27%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display-v2)', fontSize: 12, fontWeight: 600, color: rc, flexShrink: 0 }}>
                      {p.nickname_juego?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.nickname_juego}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KingdomShield reino={p.reino} size={16} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: rc }}>{p.reino}</span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--syrtis)' }}>
                    <IconFire size={13} /> {p.winstreak}
                  </span>
                  <TierPill tier={tier} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
