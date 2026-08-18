'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CAT_EMOJI, STATUS_STYLE, formatPrecio, listingHref } from '@/lib/market/constants'
import { Suspense } from 'react'

const COOLDOWN_MS = 24 * 60 * 60 * 1000

function getBumpLabel(lastBumped: string | null): string {
  if (!lastBumped) return ''
  const diff = Date.now() - new Date(lastBumped).getTime()
  if (diff >= COOLDOWN_MS) return ''
  const hrs = Math.ceil((COOLDOWN_MS - diff) / 3600000)
  return `${hrs}h`
}

function getFeaturedLabel(featuredUntil: string | null, featured: boolean): string {
  if (!featured) return ''
  if (!featuredUntil) return 'Destacado'
  const diff = new Date(featuredUntil).getTime() - Date.now()
  if (diff <= 0) return ''
  const days = Math.ceil(diff / 86400000)
  return `Destacado · ${days}d`
}

function MisListingsInner() {
  const [listings, setListings] = useState<any[]>([])
  const [favCounts, setFavCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [cafStep, setCafStep] = useState<Record<string, 'idle' | 'waiting' | 'sent'>>({})
  const [cafLoading, setCafLoading] = useState<string | null>(null)
  const [premiumCredits, setPremiumCredits] = useState(0)      // pool total restante
  const [weeklyUsed, setWeeklyUsed] = useState(0)             // usados esta semana
  const [isPremium, setIsPremium] = useState(false)
  const [creditLoading, setCreditLoading] = useState<string | null>(null)
  const CAP_SEMANAL = 6
  const POR_PAGINA = 10
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const destacadoStatus = searchParams.get('destacado')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Cargar perfil para premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, premium_until, premium_credits, premium_weekly_used, premium_credits_reset_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        const premiumActivo = profile.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date()
        setIsPremium(premiumActivo)
        if (premiumActivo) {
          // Reset semanal lazy del contador (NO del pool total)
          const resetAt = profile.premium_credits_reset_at ? new Date(profile.premium_credits_reset_at) : null
          const diasSinReset = resetAt ? (Date.now() - resetAt.getTime()) / 86400000 : 999
          let usadosSemana = profile.premium_weekly_used || 0
          if (diasSinReset >= 7) {
            // Nueva semana: resetear solo el contador semanal
            await supabase.from('profiles').update({
              premium_weekly_used: 0,
              premium_credits_reset_at: new Date().toISOString(),
            }).eq('id', user.id)
            usadosSemana = 0
          }
          setPremiumCredits(profile.premium_credits || 0)
          setWeeklyUsed(usadosSemana)
        }
      }

      const { data } = await supabase
        .from('listings')
        .select('*, last_bumped_at, featured_until, contact_clicks')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const listings = data || []
      setListings(listings)

      // Obtener favoritos por listing
      if (listings.length > 0) {
        const ids = listings.map((l: any) => l.id)
        const { data: favs } = await supabase
          .from('favorites')
          .select('listing_id')
          .in('listing_id', ids)

        const counts: Record<string, number> = {}
        for (const f of favs || []) {
          counts[f.listing_id] = (counts[f.listing_id] || 0) + 1
        }
        setFavCounts(counts)
      }
      setLoading(false)
    }
    load()
  }, [])

  const cambiarEstado = async (id: string, status: string) => {
    await supabase.from('listings').update({ status }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  const marcarVendido = async (id: string) => {
    if (!window.confirm('¿Marcar este ítem como vendido/completado?')) return
    await supabase.from('listings').update({ status: 'completed' }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'completed' } : l))
  }

  const duplicar = async (l: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { id: _id, created_at: _c, last_bumped_at: _lb, featured_until: _fu, ...rest } = l
    const { data } = await supabase.from('listings').insert({ ...rest, status: 'active', featured: false }).select('id').single()
    if (data) {
      setListings(prev => [{ ...rest, id: data.id, status: 'active', featured: false, created_at: new Date().toISOString(), last_bumped_at: null }, ...prev])
      alert('Publicación duplicada ✓')
    }
  }

  const renovar = async (id: string) => {
    const res = await fetch('/api/market/bump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: id }),
    })
    const json = await res.json()
    if (json.error === 'cooldown') {
      alert(`Podés renovar en ${json.horasRestantes}h`)
      return
    }
    if (json.ok) {
      const now = new Date().toISOString()
      setListings(prev => prev.map(l => l.id === id ? { ...l, created_at: now, last_bumped_at: now } : l))
      alert('Publicación renovada — volvió al tope de la lista ✓')
    }
  }

  const usarCredito = async (listing_id: string) => {
    if (premiumCredits <= 0) { alert('No te quedan créditos este mes'); return }
    if (weeklyUsed >= CAP_SEMANAL) { alert(`Llegaste al límite de ${CAP_SEMANAL} destacados por semana. Se reinicia el lunes.`); return }
    setCreditLoading(listing_id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreditLoading(null); return }

    const featuredUntil = new Date()
    featuredUntil.setDate(featuredUntil.getDate() + 7)

    const [{ error: listErr }, { error: profErr }] = await Promise.all([
      supabase.from('listings').update({ featured: true, featured_until: featuredUntil.toISOString() }).eq('id', listing_id).eq('user_id', user.id),
      supabase.from('profiles').update({
        premium_credits: premiumCredits - 1,
        premium_weekly_used: weeklyUsed + 1,
      }).eq('id', user.id),
    ])

    if (listErr || profErr) {
      alert('Error al aplicar crédito')
    } else {
      setPremiumCredits(prev => prev - 1)
      setWeeklyUsed(prev => prev + 1)
      setListings(prev => prev.map(l => l.id === listing_id ? { ...l, featured: true, featured_until: featuredUntil.toISOString() } : l))
      alert('¡Ítem destacado por 7 días! ★')
    }
    setCreditLoading(null)
  }

  const iniciarCafecito = async (id: string) => {
    setCafLoading(id)
    const res = await fetch('/api/market/cafecito/solicitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: id }),
    })
    const json = await res.json()
    setCafLoading(null)
    if (!res.ok) { alert(json.error || 'Error al crear la solicitud'); return }
    // Abrir Cafecito y pasar al paso "waiting"
    window.open('https://cafecito.app/lautarey', '_blank')
    setCafStep(prev => ({ ...prev, [id]: 'waiting' }))
  }

  const confirmarPago = (id: string) => {
    setCafStep(prev => ({ ...prev, [id]: 'sent' }))
  }

  const eliminar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return

    const { data: tratoActivo } = await supabase
      .from('transactions')
      .select('id')
      .eq('listing_id', id)
      .is('completed_at', null)
      .limit(1)
      .maybeSingle()

    if (tratoActivo) {
      alert('No podés eliminar este ítem porque tiene un trato pendiente.')
      return
    }

    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
  }

  if (loading) return (
    <div style={{ padding: '24px 20px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ height: 24, width: 180, background: 'var(--dark-card)', borderRadius: 6 }} />
        <div style={{ height: 36, width: 90, background: 'var(--dark-card)', borderRadius: 8 }} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 100, background: 'var(--dark-card)', borderRadius: 10, marginBottom: 12, opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )

  const totalPags = Math.ceil(listings.length / POR_PAGINA)
  const listingsPag = listings.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div style={{ padding: '24px 20px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className="cinzel" style={{ fontSize: 20, color: 'var(--gold)' }}>Mis Publicaciones</h1>
          {isPremium && (
            <span
              title={`${premiumCredits} créditos restantes del mes · ${Math.max(0, CAP_SEMANAL - weeklyUsed)} disponibles esta semana`}
              style={{ fontSize: 11, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', padding: '2px 10px', borderRadius: 12, cursor: 'help' }}>
              🧉 {premiumCredits} créditos · {Math.max(0, CAP_SEMANAL - weeklyUsed)}/sem
            </span>
          )}
        </div>
        <Link href="/market/nuevo" style={{
          background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
          color: 'var(--dark-bg)', padding: '8px 16px', borderRadius: 8,
          fontFamily: "'Cinzel',serif", fontSize: 11, textDecoration: 'none', fontWeight: 700,
        }}>
          + NUEVA
        </Link>
      </div>

      {destacadoStatus === 'ok' && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#22C55E' }}>
          ☕ ¡Tu publicación quedó destacada por 7 días! Gracias por apoyar el marketplace.
        </div>
      )}

      {/* Stats globales */}
      {listings.length > 0 && (() => {
        const activos    = listings.filter(l => l.status === 'active').length
        const totalViews = listings.reduce((s: number, l: any) => s + (l.views || 0), 0)
        const totalFavs  = listings.reduce((s: number, l: any) => s + (favCounts[l.id] || 0), 0)
        const totalClicks = listings.reduce((s: number, l: any) => s + (l.contact_clicks || 0), 0)
        const destacados = listings.filter(l => l.featured && new Date(l.featured_until || 0) > new Date()).length
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'Activos',    val: activos,      color: '#5BC98B' },
              { label: 'Visitas',    val: totalViews,   color: 'var(--gold)' },
              { label: 'Favoritos',  val: totalFavs,    color: '#FB923C' },
              { label: 'Contactos',  val: totalClicks,  color: '#5B9BDF' },
              { label: 'Destacados', val: destacados,   color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
                <div className="cinzel" style={{ fontSize: 18, color: s.color, fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )
      })()}

      {!listings.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚔</div>
          <p className="cinzel" style={{ fontSize: 18, color: 'var(--gold)', marginBottom: 8 }}>Aún no publicaste nada</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, fontStyle: 'italic' }}>
            Publicá un ítem para venderlo o encontrar un comprador
          </p>
          <Link href="/market/nuevo" style={{
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            color: 'var(--dark-bg)', padding: '12px 24px', borderRadius: 8,
            fontFamily: "'Cinzel',serif", fontSize: 12, textDecoration: 'none',
            fontWeight: 700, letterSpacing: 1,
          }}>
            + PUBLICAR ÍTEM
          </Link>
        </div>
      ) : (
        <>
          {listingsPag.map(l => {
            const s = STATUS_STYLE[l.status] || STATUS_STYLE.active
            const featuredLabel = getFeaturedLabel(l.featured_until, l.featured)
            const isFeaturedActive = l.featured && new Date(l.featured_until || 0) > new Date()
            return (
              <div key={l.id} style={{
                background: 'var(--dark-card)',
                border: `1px solid ${isFeaturedActive ? 'rgba(245,158,11,0.4)' : 'var(--dark-border)'}`,
                borderRadius: 10, padding: 16, marginBottom: 12,
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 52, height: 52, background: 'var(--dark-surface)', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
                  }}>
                    {l.item_image_url
                      ? <img src={l.item_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                      : (CAT_EMOJI[l.item_category] || '📦')
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <Link href={listingHref(l.item_name, l.id, l.short_id)} className="cinzel" style={{ fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isFeaturedActive && <span style={{ color: '#F59E0B', marginRight: 6 }}>★</span>}
                        {l.item_name}
                      </Link>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontFamily: "'Cinzel',serif", flexShrink: 0, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--gold)', margin: '3px 0' }}>
                      {formatPrecio(l.price_gold, l.price_money, l.currency_label)}
                    </div>

                    {/* Analytics row */}
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 8px', flexWrap: 'wrap' }}>
                      <span title="Visitas">👁 {l.views || 0}</span>
                      <span title="Favoritos">♡ {favCounts[l.id] || 0}</span>
                      <span title="Clicks en contactar">📲 {l.contact_clicks || 0}</span>
                      {isFeaturedActive && (
                        <span style={{ color: '#F59E0B' }}>★ {featuredLabel}</span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {l.status !== 'completed' && (
                        <Link href={`/market/mis-listings/${l.id}/editar`} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(201,168,76,0.4)', background: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' }}>
                          ✏ Editar
                        </Link>
                      )}
                      {(l.status === 'active' || l.status === 'reserved') && (() => {
                        const cooldown = getBumpLabel(l.last_bumped_at)
                        return (
                          <button
                            onClick={() => renovar(l.id)}
                            disabled={!!cooldown}
                            title={cooldown ? `Disponible en ${cooldown}` : 'Mover al tope de la lista'}
                            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(91,155,223,0.4)', background: 'none', color: cooldown ? 'var(--text-muted)' : '#5B9BDF', cursor: cooldown ? 'default' : 'pointer', fontFamily: 'inherit', opacity: cooldown ? 0.5 : 1 }}>
                            {cooldown ? `⏱ ${cooldown}` : '↑ Renovar'}
                          </button>
                        )
                      })()}
                      {l.status === 'active' && (
                        <button onClick={() => cambiarEstado(l.id, 'reserved')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--dark-border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Reservar
                        </button>
                      )}
                      {l.status === 'reserved' && (
                        <button onClick={() => cambiarEstado(l.id, 'active')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--dark-border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Activar
                        </button>
                      )}
                      {(l.status === 'active' || l.status === 'reserved') && (
                        <button onClick={() => marcarVendido(l.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(91,201,139,0.3)', background: 'none', color: '#5BC98B', cursor: 'pointer', fontFamily: 'inherit' }}>
                          ✓ Vendido
                        </button>
                      )}
                      {/* Flujo Cafecito / Crédito Premium */}
                      {l.status === 'active' && !isFeaturedActive && (() => {
                        // Si es premium → mostrar botón de crédito (aunque esté en cap semanal)
                        if (isPremium) {
                          const sinCreditos = premiumCredits <= 0
                          const capAlcanzado = weeklyUsed >= CAP_SEMANAL
                          const bloqueado = sinCreditos || capAlcanzado
                          return (
                            <button
                              onClick={() => usarCredito(l.id)}
                              disabled={creditLoading === l.id || bloqueado}
                              title={
                                sinCreditos ? 'Sin créditos restantes este mes'
                                : capAlcanzado ? `Límite semanal alcanzado (${CAP_SEMANAL}/${CAP_SEMANAL}). Se reinicia el lunes`
                                : `${premiumCredits} créditos restantes · ${CAP_SEMANAL - weeklyUsed} disponibles esta semana`
                              }
                              style={{
                                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                                border: `1px solid ${bloqueado ? 'var(--dark-border)' : 'rgba(245,158,11,0.7)'}`,
                                background: bloqueado ? 'none' : 'rgba(245,158,11,0.15)',
                                color: bloqueado ? 'var(--text-muted)' : '#F59E0B',
                                cursor: (creditLoading === l.id || bloqueado) ? 'default' : 'pointer',
                                fontFamily: "'Cinzel',serif", fontWeight: 700,
                                opacity: creditLoading === l.id ? 0.6 : 1,
                              }}>
                              {creditLoading === l.id ? '...'
                                : capAlcanzado ? `★ Cap semanal (${CAP_SEMANAL}/${CAP_SEMANAL})`
                                : sinCreditos ? '★ Sin créditos'
                                : `★ Destacar · ${CAP_SEMANAL - weeklyUsed} esta sem.`}
                            </button>
                          )
                        }

                        const step = cafStep[l.id] || 'idle'
                        if (step === 'idle') return (
                          <button
                            onClick={() => iniciarCafecito(l.id)}
                            disabled={cafLoading === l.id}
                            title="Destacar en el carrusel por 7 días · $500 ARS"
                            style={{
                              fontSize: 11, padding: '4px 10px', borderRadius: 6,
                              border: '1px solid rgba(245,158,11,0.5)',
                              background: 'rgba(245,158,11,0.08)', color: '#F59E0B',
                              cursor: cafLoading === l.id ? 'default' : 'pointer',
                              fontFamily: 'inherit', opacity: cafLoading === l.id ? 0.6 : 1,
                            }}>
                            {cafLoading === l.id ? '...' : '☕ Destacar · $500'}
                          </button>
                        )
                        if (step === 'waiting') return (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              ¿Ya pagaste el cafecito?
                            </span>
                            <button
                              onClick={() => confirmarPago(l.id)}
                              style={{
                                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                                border: '1px solid rgba(91,201,139,0.4)',
                                background: 'rgba(91,201,139,0.08)', color: '#5BC98B',
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}>
                              ✓ Ya pagué
                            </button>
                          </div>
                        )
                        if (step === 'sent') return (
                          <span style={{ fontSize: 11, color: '#F59E0B' }}>
                            ☕ Solicitud enviada · en revisión
                          </span>
                        )
                      })()}
                      <button onClick={() => duplicar(l)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--dark-border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        ⧉ Duplicar
                      </button>
                      {l.status !== 'completed' && (
                        <button onClick={() => eliminar(l.id, l.item_name)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(226,75,74,0.3)', background: 'none', color: '#E24B4A', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {totalPags > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} style={{
                padding: '6px 14px', borderRadius: 6, cursor: pagina === 1 ? 'default' : 'pointer',
                background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
                color: pagina === 1 ? 'var(--dark-border)' : 'var(--text-muted)', fontFamily: 'inherit', fontSize: 12,
              }}>← Anterior</button>
              <span style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                {pagina} / {totalPags}
              </span>
              <button onClick={() => setPagina(p => Math.min(totalPags, p + 1))} disabled={pagina === totalPags} style={{
                padding: '6px 14px', borderRadius: 6, cursor: pagina === totalPags ? 'default' : 'pointer',
                background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
                color: pagina === totalPags ? 'var(--dark-border)' : 'var(--text-muted)', fontFamily: 'inherit', fontSize: 12,
              }}>Siguiente →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function MisListingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px 20px', maxWidth: 700, margin: '0 auto' }}><div style={{ height: 200, background: 'var(--dark-card)', borderRadius: 12 }} /></div>}>
      <MisListingsInner />
    </Suspense>
  )
}
