'use client'
import { useState } from 'react'
import Link from 'next/link'
import { REINO_COLOR, getTier, temaTorneo, FORMAT_COLOR } from '@/lib/constants'
import type { Reino } from '@/lib/types'
import AgregarPersonaje from './AgregarPersonaje'
import ReclamarNickname from './ReclamarNickname'
import ElegirPrincipal from './ElegirPrincipal'
import EditarNickname from './EditarNickname'
import TrofeoBadge from '@/components/TrofeoBadge'
import type { TrofeoGrupo } from '@/lib/campeonatos'

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
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
      {restantes > 0 && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>+{restantes}</span>}
    </span>
  )
}

export default function PersonajesYHistorial({
  playerId, personajes, isOwner, personajePrincipalId, trofeosPorPersonaje, historiasPorPersonaje, nicknamesAnterioresPorPersonaje,
}: {
  playerId: string
  personajes: any[]
  isOwner: boolean
  personajePrincipalId: string | null
  trofeosPorPersonaje: Record<string, TrofeoGrupo[]>
  historiasPorPersonaje: Record<string, any[]>
  nicknamesAnterioresPorPersonaje: Record<string, string[]>
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
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>PERSONAJES</span>
          {isOwner && <AgregarPersonaje playerId={playerId} />}
        </div>

        {!personajes.length ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13 }}>Sin personajes registrados.</div>
        ) : personajes.map((p, i) => {
          const rc = REINO_COLOR[p.reino as Reino] ?? 'var(--gold)'
          const tier = getTier(p.mmr)
          const esSeleccionado = p.id === seleccionadoId
          return (
            <div
              key={p.id}
              onClick={() => elegirPersonaje(p.id)}
              title="Ver historial de este personaje"
              style={{
                display: 'grid', gridTemplateColumns: `1fr 90px 90px 90px ${isOwner ? '58px' : '36px'}`,
                padding: '14px 20px',
                borderBottom: i < personajes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                borderLeft: `2px solid ${esSeleccionado ? 'var(--gold)' : 'transparent'}`,
                background: esSeleccionado ? 'rgba(212,175,55,0.05)' : 'transparent',
                alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              {/* Personaje info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${rc}18`, border: `2px solid ${rc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {CLASE_ICON[p.clase]}
                  </div>
                  {SHIELD_SRC[p.reino] && (
                    <img src={SHIELD_SRC[p.reino]} alt={p.reino} width={13} height={13} className={`shield-${p.reino?.toLowerCase()}`} style={{ objectFit: 'contain', position: 'absolute', bottom: -2, right: -4 }} />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.nickname_juego}</span>
                    {p.verificado && <span style={{ fontSize: 11, color: '#2196F3' }} title="Verificado">✓</span>}
                    <TrofeoRow grupos={trofeosPorPersonaje[p.id] ?? []} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: rc }}>{p.reino} · {p.clase}</div>
                  {nicknamesAnterioresPorPersonaje[p.id]?.length > 0 && (
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                      antes: {nicknamesAnterioresPorPersonaje[p.id].join(', ')}
                    </div>
                  )}
                </div>
              </div>
              {/* MMR */}
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{p.mmr}</div>
                <span className={`tier-pill ${tier.cssClass}`} style={{ display: 'inline-flex', marginTop: 2 }}>{tier.icon} {tier.name}</span>
              </div>
              {/* WR */}
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: Number(p.winrate) >= 55 ? '#4CAF50' : 'var(--text-secondary)', fontWeight: 600 }}>{p.winrate}%</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)' }}>{p.partidas_jugadas} PJ</div>
              </div>
              {/* WS */}
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: p.winstreak > 0 ? '#4CAF50' : 'var(--text-muted)' }}>
                {p.winstreak > 0 ? `🔥 ${p.winstreak}` : '—'}
              </div>
              {/* Reclamar / elegir principal + corregir nombre */}
              <div onClick={e => e.stopPropagation()}>
                {isOwner ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ElegirPrincipal playerId={playerId} personajeId={p.id} esPrincipal={personajePrincipalId === p.id} />
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
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>VITRINA DE TROFEOS</span>
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
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center' }}>+{restantes}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {g.trofeo?.nombre ?? (g.puesto === 2 ? 'Subcampeón' : (g.tipoClan ? 'Campeón de clan' : 'Campeón'))}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.4 }}>
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
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>
              HISTORIAL DE ENFRENTAMIENTOS — {seleccionado?.nickname_juego}
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

              const tema = temaTorneo(entry.torneo?.subclases_permitidas)
              const themeColor = tema?.color ?? FORMAT_COLOR[entry.torneo?.formato as keyof typeof FORMAT_COLOR] ?? 'var(--gold)'
              const themeIcon = tema?.icon ?? '🏆'

              // Se agrupan filas consecutivas del mismo torneo bajo un
              // encabezado propio en vez de repetir el nombre en cada
              // fila — así se distingue de un vistazo a qué torneo
              // pertenece cada tanda de partidos.
              const prevTorneoId = i > 0 ? historialVisible[i - 1].torneo?.id : null
              const esNuevoGrupo = entry.torneo?.id !== prevTorneoId

              const content = (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0 7px 12px', borderLeft: `2px solid ${themeColor}55`, marginLeft: 2 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: entry.gano ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)', border: `1px solid ${entry.gano ? '#4CAF50' : '#F44336'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                    {entry.gano ? '✓' : '✗'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rival ? <>vs {rival.nombre}</> : 'Rival desconocido'}
                    </div>
                    {match?.ronda && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{match.ronda}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: entry.delta > 0 ? '#4CAF50' : '#f87171', fontWeight: 700 }}>
                      {entry.delta > 0 ? '+' : ''}{entry.delta}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.mmr_despues} MMR</div>
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
                      <span style={{ fontSize: 12 }}>{themeIcon}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: themeColor, letterSpacing: 0.5 }}>
                        {entry.torneo?.nombre ?? 'Partido'}
                      </span>
                      {entry.torneo?.fecha_inicio && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(entry.torneo.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR')}
                        </span>
                      )}
                      <div style={{ flex: 1, height: 1, background: `${themeColor}33` }} />
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
                className="btn btn-ghost-gold"
                style={{ margin: '10px 0 14px', width: '100%' }}
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
