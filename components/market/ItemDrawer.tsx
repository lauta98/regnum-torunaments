'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { RAREZA_COLOR, RAREZA_LABEL, CLASE_LABEL, listingHref, formatMag, formatSlot } from '@/lib/market/constants'
import { getItemIconColored } from '@/lib/market/icons'

const GREY_CATS = new Set(['joyeria', 'crafting', 'minerales'])

const BADGE = {
  sell: { bg: 'rgba(26,92,46,0.92)', border: '#2d9b4e', color: '#6EE89A', label: 'VENDE' },
  buy:  { bg: 'rgba(15,52,96,0.92)', border: '#1e6db5', color: '#7DC4FF', label: 'BUSCA' },
}

// 1-5 score labels & colors (same as calificar/page)
const SCORE_LABEL = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']
const SCORE_COLOR = ['', '#E24B4A', '#E2744A', '#C9A84C', '#7DC4FF', '#5BC98B']

function Stars({ score }: { score: number }) {
  return (
    <span style={{ letterSpacing: 1 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= score ? SCORE_COLOR[score] : 'rgba(255,255,255,0.15)', fontSize: 11 }}>★</span>
      ))}
    </span>
  )
}

function getLastSeen(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (min < 2)  return 'Activo ahora'
  if (min < 60) return `Hace ${min} min`
  if (hrs < 24) return `Hace ${hrs}h`
  if (days < 7) return `Hace ${days}d`
  return `Hace ${Math.floor(days / 7)} sem`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 30)  return `hace ${days}d`
  if (days < 365) return `hace ${Math.floor(days / 30)}m`
  return `hace ${Math.floor(days / 365)}a`
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Esc o clic para cerrar</span>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>✕</div>
      </div>
      <img src={src} alt={alt} onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 24px 80px rgba(0,0,0,0.8)', animation: 'lbZoomIn 0.2s cubic-bezier(0.32,0.72,0,1)', cursor: 'default' }} />
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface Props { listing: any | null; onClose: () => void }

