import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { REINO_COLOR } from '@/lib/constants'
import type { Reino } from '@/lib/types'
import { canAdmin } from '@/lib/roles'
import SubirFoto from './SubirFoto'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Salón de la Fama' }

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}

export default async function SalonDeLaFamaPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user ? await supabase.from('players').select('id, role').eq('user_id', user.id).single() : { data: null }

  const { data: campeonatos } = await supabase
    .from('campeonatos')
    .select(`
      id, foto_url, personaje_id, player_id,
      personaje:personajes(id, nickname_juego, reino, clase),
      torneo:tournaments(id, nombre, formato, fecha_inicio, imagen_url, creator_id)
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
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 4 }}>🏆</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--gold)', letterSpacing: 1 }}>
            Salón de la Fama
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            Los campeones de cada torneo, para siempre en la historia de CoR.
          </p>
        </div>

        {filas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Todavía no hay campeones registrados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {filas.map(({ torneo, campeones }) => {
              const puedeEditar = !!me && (me.id === torneo.creator_id || canAdmin(me.role))
              return (
                <div key={torneo.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Foto de portada del torneo */}
                  <div style={{
                    height: 140, position: 'relative',
                    background: torneo.imagen_url ? `url(${torneo.imagen_url}) center/cover` : 'linear-gradient(135deg, #171206, #0c0c0c)',
                    display: 'flex', alignItems: 'flex-end', padding: 16,
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.75), rgba(0,0,0,0.15))' }} />
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                      <div>
                        <Link href={`/brackets/${torneo.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: '#fff' }}>{torneo.nombre}</div>
                        </Link>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                          {torneo.fecha_inicio ? new Date(torneo.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} · {torneo.formato}
                        </div>
                      </div>
                      {puedeEditar && <SubirFoto tabla="tournaments" id={torneo.id} campo="imagen_url" label="Foto del torneo" />}
                    </div>
                  </div>

                  {/* Campeones */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                    {campeones.map((c: any) => {
                      const p = c.personaje
                      if (!p) return null
                      const rc = REINO_COLOR[p.reino as Reino] ?? 'var(--gold)'
                      return (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, padding: '8px 14px 8px 8px' }}>
                          <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: `${rc}18`, border: `2px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {c.foto_url ? <img src={c.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : CLASE_ICON[p.clase]}
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>🏆 CAMPEÓN</div>
                            <Link href={`/jugadores/${c.player_id}`} style={{ textDecoration: 'none' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.nickname_juego}</div>
                            </Link>
                            {puedeEditar && <div style={{ marginTop: 4 }}><SubirFoto tabla="campeonatos" id={c.id} campo="foto_url" label="Foto" /></div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
