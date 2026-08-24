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

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
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
      torneo:tournaments(id, nombre, formato, fecha_inicio, imagen_url, creator_id, trofeo:trofeos(nombre, icono, color))
    `)
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
          <div style={{ fontSize: 36, marginBottom: 8, filter: 'drop-shadow(0 0 14px rgba(212,175,55,0.35))' }}>🏆</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: 'var(--gold)', letterSpacing: 1.5 }}>
            Salón de la Fama
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Los campeones de cada torneo, para siempre en la historia de CoR.
          </p>
          <div style={{ width: 64, height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', margin: '20px auto 0' }} />
        </div>

        {filas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13, border: '1px dashed rgba(212,175,55,0.2)', borderRadius: 16 }}>
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
                    background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 18,
                    overflow: 'hidden', boxShadow: '0 12px 32px -16px rgba(0,0,0,0.6)',
                  }}
                >
                  {/* ── Portada del torneo ─────────────────────── */}
                  <div style={{
                    height: 176, position: 'relative', overflow: 'hidden',
                    background: torneo.imagen_url
                      ? `url(${torneo.imagen_url}) center/cover`
                      : 'radial-gradient(120% 140% at 15% 0%, #241c08 0%, #120e04 45%, #0a0a0a 100%)',
                  }}>
                    {/* Marca de agua cuando todavía no hay foto propia: se ve
                        intencional, no como un espacio vacío/roto. */}
                    {!torneo.imagen_url && (
                      <div style={{
                        position: 'absolute', right: -18, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 150, lineHeight: 1, opacity: 0.06, pointerEvents: 'none', userSelect: 'none',
                      }}>
                        🏆
                      </div>
                    )}

                    {/* Degradé para legibilidad del texto sobre cualquier foto */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)' }} />

                    {/* Badge de formato */}
                    <div style={{
                      position: 'absolute', top: 14, left: 16, zIndex: 1,
                      background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)',
                      borderRadius: 20, padding: '3px 11px', fontFamily: 'var(--font-display)',
                      fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1,
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
                          fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, color: '#fff',
                          textShadow: '0 2px 8px rgba(0,0,0,0.5)', lineHeight: 1.25,
                        }}>
                          {torneo.nombre}
                        </h2>
                      </Link>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                        {fechaLarga}
                      </div>
                    </div>
                  </div>

                  {/* ── Campeones ──────────────────────────────── */}
                  <div style={{ padding: '20px 20px 22px', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {campeones.map((c: any) => {
                      const p = c.personaje
                      if (!p) return null
                      const esClan = c.tipo === 'equipo'
                      const rc = esClan ? '#5b8fd4' : (REINO_COLOR[p.reino as Reino] ?? 'var(--gold)')
                      return (
                        <Link
                          key={c.id}
                          href={`/jugadores/${c.player_id}`}
                          style={{
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                            background: esClan
                              ? 'linear-gradient(135deg, rgba(91,143,212,0.08), rgba(91,143,212,0.02))'
                              : 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))',
                            border: `1px solid ${esClan ? 'rgba(91,143,212,0.28)' : 'rgba(212,175,55,0.22)'}`,
                            borderRadius: 12,
                            padding: '10px 18px 10px 10px', minWidth: 190, flex: '1 1 190px',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                              width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
                              background: `${rc}18`, border: `2px solid ${rc}88`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                            }}>
                              {c.foto_url
                                ? <img src={c.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : CLASE_ICON[p.clase] ?? '🏅'}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: esClan ? '#5b8fd4' : (c.torneo.trofeo?.color ?? 'var(--gold)'), fontFamily: 'var(--font-display)', letterSpacing: 1.2, opacity: 0.9 }}>
                              <TrofeoBadge trofeo={c.torneo.trofeo} tipoClan={esClan} size="xs" />
                              {c.torneo.trofeo?.nombre ?? (esClan ? `CLAN CAMPEÓN — ${c.equipo_nombre}` : 'CAMPEÓN')}
                              {c.torneo.trofeo && esClan && ` — ${c.equipo_nombre}`}
                            </div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.nickname_juego}
                            </div>
                            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: rc }}>{p.clase}</div>
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
    </>
  )
}
