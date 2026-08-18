import { Fragment } from 'react'
import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { REINO_COLOR, REINOS, CLASES, getTier } from '@/lib/constants'
import type { Reino, Clase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Ranking — CoR Tournament Stats' }

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

function WinrateBar({ value }: { value: number }) {
  const color = value >= 70 ? '#4CAF50' : value >= 55 ? '#d4af37' : value >= 45 ? '#909090' : '#F44336'
  return (
    <div>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color, fontWeight: 600 }}>{value}%</span>
      <div className="winrate-bar"><div className="winrate-fill" style={{ width: `${Math.min(value, 100)}%`, background: color }} /></div>
    </div>
  )
}

const MEDAL_COLORS: Record<number, { main: string; bg: string; glow: string; label: string }> = {
  1: { main: '#d4af37', bg: 'linear-gradient(160deg, #120f00, #1c1700)', glow: 'rgba(212,175,55,0.20)', label: '🥇' },
  2: { main: '#c0c0c0', bg: 'linear-gradient(160deg, #0d0d0d, #141414)', glow: 'rgba(192,192,192,0.12)', label: '🥈' },
  3: { main: '#cd7f32', bg: 'linear-gradient(160deg, #0e0a00, #141008)', glow: 'rgba(205,127,50,0.12)', label: '🥉' },
}

