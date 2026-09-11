import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { REINO_COLOR } from '@/lib/constants'
import type { Reino } from '@/lib/types'
import { canAdmin } from '@/lib/roles'
import SubirFoto from './SubirFoto'
import TrofeoBadge from '@/components/TrofeoBadge'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Salón de la Fama' }

// Mismos paths que CLASE_SVG en RankingContent.tsx — mismas 6 clases,
// mismo ícono, para consistencia entre Ranking y Salón de la Fama.
const CLASE_ICON_PATH: Record<string, string> = {
  Bárbaro:    'M14.5 17.5L3 6V3h3l11.5 11.5',
  Caballero:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  Conjurador: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2',
  Brujo:      'M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83',
  Tirador:    'M5 12h14M12 5l7 7-7 7',
  Cazador:    'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14M6.5 17.5c-.66.568-1 1.347-1 2.5h11c0-1.153-.34-1.932-1-2.5',
}
function ClaseIcon({ clase, size = 22 }: { clase: string; size?: number }) {
  if (clase === 'Brujo') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" /><path d={CLASE_ICON_PATH.Brujo} />
      </svg>
    )
  }
  if (clase === 'Conjurador') {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points={CLASE_ICON_PATH.Conjurador} /></svg>
  }
  const d = CLASE_ICON_PATH[clase]
  if (!d) return <IconMedalLine size={size} />
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={d} /></svg>
}
function IconTrophy({ size = 32, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" strokeLinecap="round" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" strokeLinecap="round" />
      <path d="M4 22h16" strokeLinecap="round" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" strokeLinecap="round" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" strokeLinecap="round" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" strokeLinejoin="round" />
    </svg>
  )
}
function IconMedalLine({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="15" r="6" /><path d="M8.5 9L6 3M15.5 9L18 3M6 3h3M18 3h-3" strokeLinecap="round" />
    </svg>
  )
}

const SHIELD_SRC: Record<string, string> = {
  Syrtis: '/shield-syrtis.png', Ignis: '/shield-ignis.png', Alsius: '/shield-alsius.png',
}

