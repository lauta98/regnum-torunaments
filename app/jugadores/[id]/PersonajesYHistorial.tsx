'use client'
import { useState } from 'react'
import Link from 'next/link'
import { REINO_COLOR, getTier, temaTorneo, FORMAT_COLOR, MMR_TIERS } from '@/lib/constants'
import type { Reino } from '@/lib/types'
import { TIER_ICON_BY_RANK } from '@/components/RankingIcons'
import AgregarPersonaje from './AgregarPersonaje'
import ReclamarNickname from './ReclamarNickname'
import ElegirPrincipal from './ElegirPrincipal'
import EditarNickname from './EditarNickname'
import TrofeoBadge from '@/components/TrofeoBadge'
import PremiumAccentLine from '@/components/PremiumAccentLine'
import { cardEstiloPremium, type EstiloPremium } from '@/lib/premium'
import type { TrofeoGrupo } from '@/lib/campeonatos'

// Mismos paths que CLASE_SVG en RankingContent.tsx / Salón de la Fama —
// mismas 6 clases, mismo ícono, consistente en todo el sitio.
const CLASE_ICON_PATH: Record<string, string> = {
  Bárbaro:    'M14.5 17.5L3 6V3h3l11.5 11.5',
  Caballero:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  Tirador:    'M5 12h14M12 5l7 7-7 7',
}
function ClaseIcon({ clase, size = 18 }: { clase: string; size?: number }) {
  if (clase === 'Brujo') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    )
  }
  if (clase === 'Conjurador') {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  }
  if (clase === 'Cazador') {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14M6.5 17.5c-.66.568-1 1.347-1 2.5h11c0-1.153-.34-1.932-1-2.5" /></svg>
  }
  const d = CLASE_ICON_PATH[clase]
  if (!d) return <IconMedalLine size={size} />
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={d} /></svg>
}
// tema.icon (temaTorneo, lib/constants.ts) sigue siendo emoji — override
// local por label, mismo criterio que TorneoCard.tsx, sin tocar el
// archivo compartido.
function TemaIcon({ label, size = 13 }: { label: string; size?: number }) {
  const ARQUETIPO: Record<string, string> = {
    Guerreros: 'M3.75 13.5 14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
    Magos:     'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
  }
  if (label === 'Arqueros') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15.59 14.37a5 5 0 0 1-.77 6.13l-.72.71a.75.75 0 0 1-1.06 0l-.71-.72a5 5 0 0 1 6.13-.77m-8.98-8.98a5 5 0 0 1 .77-6.13l.72-.71a.75.75 0 0 1 1.06 0l.71.72a5 5 0 0 1-6.13.77m2.12 7.07 4.24-4.24" strokeLinecap="round" strokeLinejoin="round" /></svg>
  if (ARQUETIPO[label]) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={ARQUETIPO[label]} strokeLinecap="round" strokeLinejoin="round" /></svg>
  if (CLASE_ICON_PATH[label] || ['Brujo', 'Conjurador', 'Cazador'].includes(label)) return <ClaseIcon clase={label} size={size} />
  return <IconTrophy size={size} />
}
function IconTrophy({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" strokeLinecap="round" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" strokeLinecap="round" />
      <path d="M4 22h16" strokeLinecap="round" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" strokeLinejoin="round" />
    </svg>
  )
}
function IconMedalLine({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="15" r="6" /><path d="M8.5 9L6 3M15.5 9L18 3M6 3h3M18 3h-3" strokeLinecap="round" />
    </svg>
  )
}
function IconCheck({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconX({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" /></svg>
}
function IconFire({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconStar({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M11.48 3.5a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0l-4.725 2.885a.562.562 0 0 1-.84-.61l1.285-5.385a.562.562 0 0 0-.182-.557L2.043 10.386a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
}
// Mismo criterio que TierPill en RankingContent.tsx — no usa tier.icon
// (emoji de lib/constants.ts) ni la clase global .tier-pill.
function TierPill({ tier }: { tier: typeof MMR_TIERS[number] }) {
  const idx = MMR_TIERS.findIndex(t => t.name === tier.name)
  const Icon = TIER_ICON_BY_RANK[idx] ?? TIER_ICON_BY_RANK[TIER_ICON_BY_RANK.length - 1]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
      padding: '2px 7px', color: tier.color,
      background: `color-mix(in srgb, ${tier.color} 12%, transparent)`,
      border: `1px solid color-mix(in srgb, ${tier.color} 35%, transparent)`,
    }}>
      <Icon size={10} style={{ color: tier.color }} /> {tier.name}
    </span>
  )
}

const SHIELD_SRC: Record<string, string> = {
  Syrtis: '/shield-syrtis.png', Ignis: '/shield-ignis.png', Alsius: '/shield-alsius.png',
}

/** Fila compacta de insignias de copa junto al nombre de un personaje —
 *  hasta 3 distintas + "+N" si hay más, mismo criterio que en el ranking. */
function TrofeoRow({ grupos, size = 'xs' }: { grupos: TrofeoGrupo[]; size?: 'xs' | 'sm' | 'md' }) {
  if (!grupos?.length) return null
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

export default function PersonajesYHistorial({
  playerId, personajes, isOwner, personajePrincipalId, trofeosPorPersonaje, historiasPorPersonaje, nicknamesAnterioresPorPersonaje, tema,
}: {
  playerId: string
  personajes: any[]
  isOwner: boolean
  personajePrincipalId: string | null
  trofeosPorPersonaje: Record<string, TrofeoGrupo[]>
  historiasPorPersonaje: Record<string, any[]>
  nicknamesAnterioresPorPersonaje: Record<string, string[]>
  tema: EstiloPremium | null
}) {
  // Vitrina: todas las copas de todos sus personajes, combinadas por nombre
  // de copa (o el grupo genérico) — el trofeo es del jugador, no de "un"
  // personaje puntual, aunque cada campeonato haya sido con uno distinto.
  const vitrina = (() => {
    const combinado = new Map<string, TrofeoGrupo>()
    Object.values(trofeosPorPersonaje).flat().forEach(g => {
      const key = `${g.tipoClan ? 'clan' : 'ind'}:${g.puesto}:${g.trofeo?.nombre ?? '__generico'}`
      const existente = combinado.get(key)
      if (existente) { existente.count += g.count; existente.nombres.push(...g.nombres) }
      else combinado.set(key, { ...g, nombres: [...g.nombres] })
    })
    return [...combinado.values()].sort((a, b) => a.puesto - b.puesto || b.count - a.count)
  })()
  const INITIAL_VISIBLE = 20
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(personajes[0]?.id ?? null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const seleccionado = personajes.find(p => p.id === seleccionadoId) ?? personajes[0]
  const historial = seleccionadoId ? (historiasPorPersonaje[seleccionadoId] ?? []) : []
  const historialVisible = historial.slice(0, visibleCount)

  const elegirPersonaje = (id: string) => {
    setSeleccionadoId(id)
    setVisibleCount(INITIAL_VISIBLE)
  }

  return (
    <>
      {/* Personajes */}
      <div style={{ background: 'var(--bg-card)', overflow: 'hidden', ...cardEstiloPremium(tema) }}>
        <PremiumAccentLine color={tema?.color} />
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Personajes</span>
          {isOwner && <AgregarPersonaje playerId={playerId} />}
        </div>

        {!personajes.length ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)', fontSize: 15 }}>Sin personajes registrados.</div>
        ) : personajes.map((p, i) => {
          const rc = REINO_COLOR[p.reino as Reino] ?? 'var(--gold)'
          const tier = getTier(p.mmr)
          const esSeleccionado = p.id === seleccionadoId
          const esPrincipal = p.id === personajePrincipalId
          return (
            <div
              key={p.id}
              onClick={() => elegirPersonaje(p.id)}
              title="Ver historial de este personaje"
              style={{
                display: 'grid', gridTemplateColumns: `1fr 90px 90px 90px ${isOwner ? '58px' : '36px'}`,
                padding: '14px 20px',
                borderBottom: i < personajes.length - 1 ? '1px solid var(--border)' : 'none',
                borderLeft: `2px solid ${esSeleccionado ? 'var(--gold)' : 'transparent'}`,
                background: esSeleccionado ? 'color-mix(in srgb, var(--gold) 5%, transparent)' : 'transparent',
                alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              {/* Personaje info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, background: `color-mix(in srgb, ${rc} 9%, transparent)`, border: `2px solid color-mix(in srgb, ${rc} 27%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rc }}>
                    <ClaseIcon clase={p.clase} size={18} />
                  </div>
                  {SHIELD_SRC[p.reino] && (
                    <img src={SHIELD_SRC[p.reino]} alt={p.reino} width={13} height={13} className={`shield-${p.reino?.toLowerCase()}`} style={{ objectFit: 'contain', position: 'absolute', bottom: -2, right: -4 }} />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{p.nickname_juego}</span>
                    {p.verificado && <IconCheck size={12} />}
                    {esPrincipal && <span title="Personaje principal" style={{ color: 'var(--gold)', display: 'flex' }}><IconStar size={11} /></span>}
                    <TrofeoRow grupos={trofeosPorPersonaje[p.id] ?? []} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: rc }}>{p.reino} · {p.clase}</div>
                  {nicknamesAnterioresPorPersonaje[p.id]?.length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                      antes: {nicknamesAnterioresPorPersonaje[p.id].join(', ')}
                    </div>
                  )}
                </div>
              </div>
              {/* MMR */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{p.mmr}</div>
                <div style={{ marginTop: 2 }}><TierPill tier={tier} /></div>
              </div>
              {/* WR */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: Number(p.winrate) >= 55 ? 'var(--syrtis)' : 'var(--text-secondary)', fontWeight: 600 }}>{p.winrate}%</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{p.partidas_jugadas} PJ</div>
              </div>
              {/* WS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: p.winstreak > 0 ? 'var(--syrtis)' : 'var(--text-muted)' }}>
                {p.winstreak > 0 ? <><IconFire size={11} /> {p.winstreak}</> : '—'}
              </div>
              {/* Reclamar / elegir principal + corregir nombre */}
              <div onClick={e => e.stopPropagation()}>
                {isOwner ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ElegirPrincipal playerId={playerId} personajeId={p.id} esPrincipal={esPrincipal} />
                    <EditarNickname personajeId={p.id} nicknameActual={p.nickname_juego} />
                  </div>
                ) : (
                  <ReclamarNickname personajeId={p.id} nickname={p.nickname_juego} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Vitrina de trofeos — todas las copas del jugador, combinadas */}
      {vitrina.length > 0 && (
        <div style={{ background: 'var(--bg-card)', overflow: 'hidden', ...cardEstiloPremium(tema) }}>
          <PremiumAccentLine color={tema?.color} />
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Vitrina de trofeos</span>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {vitrina.map((g, i) => {
              const VISIBLES = 6
              const visibles = Math.min(g.count, VISIBLES)
              const restantes = g.count - visibles
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 200, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                    {Array.from({ length: visibles }).map((_, j) => (
                      <TrofeoBadge key={j} trofeo={g.trofeo} tipoClan={g.tipoClan} puesto={g.puesto} size="sm" title={g.nombres[j]} />
                    ))}
                    {restantes > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>+{restantes}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {g.trofeo?.nombre ?? (g.puesto === 2 ? 'Subcampeón' : (g.tipoClan ? 'Campeón de clan' : 'Campeón'))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {g.nombres.join(' · ')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Historial de enfrentamientos del personaje seleccionado */}
      {historial.length > 0 && (
        <div style={{ background: 'var(--bg-card)', overflow: 'hidden', ...cardEstiloPremium(tema) }}>
          <PremiumAccentLine color={tema?.color} />
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Historial de enfrentamientos — {seleccionado?.nickname_juego}
            </span>
          </div>
          <div style={{ padding: '10px 20px 4px', display: 'flex', flexDirection: 'column' }}>
            {historialVisible.map((entry: any, i: number) => {
              const match = entry.match
              // El equipo de este personaje es el ganador o el
              // perdedor según `entry.gano` — el rival es el otro
              // de los dos equipos del partido.
              const rival = match
                ? (entry.gano
                    ? (match.ganador_id === match.equipo_a?.id ? match.equipo_b : match.equipo_a)
                    : (match.ganador_id === match.equipo_a?.id ? match.equipo_a : match.equipo_b))
                : null

              const temaT = temaTorneo(entry.torneo?.subclases_permitidas)
              const themeColor = temaT?.color ?? FORMAT_COLOR[entry.torneo?.formato as keyof typeof FORMAT_COLOR] ?? 'var(--gold)'

              // Se agrupan filas consecutivas del mismo torneo bajo un
              // encabezado propio en vez de repetir el nombre en cada
              // fila — así se distingue de un vistazo a qué torneo
              // pertenece cada tanda de partidos.
              const prevTorneoId = i > 0 ? historialVisible[i - 1].torneo?.id : null
              const esNuevoGrupo = entry.torneo?.id !== prevTorneoId

              const content = (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0 7px 12px', borderLeft: `2px solid color-mix(in srgb, ${themeColor} 35%, transparent)`, marginLeft: 2 }}>
                  <div style={{ width: 22, height: 22, background: entry.gano ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)', border: `1px solid ${entry.gano ? 'var(--syrtis)' : 'var(--ignis)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: entry.gano ? 'var(--syrtis)' : 'var(--ignis)', flexShrink: 0 }}>
                    {entry.gano ? <IconCheck size={11} /> : <IconX size={11} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rival ? <>vs {rival.nombre}</> : 'Rival desconocido'}
                    </div>
                    {match?.ronda && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{match.ronda}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: entry.delta > 0 ? 'var(--syrtis)' : '#f87171', fontWeight: 700 }}>
                      {entry.delta > 0 ? '+' : ''}{entry.delta}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{entry.mmr_despues} MMR</div>
                  </div>
                </div>
              )

              return (
                <div key={entry.id}>
                  {esNuevoGrupo && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      marginTop: i === 0 ? 0 : 14, marginBottom: 4, paddingLeft: 2,
                    }}>
                      <span style={{ color: themeColor, display: 'flex' }}><TemaIcon label={temaT?.label ?? ''} size={12} /></span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: themeColor, letterSpacing: '0.04em' }}>
                        {entry.torneo?.nombre ?? 'Partido'}
                      </span>
                      {entry.torneo?.fecha_inicio && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(entry.torneo.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR')}
                        </span>
                      )}
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                  )}
                  {match?.id ? (
                    <Link href={`/brackets/${entry.torneo?.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      {content}
                    </Link>
                  ) : content}
                </div>
              )
            })}
            {historial.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(v => v + INITIAL_VISIBLE)}
                style={{
                  margin: '10px 0 14px', width: '100%', padding: '10px 16px', cursor: 'pointer',
                  background: 'var(--bg-surface)', border: '1px solid var(--dark-border-gold)', color: 'var(--gold)',
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
              >
                Cargar más ({historial.length - visibleCount} restantes)
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