const selectStyle = {
  background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: 'var(--text-secondary)', padding: '8px 14px',
  fontSize: 12, fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none',
} as const

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; reino?: string; clase?: string; page?: string; vista?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerSupabase()
  const vista = params.vista ?? 'personajes'
  const PAGE = 50
  const page = parseInt(params.page || '1')
  const from = (page - 1) * PAGE

  /* ── Query personajes ──────────────────────────────── */
  // Nota: personaje_principal_id se trae aparte (ver mas abajo) en vez de
  // en este select anidado — si esa columna todavia no existe (falta correr
  // la migracion), un select anidado roto tumba TODA esta consulta (a
  // diferencia de select('*') suelto, que solo omite lo que falta).
  let query = supabase
    .from('personajes')
    .select('*, player:players!personajes_player_id_fkey(id, discord_username, discord_avatar, role)', { count: 'exact' })
    .order('mmr', { ascending: false })

  if (params.reino) query = query.eq('reino', params.reino as Reino)
  if (params.clase) query = query.eq('clase', params.clase as Clase)
  if (params.q)     query = query.ilike('nickname_juego', `%${params.q}%`)

  const { data: personajes, count } = await (
    vista === 'cuentas' ? query.limit(200) : query.range(from, from + PAGE - 1)
  )

  /* ── Campeonatos (para la insignia 🏆) ─────────────── */
  const personajeIds = (personajes ?? []).map((p: any) => p.id)
  const { data: campeonatosData } = personajeIds.length ? await supabase
    .from('campeonatos').select('personaje_id, tipo, equipo_nombre, torneo:tournaments(nombre)').in('personaje_id', personajeIds)
    : { data: null }
  const campeonatosPorPersonaje = new Map<string, string[]>()
  const campeonatosClanPorPersonaje = new Map<string, string[]>()
  campeonatosData?.forEach((c: any) => {
    if (!c.torneo) return
    if (c.tipo === 'equipo') {
      const arr = campeonatosClanPorPersonaje.get(c.personaje_id) ?? []
      arr.push(`${c.torneo.nombre} (${c.equipo_nombre})`)
      campeonatosClanPorPersonaje.set(c.personaje_id, arr)
    } else {
      const arr = campeonatosPorPersonaje.get(c.personaje_id) ?? []
      arr.push(c.torneo.nombre)
      campeonatosPorPersonaje.set(c.personaje_id, arr)
    }
  })

  /* ── Para vista cuentas: agrupar por player ────────── */
  let cuentas: any[] = []
  if (vista === 'cuentas') {
    const map = new Map<string, any>()
    for (const p of personajes ?? []) {
      const pid = p.player?.id ?? p.player_id
      if (!map.has(pid)) {
        map.set(pid, { ...p.player, best_personaje: p, personajes: [p] })
      } else {
        const entry = map.get(pid)
        entry.personajes.push(p)
        if (p.mmr > entry.best_personaje.mmr) entry.best_personaje = p
      }
    }
    cuentas = Array.from(map.values()).sort((a, b) => b.best_personaje.mmr - a.best_personaje.mmr)

    // Personaje "principal" elegido por cada cuenta (aparte del select de
    // arriba a proposito — ver nota mas arriba). Si la columna todavia no
    // existe (falta correr la migracion) esto devuelve error y se ignora
    // sin romper el resto de la pagina.
    const { data: principales } = await supabase.from('players').select('id, personaje_principal_id').in('id', cuentas.map(c => c.id))
    const principalPorCuenta = new Map<string, string>()
    principales?.forEach((p: any) => { if (p.personaje_principal_id) principalPorCuenta.set(p.id, p.personaje_principal_id) })
    cuentas.forEach(c => {
      const principalId = principalPorCuenta.get(c.id)
      const principal = c.personajes.find((p: any) => p.id === principalId)
      c.nombre_mostrado = principal?.nickname_juego ?? c.discord_username ?? null
    })
  }

  const totalPages = Math.ceil((count || 0) / PAGE)
  const isFiltered = !!(params.q || params.reino || params.clase)

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = { q: params.q, reino: params.reino, clase: params.clase, page: params.page, vista, ...overrides }
    const parts = Object.entries(p).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    return `/jugadores${parts.length ? '?' + parts.join('&') : ''}`
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Título */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 1.5 }}>
              Ranking
            </h1>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>
              {count ?? 0} personajes registrados
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
            Champions of Regnum — Rankings y estadísticas
          </p>
        </div>

        {/* Vista toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0a0a0a', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[
            { id: 'personajes', label: 'Personajes' },
            { id: 'cuentas',    label: 'Jugadores'  },
          ].map(({ id, label }) => (
            <Link key={id} href={buildUrl({ vista: id, page: '1' })} style={{
              padding: '7px 20px', borderRadius: 7, textDecoration: 'none',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
              background: vista === id ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: vista === id ? 'var(--gold)' : 'var(--text-muted)',
              border: `1px solid ${vista === id ? 'rgba(212,175,55,0.35)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>{label}</Link>
          ))}
        </div>

        {/* Filtros */}
        <form method="GET" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="hidden" name="vista" value={vista} />
          <input name="q" defaultValue={params.q} placeholder="Buscar personaje..."
            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 14px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', minWidth: 200, flex: 1 }} />
          <select name="reino" defaultValue={params.reino || ''} style={selectStyle}>
            <option value="">Todos los reinos</option>
            {REINOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select name="clase" defaultValue={params.clase || ''} style={selectStyle}>
            <option value="">Todas las clases</option>
            {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, color: 'var(--gold)', padding: '8px 18px', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 0.5, cursor: 'pointer' }}>
            Filtrar
          </button>
          {isFiltered && (
            <Link href={buildUrl({ q: undefined, reino: undefined, clase: undefined, page: '1' })} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'var(--text-muted)', padding: '8px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, textDecoration: 'none' }}>✕ Limpiar</Link>
          )}
        </form>

        {/* ── VISTA PERSONAJES ─────────────────────────────── */}
        {vista === 'personajes' && (
          <>
            {/* Podio top 3 */}
            {!isFiltered && page === 1 && personajes && personajes.length >= 3 && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 32, justifyContent: 'center', alignItems: 'flex-end' }}>
                {[personajes[1], personajes[0], personajes[2]].map((p: any, idx) => {
                  const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3
                  const paddingTop = [32, 16, 44]
                  const tier = getTier(p.mmr)
                  const m = MEDAL_COLORS[rank]
                  const rc = REINO_COLOR[p.reino as Reino]
                  return (
                    <Link key={p.id} href={`/jugadores/${p.player_id}`} style={{ textDecoration: 'none', flex: 1, maxWidth: 230 }}>
                      <div style={{ background: m.bg, border: `1px solid ${m.main}44`, borderRadius: '12px 12px 0 0', paddingTop: paddingTop[idx], paddingBottom: 16, paddingLeft: 16, paddingRight: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: `0 0 36px ${m.glow}, inset 0 0 60px rgba(0,0,0,0.4)`, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${m.main}88, transparent)` }} />
                        <div style={{ fontSize: rank === 1 ? 26 : 20 }}>{m.label}</div>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: rank === 1 ? 50 : 42, height: rank === 1 ? 50 : 42, borderRadius: '50%', background: `${rc}20`, border: `2px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: rank === 1 ? 17 : 14, fontWeight: 700, color: rc }}>
                            {p.nickname_juego?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ position: 'absolute', bottom: -4, right: -6 }}><KingdomShield reino={p.reino} size={14} /></div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: rank === 1 ? 12 : 11, fontWeight: 700, color: rank === 1 ? m.main : 'var(--text-primary)', letterSpacing: 0.3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nickname_juego} {p.verificado && <span title="Verificado">✓</span>}
                          {campeonatosPorPersonaje.get(p.id) && <span title={`Campeón de ${campeonatosPorPersonaje.get(p.id)!.join(', ')}`}>🏆</span>}
                          {campeonatosClanPorPersonaje.get(p.id) && <span title={`Campeón de clan — ${campeonatosClanPorPersonaje.get(p.id)!.join(', ')}`}>🛡️</span>}
                        </div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: rank === 1 ? 16 : 13, fontWeight: 700, color: m.main }}>{p.mmr}</div>
                        <span className={`tier-pill ${tier.cssClass}`}>{tier.icon} {tier.name}</span>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: rc, opacity: 0.9 }}>{p.reino} · {p.clase}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="divider-gold" style={{ marginBottom: 16 }} />

            {/* Tabla */}
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 110px 120px 120px 90px 56px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(212,175,55,0.03)' }}>
                {['#', 'PERSONAJE', 'REINO', 'CLASE', 'MMR / TIER', 'WINRATE', 'PJ'].map(col => (
                  <div key={col} style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.8 }}>{col}</div>
                ))}
              </div>

              {!personajes?.length ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>No se encontraron personajes.</div>
              ) : personajes.map((p: any, i: number) => {
                const globalRank = from + i + 1
                const tier = getTier(p.mmr)
                const prevTier = i > 0 ? getTier(personajes[i - 1].mmr) : null
                const showDivider = !prevTier || tier.name !== prevTier.name
                const rc = REINO_COLOR[p.reino as Reino]
                const isTop = globalRank <= 3
                const rankRowClass = isTop ? `rank-row-${globalRank}` : ''

                return (
                  <Fragment key={p.id}>
                    {showDivider && (
                      <div style={{ padding: '5px 20px', borderBottom: `1px solid ${tier.color}18`, borderLeft: `3px solid ${tier.color}66`, background: `linear-gradient(90deg, ${tier.color}08, transparent)`, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`tier-pill ${tier.cssClass}`}>{tier.icon} {tier.name.toUpperCase()}</span>
                        <span style={{ fontSize: 9, color: tier.color, fontFamily: 'var(--font-display)', opacity: 0.5, letterSpacing: 1.2 }}>{tier.min > 0 ? `${tier.min}+ MMR` : '< 900 MMR'}</span>
                      </div>
                    )}
                    <Link href={`/jugadores/${p.player_id}`} style={{ textDecoration: 'none' }}>
                      <div className={`row-hover ${rankRowClass}`} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 110px 120px 120px 90px 56px', padding: '12px 20px', borderBottom: i < personajes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', cursor: 'pointer', ...(!isTop ? { borderLeft: `3px solid ${tier.color}18` } : {}) }}>
                        {/* Rank */}
                        <div>{isTop ? <span style={{ fontSize: 18 }}>{['🥇','🥈','🥉'][globalRank - 1]}</span> : <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>{globalRank}</span>}</div>
                        {/* Nombre */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${rc}18`, border: `2px solid ${rc}${isTop ? 'bb' : '44'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: rc, flexShrink: 0 }}>
                            {p.nickname_juego?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {p.nickname_juego}
                              {p.verificado && <span style={{ fontSize: 10, color: '#2196F3' }} title="Personaje verificado">✓</span>}
                              {campeonatosPorPersonaje.get(p.id) && <span style={{ fontSize: 11 }} title={`Campeón de ${campeonatosPorPersonaje.get(p.id)!.join(', ')}`}>🏆</span>}
                              {campeonatosClanPorPersonaje.get(p.id) && <span style={{ fontSize: 11 }} title={`Campeón de clan — ${campeonatosClanPorPersonaje.get(p.id)!.join(', ')}`}>🛡️</span>}
                            </div>
                            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>{p.player?.discord_username ?? '—'}</div>
                          </div>
                        </div>
                        {/* Reino */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <KingdomShield reino={p.reino} size={18} />
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: rc, fontWeight: 600 }}>{p.reino}</span>
                        </div>
                        {/* Clase */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center' }}>{CLASE_SVG[p.clase]}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11 }}>{p.clase}</span>
                        </div>
                        {/* MMR */}
                        <div>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: isTop ? MEDAL_COLORS[globalRank]?.main ?? 'var(--gold)' : 'var(--gold)', fontWeight: 700 }}>{p.mmr}</div>
                          <span className={`tier-pill ${tier.cssClass}`} style={{ marginTop: 3, display: 'inline-flex' }}>{tier.icon} {tier.name}</span>
                        </div>
                        {/* WR */}
                        <WinrateBar value={p.winrate ?? 0} />
                        {/* PJ */}
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>{p.partidas_jugadas}</div>
                      </div>
                    </Link>
                  </Fragment>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <Link key={pg} href={buildUrl({ page: String(pg) })} style={{ width: 34, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, textDecoration: 'none', background: pg === page ? 'rgba(212,175,55,0.15)' : '#0a0a0a', border: `1px solid ${pg === page ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`, color: pg === page ? 'var(--gold)' : 'var(--text-muted)' }}>{pg}</Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── VISTA CUENTAS ────────────────────────────────── */}
        {vista === 'cuentas' && (
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 160px 80px 80px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(212,175,55,0.03)' }}>
              {['#', 'JUGADOR', 'MEJOR PERSONAJE', 'PERSONAJES', 'BEST MMR'].map(col => (
                <div key={col} style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.8 }}>{col}</div>
              ))}
            </div>

            {!cuentas.length ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>No hay jugadores registrados.</div>
            ) : cuentas.map((c: any, i: number) => {
              const bp = c.best_personaje
              const rc = REINO_COLOR[bp?.reino as Reino] ?? 'var(--gold)'
              const tier = getTier(bp?.mmr ?? 0)
              return (
                <Link key={c.id} href={`/jugadores/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div className="row-hover" style={{ display: 'grid', gridTemplateColumns: '52px 1fr 160px 80px 80px', padding: '12px 20px', borderBottom: i < cuentas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {c.discord_avatar
                          ? <img src={c.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          : <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)' }}>{c.nombre_mostrado?.[0]?.toUpperCase()}</span>}
                      </div>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.nombre_mostrado ?? '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <KingdomShield reino={bp?.reino} size={14} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: rc, fontWeight: 600 }}>{bp?.nickname_juego}</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>{bp?.clase}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>{c.personajes.length}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{bp?.mmr ?? '—'}</div>
                      <span className={`tier-pill ${tier.cssClass}`} style={{ display: 'inline-flex', marginTop: 2 }}>{tier.icon} {tier.name}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </main>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginTop: 40 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