export default function ItemDrawer({ listing, onClose }: Props) {
  const [lightboxSrc, setLightboxSrc]   = useState<string | null>(null)
  const [imgIdx, setImgIdx]             = useState(0)
  const [imgHover, setImgHover]         = useState(false)
  const [recentReviews, setRecentReviews] = useState<any[]>([])

  const supabase = useMemo(() => createClient(), [])

  // All hooks before early return
  useEffect(() => { setImgIdx(0); setRecentReviews([]) }, [listing?.id])

  useEffect(() => {
    if (!listing) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [listing])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lightboxSrc) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, lightboxSrc])

  // Fetch last 3 reviews for this seller
  useEffect(() => {
    const sellerId = listing?.user_id
    if (!sellerId) return
    supabase
      .from('reviews')
      .select('score, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(username)')
      .eq('reviewed_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setRecentReviews(data) })
  }, [listing?.user_id, supabase])

  const allImages: string[] = []
  if (listing?.item_image_url) allImages.push(listing.item_image_url)
  if (Array.isArray(listing?.image_urls)) allImages.push(...(listing.image_urls as string[]).filter(Boolean))
  const totalImages = allImages.length

  const prevImg = useCallback(
    () => setImgIdx(i => (i - 1 + Math.max(1, totalImages)) % Math.max(1, totalImages)),
    [totalImages],
  )
  const nextImg = useCallback(
    () => setImgIdx(i => (i + 1) % Math.max(1, totalImages)),
    [totalImages],
  )

  if (!listing) return null

  // ── Derived values ────────────────────────────────────────────────
  const rareza      = listing.rareza
  const rarezaColor = rareza ? RAREZA_COLOR[rareza] : null
  const accentColor = rarezaColor || 'var(--gold)'
  const emojiColor  = GREY_CATS.has(listing.item_category) ? '#7A8A9A' : (rarezaColor || '#B8A157')
  const badge       = listing.type === 'sell' ? BADGE.sell : BADGE.buy
  const lastSeen    = getLastSeen(listing.profiles?.last_sign_in_at || null)
  const isActive    = lastSeen === 'Activo ahora'
  const hasImages   = totalImages > 0
  const currentImg  = allImages[imgIdx] ?? null
  const hasPrice    = listing.price_gold || listing.price_money
  const rating      = listing.profiles?.avg_rating ?? 0
  const reviewCount = listing.profiles?.total_reviews ?? 0
  const isTrusted   = rating >= 4.5 && reviewCount >= 3
  const servidor    = listing.servidor

  const mods: string[] = []
  for (let i = 1; i <= 5; i++) if (listing[`slot_${i}`]) mods.push(listing[`slot_${i}`])

  const metaChips = [
    listing.subcategoria,
    listing.clase_requerida && listing.clase_requerida !== 'todas' ? CLASE_LABEL[listing.clase_requerida] : null,
    listing.material,
  ].filter(Boolean)

  let iconSvg = ''
  try { iconSvg = getItemIconColored(listing.subcategoria || '', listing.item_category, emojiColor) } catch {}

  const href = listingHref(listing.item_name, listing.id, listing.short_id)

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt={listing.item_name} onClose={() => setLightboxSrc(null)} />}

      {/* ── Overlay ─────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          animation: 'modalFadeIn 0.2s ease',
        }}
      >
        {/* ── Modal panel ─────────────────────────────────────────── */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 'min(900px, 100%)',
            height: 'min(600px, 90vh)',
            background: 'var(--dark-card)',
            borderRadius: 14,
            border: `1px solid ${rarezaColor ? rarezaColor + '44' : 'var(--dark-border-gold)'}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'modalZoomIn 0.22s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: `0 32px 80px rgba(0,0,0,0.85)${rarezaColor ? `, 0 0 50px ${rarezaColor}16` : ''}`,
          }}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px',
            borderBottom: `1px solid var(--dark-border)`,
            flexShrink: 0,
            background: 'var(--dark-surface)',
          }}>
            <span style={{ padding: '3px 9px', borderRadius: 4, fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
              {badge.label}
            </span>
            {rareza && rareza !== 'normal' && (
              <span style={{ padding: '3px 9px', borderRadius: 4, fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, fontWeight: 700, background: `${rarezaColor}22`, color: rarezaColor!, border: `1px solid ${rarezaColor}55` }}>
                {RAREZA_LABEL[rareza]}
              </span>
            )}
            {listing.is_set && (
              <span style={{ padding: '3px 9px', borderRadius: 4, fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, fontWeight: 700, color: 'var(--gold)', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>SET</span>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {listing.item_category}{listing.subcategoria ? ` · ${listing.subcategoria}` : ''}
            </span>
            <button
              onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--dark-bg)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--dark-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
            >✕</button>
          </div>

          {/* ── Two-column body ─────────────────────────────────────── */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

            {/* ── LEFT: Image panel ─────────────────────────────────── */}
            <div style={{
              width: '42%', flexShrink: 0,
              borderRight: `1px solid var(--dark-border)`,
              display: 'flex', flexDirection: 'column',
              background: hasImages ? 'var(--dark-bg)' : `radial-gradient(ellipse at 50% 55%, ${emojiColor}18 0%, transparent 70%), var(--dark-bg)`,
            }}>
              {/* Main image */}
              <div
                style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: hasImages ? 'zoom-in' : 'default', minHeight: 0 }}
                onMouseEnter={() => setImgHover(true)}
                onMouseLeave={() => setImgHover(false)}
                onClick={() => currentImg && setLightboxSrc(currentImg)}
              >
                {rarezaColor && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 100%, ${rarezaColor}18 0%, transparent 65%)` }} />
                )}
                {currentImg ? (
                  <img src={currentImg} alt={listing.item_name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8, position: 'relative', zIndex: 1, transition: 'transform 0.3s ease', transform: imgHover ? 'scale(1.04)' : 'scale(1)' }} />
                ) : iconSvg ? (
                  <div suppressHydrationWarning style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 32px ${emojiColor}88)` }} dangerouslySetInnerHTML={{ __html: iconSvg }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 80, opacity: 0.2 }}>📦</span>
                  </div>
                )}

                {/* Carousel arrows */}
                {totalImages > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); prevImg() }} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 30, height: 30, borderRadius: '50%', border: `1px solid var(--dark-border)`, background: 'var(--dark-surface)', color: 'var(--text-primary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: imgHover ? 1 : 0, transition: 'opacity 0.2s' }}>‹</button>
                    <button onClick={e => { e.stopPropagation(); nextImg() }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 30, height: 30, borderRadius: '50%', border: `1px solid var(--dark-border)`, background: 'var(--dark-surface)', color: 'var(--text-primary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: imgHover ? 1 : 0, transition: 'opacity 0.2s' }}>›</button>
                    <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: 5 }}>
                      {allImages.map((_, i) => (
                        <div key={i} onClick={e => { e.stopPropagation(); setImgIdx(i) }} style={{ width: i === imgIdx ? 14 : 5, height: 5, borderRadius: 3, background: i === imgIdx ? (rarezaColor || 'var(--gold)') : 'rgba(255,255,255,0.25)', transition: 'all 0.2s', cursor: 'pointer' }} />
                      ))}
                    </div>
                  </>
                )}

                {/* Zoom hint */}
                {hasImages && (
                  <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 3, display: 'flex', alignItems: 'center', gap: 4, background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 5, padding: '3px 7px', opacity: imgHover ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/></svg>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ampliar</span>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {totalImages > 1 && (
                <div style={{ display: 'flex', gap: 5, padding: '7px 8px', borderTop: `1px solid var(--dark-border)`, background: 'var(--dark-surface)', flexShrink: 0, overflowX: 'auto' }}>
                  {allImages.map((src, i) => (
                    <button key={i} onClick={() => setImgIdx(i)} style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 6, overflow: 'hidden', border: `2px solid ${i === imgIdx ? (rarezaColor || 'var(--gold)') : 'var(--dark-border)'}`, background: 'var(--dark-bg)', cursor: 'pointer', padding: 0, transition: 'all 0.15s', opacity: i === imgIdx ? 1 : 0.5 }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Info panel ─────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

              {/* Name + Price */}
              <div style={{ padding: '14px 18px 11px', borderBottom: `1px solid var(--dark-border)`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <h2 className="cinzel" style={{ fontSize: 18, color: rarezaColor || 'var(--gold)', margin: 0, lineHeight: 1.25, flex: 1, minWidth: 0, wordBreak: 'break-word', textShadow: rarezaColor ? `0 0 20px ${rarezaColor}44` : undefined }}>
                    {listing.item_name}
                  </h2>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {listing.price_gold ? (
                      <div style={{ fontSize: 20, color: 'var(--gold)', fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
                        🪨 {formatMag(parseInt(listing.price_gold))}
                      </div>
                    ) : null}
                    {listing.price_money ? (
                      <div style={{ fontSize: 14, color: '#9DC4E8', fontWeight: 600, lineHeight: 1.3, marginTop: 2 }}>
                        $ {parseFloat(listing.price_money).toLocaleString('es-AR')}
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>{listing.currency_label || 'ARS'}</span>
                      </div>
                    ) : null}
                    {!hasPrice && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>A convenir</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {metaChips.map((m, i) => (
                    <span key={i} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--dark-surface)', borderRadius: 4, padding: '2px 7px', border: '1px solid var(--dark-border)' }}>{m as string}</span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              {(listing.dano_min_1 || listing.armadura_base || listing.velocidad) && (
                <div style={{ display: 'flex', borderBottom: `1px solid var(--dark-border)`, flexShrink: 0, background: 'var(--dark-surface)' }}>
                  {listing.dano_min_1 && (
                    <div style={{ flex: 1, padding: '10px 18px', textAlign: 'center', borderRight: (listing.armadura_base || listing.velocidad) ? `1px solid var(--dark-border)` : undefined }}>
                      <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 4, fontFamily: "'Cinzel',serif" }}>DAÑO</div>
                      <div style={{ fontSize: 16, color: '#fca5a5', fontWeight: 700, fontFamily: 'monospace' }}>{listing.dano_min_1}–{listing.dano_max_1}</div>
                      {listing.bonus_xx && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>+{listing.bonus_xx} bonus</div>}
                    </div>
                  )}
                  {listing.armadura_base && (
                    <div style={{ flex: 1, padding: '10px 18px', textAlign: 'center', borderRight: listing.velocidad ? `1px solid var(--dark-border)` : undefined }}>
                      <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 4, fontFamily: "'Cinzel',serif" }}>ARMADURA</div>
                      <div style={{ fontSize: 16, color: '#7dd3fc', fontWeight: 700, fontFamily: 'monospace' }}>{listing.armadura_base}</div>
                      {listing.armadura_bonus && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>+{listing.armadura_bonus} bonus</div>}
                    </div>
                  )}
                  {listing.velocidad && (
                    <div style={{ flex: 1, padding: '10px 18px', textAlign: 'center' }}>
                      <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 4, fontFamily: "'Cinzel',serif" }}>VELOCIDAD</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{listing.velocidad}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Modificadores */}
              {mods.length > 0 && (
                <div style={{ padding: '11px 18px', borderBottom: `1px solid var(--dark-border)`, flexShrink: 0 }}>
                  <div style={{ fontSize: 8, fontFamily: "'Cinzel',serif", letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 8 }}>MODIFICADORES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {mods.map((mod, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, background: 'rgba(91,201,139,0.12)', border: '1px solid rgba(91,201,139,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#5BC98B' }}>+</div>
                        <span style={{ fontSize: 12, color: '#5BC98B', lineHeight: 1.3 }}>{formatSlot(mod)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción */}
              {listing.description && (
                <div style={{ padding: '9px 18px', borderBottom: `1px solid var(--dark-border)`, flexShrink: 0 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.55, margin: 0 }}>
                    &quot;{listing.description}&quot;
                  </p>
                </div>
              )}

              {/* ── Vendedor ──────────────────────────────────────────── */}
              <div style={{ padding: '11px 18px', borderBottom: `1px solid var(--dark-border)`, flexShrink: 0, background: 'var(--dark-surface)' }}>
                <div style={{ fontSize: 8, fontFamily: "'Cinzel',serif", letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 9 }}>ANUNCIANTE</div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'var(--burgundy)', border: '2px solid var(--dark-border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel',serif", fontSize: 15, color: 'var(--gold-light)', fontWeight: 700 }}>
                    {(listing.profiles?.username || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Row 1: name + rating */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>
                        {listing.profiles?.username}
                      </span>
                      {rating > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Stars score={Math.round(rating)} />
                          <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{rating.toFixed(1)}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({reviewCount})</span>
                        </div>
                      )}
                    </div>

                    {/* Row 2: server + activity + trust */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {reviewCount === 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sin reseñas aún</span>}
                      {servidor && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--dark-bg)', borderRadius: 4, padding: '1px 6px', border: '1px solid var(--dark-border)' }}>🌐 {servidor}</span>
                      )}
                      {lastSeen && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                          {isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5BC98B', boxShadow: '0 0 5px rgba(91,201,139,0.7)', display: 'inline-block', animation: 'activePulse 2s ease-in-out infinite' }} />}
                          <span style={{ color: isActive ? '#5BC98B' : 'var(--text-muted)' }}>{lastSeen}</span>
                        </span>
                      )}
                      {isTrusted && (
                        <span style={{ fontSize: 10, color: '#5BC98B', background: 'rgba(91,201,139,0.1)', borderRadius: 4, padding: '1px 6px', border: '1px solid rgba(91,201,139,0.22)' }}>✓ Confiable</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Últimas calificaciones ──────────────────────────── */}
                {recentReviews.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 8, fontFamily: "'Cinzel',serif", letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 2 }}>ÚLTIMAS CALIFICACIONES</div>
                    {recentReviews.map((rev, i) => (
                      <div key={i} style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 7, padding: '7px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        {/* Score pill */}
                        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52 }}>
                          <Stars score={rev.score} />
                          <span style={{ fontSize: 9, color: SCORE_COLOR[rev.score], fontWeight: 700 }}>
                            {SCORE_LABEL[rev.score]}
                          </span>
                        </div>
                        {/* Comment + reviewer */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {rev.comment ? (
                            <p style={{ fontSize: 11, color: 'var(--text-primary)', margin: '0 0 3px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {rev.comment}
                            </p>
                          ) : (
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 3px', fontStyle: 'italic' }}>Sin comentario</p>
                          )}
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            {(rev.reviewer as any)?.username || 'Usuario'} · {timeAgo(rev.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div style={{ padding: '12px 18px 18px', flexShrink: 0, marginTop: 'auto' }}>
                <Link
                  href={href}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 0', borderRadius: 10, background: listing.type === 'sell' ? 'linear-gradient(135deg, #1a5c35, #2E7D52)' : 'linear-gradient(135deg, #0f2d52, #1E4A7A)', color: '#fff', textDecoration: 'none', fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: 1, fontWeight: 700, boxShadow: listing.type === 'sell' ? '0 4px 20px rgba(46,125,82,0.3)' : '0 4px 20px rgba(30,74,122,0.3)', transition: 'filter 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1)' }}
                >
                  {listing.type === 'sell' ? '⚔ Ver publicación completa' : '🛡 Ver publicación completa'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalZoomIn  { from { transform: scale(0.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes lbZoomIn     { from { transform: scale(0.88); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes activePulse  { 0%,100% { box-shadow: 0 0 5px rgba(91,201,139,0.7) } 50% { box-shadow: 0 0 9px rgba(91,201,139,0.3) } }
      `}</style>
    </>
  )
}