export default async function SalonDeLaFamaPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user ? await supabase.from('players').select('id, role').eq('user_id', user.id).single() : { data: null }

  const { data: campeonatos } = await supabase
    .from('campeonatos')
    .select(`
      id, foto_url, personaje_id, player_id, tipo, equipo_nombre,
      personaje:personajes(id, nickname_juego, reino, clase),
      torneo:tournaments(id, nombre, formato, fecha_inicio, imagen_url, creator_id, trofeo:trofeos!tournaments_trofeo_id_fkey(nombre, icono, color, forma))
    `)
    .eq('puesto', 1)
    .order('created_at', { ascending: false })

  const torneos = new Map<string, { torneo: any; campeones: any[] }>()
  campeonatos?.forEach((c: any) => {
    if (!c.torneo) return
    if (!torneos.has(c.torneo.id)) torneos.set(c.torneo.id, { torneo: c.torneo, campeones: [] })
    torneos.get(c.torneo.id)!.campeones.push(c)
  })
  const filas = [...torneos.values()].sort((a, b) => (b.torneo.fecha_inicio ?? '').localeCompare(a.torneo.fecha_inicio ?? ''))

  return (
    <>
      <Header />
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 64px' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <IconTrophy size={34} style={{ color: 'var(--gold)', marginBottom: 10 }} />
          <h1 style={{ fontFamily: 'var(--font-display-v2)', fontSize: 32, fontWeight: 600, color: 'var(--gold)', margin: 0 }}>
            Salón de la Fama
          </h1>
          <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Los campeones de cada torneo, para siempre en la historia de CoR.
          </p>
          <div style={{ width: 64, height: 1, background: 'var(--gold)', margin: '20px auto 0' }} />
        </div>

        {filas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)', fontSize: 15, border: '1px dashed var(--border)' }}>
            Todavía no hay campeones registrados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {filas.map(({ torneo, campeones }) => {
              const puedeEditar = !!me && (me.id === torneo.creator_id || canAdmin(me.role))
              const fechaLarga = torneo.fecha_inicio
                ? new Date(torneo.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
                : ''

              return (
                <article
                  key={torneo.id}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  {/* ── Portada del torneo ─────────────────────── */}
                  <div style={{
                    height: 176, position: 'relative', overflow: 'hidden',
                    background: torneo.imagen_url
                      ? `url(${torneo.imagen_url}) center/cover`
                      : 'var(--trophy-fallback-bg)',
                    clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
                  }}>
                    {/* Marca de agua cuando todavía no hay foto propia: se ve
                        intencional, no como un espacio vacío/roto. */}
                    {!torneo.imagen_url && (
                      <IconTrophy size={160} style={{
                        position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--gold)', opacity: 0.06, pointerEvents: 'none',
                      }} />
                    )}

                    {/* Degradé para legibilidad del texto sobre cualquier foto */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)' }} />

                    {/* Badge de formato */}
                    <div style={{
                      position: 'absolute', top: 14, left: 16, zIndex: 1,
                      background: 'rgba(10,10,10,0.7)', border: '1px solid color-mix(in srgb, var(--gold) 45%, transparent)',
                      padding: '3px 10px', fontFamily: 'var(--font-mono)',
                      fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>
                      {torneo.formato}
                    </div>

                    {puedeEditar && (
                      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                        <SubirFoto tabla="tournaments" id={torneo.id} campo="imagen_url" label="Cambiar foto del torneo" variant="icon" aspectRatio={4.5} />
                      </div>
                    )}

                    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16, zIndex: 1 }}>
                      <Link href={`/brackets/${torneo.id}`} style={{ textDecoration: 'none' }}>
                        <h2 style={{
                          fontFamily: 'var(--font-display-v2)', fontSize: 22, fontWeight: 600, color: '#fff',
                          textShadow: '0 2px 8px rgba(0,0,0,0.5)', lineHeight: 1.25, margin: 0,
                        }}>
                          {torneo.nombre}
                        </h2>
                      </Link>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 5, letterSpacing: '0.04em' }}>
                        {fechaLarga}
                      </div>
                    </div>
                  </div>

                  {/* ── Campeones ──────────────────────────────── */}
                  <div style={{ padding: '20px 20px 22px', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {campeones.map((c: any) => {
                      const p = c.personaje
                      if (!p) return null
                      // "equipo" (2v2/3v3/7v7) vs "clan" — solo 7v7 es de
                      // clan; un 2v2 sigue siendo "equipo" para mostrar el
                      // nombre del compañero, pero no lleva la etiqueta ni
                      // el color de clan.
                      const esEquipo = c.tipo === 'equipo'
                      const esClan = esEquipo && c.torneo.formato === '7v7'
                      const rc = esClan ? 'var(--clan)' : (REINO_COLOR[p.reino as Reino] ?? 'var(--gold)')
                      return (
                        <Link
                          key={c.id}
                          href={`/jugadores/${c.player_id}`}
                          style={{
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                            background: 'var(--bg-surface)',
                            border: `1px solid color-mix(in srgb, ${rc} 30%, transparent)`,
                            borderTop: `2px solid ${rc}`,
                            padding: '10px 18px 10px 10px', minWidth: 190, flex: '1 1 190px',
                            transition: 'border-color 0.15s',
                          }}
                        >
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                              width: 56, height: 56, overflow: 'hidden',
                              background: `color-mix(in srgb, ${rc} 9%, transparent)`, border: `2px solid color-mix(in srgb, ${rc} 53%, transparent)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: rc,
                            }}>
                              {c.foto_url
                                ? <img src={c.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <ClaseIcon clase={p.clase} size={24} />}
                            </div>
                            {SHIELD_SRC[p.reino] && (
                              <img src={SHIELD_SRC[p.reino]} alt={p.reino} width={16} height={16} className={`shield-${p.reino?.toLowerCase()}`} style={{ objectFit: 'contain', position: 'absolute', bottom: -4, right: -6 }} />
                            )}
                            {puedeEditar && (
                              <div style={{ position: 'absolute', bottom: -6, left: -6, zIndex: 2 }}>
                                <SubirFoto tabla="campeonatos" id={c.id} campo="foto_url" label="Cambiar foto del campeón" variant="icon" />
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: esClan ? 'var(--clan)' : (c.torneo.trofeo?.color ?? 'var(--gold)'), fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>
                              <TrofeoBadge trofeo={c.torneo.trofeo} tipoClan={esClan} size="xs" />
                              {c.torneo.trofeo?.nombre ?? (esClan ? `CLAN CAMPEÓN — ${c.equipo_nombre}` : esEquipo ? `CAMPEÓN — ${c.equipo_nombre}` : 'CAMPEÓN')}
                              {c.torneo.trofeo && esEquipo && ` — ${c.equipo_nombre}`}
                            </div>
                            <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.nickname_juego}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: rc }}>{p.clase}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 40 }}>
        CoR Tournament Stats © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}
