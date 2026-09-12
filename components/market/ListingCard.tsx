'use client'
/**
 * ListingCard — Regnum Market
 *
 * Filosofía de diseño:
 * — Paleta cálida (#211B14, #1A1510) del theme original. El frío moderno no
 *   encaja con un MMORPG medieval.
 * — Portrait card h-[420px]: la imagen ocupa el 61% (255px). En un marketplace
 *   de ítems de juego la imagen ES el producto.
 * — object-contain (no cover): las capturas de Regnum son verticales y muestran
 *   stats clave que object-cover recortaría.
 * — 3 columnas desktop: portrait cards necesitan ~300px mínimo para lucir bien.
 * — Sin backdrop-blur: sobre fondo sólido oscuro no aporta nada, solo costo.
 * — Hover: border-color + translateY(-3px) — suave, sin romper el grid.
 * — Rareza: 3 señales simultáneas (borde, glow, gradiente BG imagen).
 */
import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  RAREZA_COLOR, RAREZA_LABEL, CLASE_LABEL,
  formatPrecioCard, listingHref, formatSlot,
} from '@/lib/market/constants'
import { getItemIconColored } from '@/lib/market/icons'
import { useLanguage } from '@/lib/market/i18n'
import { useCurrency } from '@/lib/market/CurrencyContext'
import { IconHeart, IconStar, IconSword, IconShield as IconShieldLine, IconCamera } from './LineIcons'

// ─── Constantes ─────────────────────────────────────────────────
const GREY_CATS  = new Set(['joyeria', 'crafting', 'minerales'])
const REINO_IMG  : Record<string,string> = { alsius:'/alsius.png', syrtis:'/syrtis.png', ignis:'/ignis.png' }
const REINO_NAME : Record<string,string> = { alsius:'Alsius', syrtis:'Syrtis', ignis:'Ignis' }
// Mismos paths que ARQUETIPO_ICON en TorneoCard.tsx (Guerreros/Magos/Arqueros) —
// clase_requerida acá es el mismo concepto de arquetipo, reusa el ícono.
const CLASE_ICON_PATH: Record<string, string> = {
  guerrero: 'M3.75 13.5 14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
  mago:     'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
  arquero:  'M15.59 14.37a5 5 0 0 1-.77 6.13l-.72.71a.75.75 0 0 1-1.06 0l-.71-.72a5 5 0 0 1 6.13-.77m-8.98-8.98a5 5 0 0 1 .77-6.13l.72-.71a.75.75 0 0 1 1.06 0l.71.72a5 5 0 0 1-6.13.77m2.12 7.07 4.24-4.24',
}
function ClaseIcon({ clase, size = 13 }: { clase: string; size?: number }) {
  const d = CLASE_ICON_PATH[clase]
  if (!d) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Sistema de rareza ──────────────────────────────────────────
// Cada rareza tiene 4 señales visuales: borde, glow, gradiente BG imagen, fondo de card.
const RARITY: Record<string, {
  border     : string   // borde en reposo
  borderHover: string   // borde en hover
  glow       : string   // box-shadow en hover
  imgGrad    : string   // color para radial-gradient de la imagen
  nameColor  : string   // color del título
  cardBg     : string   // fondo sutil de la card completa
}> = {
  normal    : {
    // Gris propio del borde (200,200,200), distinto de --rarity-normal
    // (#9CA3AF, más azulado) — no se fuerza el colapse, son grises distintos.
    border:'rgba(200,200,200,0.22)',    borderHover:'rgba(220,220,220,0.45)',
    glow:'none',
    imgGrad:'transparent',              nameColor:'#E8D9B8',
    cardBg:'var(--dark-card)',
  },
  especial  : {
    border:'color-mix(in srgb, var(--rarity-special) 30%, transparent)',    borderHover:'color-mix(in srgb, var(--rarity-special) 65%, transparent)',
    glow:'0 0 16px -4px color-mix(in srgb, var(--rarity-special) 35%, transparent)',
    imgGrad:'var(--rarity-special)',    nameColor:'var(--rarity-special)',
    cardBg:'color-mix(in srgb, var(--rarity-special) 5%, transparent)',
  },
  magico    : {
    border:'color-mix(in srgb, var(--rarity-magic) 35%, transparent)',      borderHover:'color-mix(in srgb, var(--rarity-magic) 70%, transparent)',
    glow:'0 0 16px -4px color-mix(in srgb, var(--rarity-magic) 50%, transparent)',
    imgGrad:'var(--rarity-magic)',      nameColor:'var(--rarity-magic)',
    cardBg:'color-mix(in srgb, var(--rarity-magic) 7%, transparent)',
  },
  epico     : {
    border:'color-mix(in srgb, var(--rarity-epic) 45%, transparent)',       borderHover:'color-mix(in srgb, var(--rarity-epic) 85%, transparent)',
    glow:'0 0 20px -4px color-mix(in srgb, var(--rarity-epic) 60%, transparent)',
    // nameColor es un tinte más claro del base, no la misma opacidad —
    // queda como valor propio (#a78bfa), no se deriva con color-mix.
    imgGrad:'var(--rarity-epic)',       nameColor:'#a78bfa',
    cardBg:'color-mix(in srgb, var(--rarity-epic) 9%, transparent)',
  },
  legendario: {
    border:'color-mix(in srgb, var(--rarity-legendary) 45%, transparent)',  borderHover:'color-mix(in srgb, var(--rarity-legendary) 85%, transparent)',
    glow:'0 0 20px -4px color-mix(in srgb, var(--rarity-legendary) 60%, transparent)',
    // ídem epico: nameColor es un tinte más claro (#f87171), no colapsa.
    imgGrad:'var(--rarity-legendary)',  nameColor:'#f87171',
    cardBg:'color-mix(in srgb, var(--rarity-legendary) 8%, transparent)',
  },
}

// ─── Helpers ────────────────────────────────────────────────────
type LSD = { key:string; n?:number } | null
function getLastSeen(d:string|null): LSD {
  if (!d) return null
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000)
  const dy = Math.floor(diff/86400000), w = Math.floor(dy/7)
  if (m  < 2)  return { key:'card.active_now' }
  if (m  < 60) return { key:'card.active_minutes', n:m }
  if (h  < 24) return { key:'card.active_hours',   n:h }
  if (dy < 7)  return { key:'card.active_days',    n:dy }
  return { key:'card.active_weeks', n:w }
}

// ─── SvgIcon ────────────────────────────────────────────────────
function SvgIcon({ sub, cat, color, material, itemText, px=52 }:{ sub?:string; cat:string; color:string; material?:string|null; itemText?:string|null; px?:number }) {
  let svg = ''
  try { svg = getItemIconColored(sub||'', cat, color, material, itemText) }
  catch { svg = `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5"><path d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" stroke-linecap="round" stroke-linejoin="round"/></svg>` }
  return (
    <div
      suppressHydrationWarning
      style={{
        width: px*1.55, height: px*1.55, flexShrink:0,
        background: `radial-gradient(circle, ${color}28 0%, ${color}08 65%, transparent 85%)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        border:`1px solid ${color}22`,
        filter:`drop-shadow(0 0 10px ${color}55)`,
      }}
      dangerouslySetInnerHTML={{ __html:svg }}
    />
  )
}

// ─── TypeBadge ──────────────────────────────────────────────────
function TypeBadge({ type, small=false }:{ type:string; small?:boolean }) {
  const { t } = useLanguage()
  const sell = type === 'sell'
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
        fontSize: small ? 9 : 10,
        letterSpacing: small ? '0.08em' : '0.12em',
        fontWeight: 700,
        padding: small ? '2px 7px' : '3px 9px',
        background: sell ? 'var(--type-sell-bg)' : 'var(--type-busca-bg)',
        color:       sell ? 'var(--success)' : 'var(--info)',
        border:      `1px solid ${sell ? 'var(--type-sell-border)' : 'var(--type-busca-border)'}`,
      }}
    >
      {t(sell ? 'card.sells' : 'card.seeks')}
    </span>
  )
}

// ─── PrecioDisplay ──────────────────────────────────────────────
function PrecioDisplay({ priceGold, priceMoney, currencyLabel, size='md' }:{
  priceGold:number|null; priceMoney:number|null; currencyLabel:string; size?:'sm'|'md'|'lg'
}) {
  const { t } = useLanguage()
  const { enabled, userCurrency, rates, convertir, formatMoneda } = useCurrency()
  const { gold, money } = formatPrecioCard(priceGold, priceMoney, currencyLabel)
  const fs = size==='lg' ? 18 : size==='md' ? 15 : 12

  const sellerCurrency = (currencyLabel || '').toUpperCase()
  const showConversion = enabled && !!priceMoney && sellerCurrency && userCurrency !== sellerCurrency && Object.keys(rates).length > 0
  const converted = showConversion ? convertir(priceMoney!, sellerCurrency, userCurrency, rates) : null
  const convertedStr = converted !== null ? formatMoneda(converted, userCurrency) : null

  if (!gold && !money) return <span style={{ color:'var(--text-muted)', fontSize:fs-2 }}>{t('card.price_tbd')}</span>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
      {gold && (
        <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--gold)', fontSize:fs, fontWeight:800, lineHeight:1.1, fontFamily:'Inter,system-ui,sans-serif', letterSpacing:'-0.02em' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/magnanita.png" alt="mag" style={{ width: fs+2, height: fs+2, objectFit:'contain', flexShrink:0 }} />
          {gold}
        </span>
      )}
      {money && (
        <span
          title={convertedStr ? `El vendedor pide ${money}` : undefined}
          style={{ display:'flex', alignItems:'baseline', gap:4, flexWrap:'wrap', lineHeight:1.2 }}
        >
          <span style={{ color:'#9DC4E8', fontSize:fs-3, fontWeight:600 }}>{money}</span>
          {convertedStr && (
            <>
              <span style={{ color:'var(--text-muted)', fontSize:fs-6 }}>·</span>
              <span style={{ color:'var(--text-muted)', fontSize:fs-5, fontWeight:500 }}>≈ {convertedStr}</span>
            </>
          )}
        </span>
      )}
    </div>
  )
}

// ─── Tooltip panel ──────────────────────────────────────────────
function TooltipPanel({ listing, rc, ac }:{ listing:any; rc:string|null; ac:string }) {
  const { t } = useLanguage()
  const col = rc || 'var(--gold)'
  const mods:string[] = []
  for (let i=1;i<=5;i++) { if (listing[`slot_${i}`]) mods.push(listing[`slot_${i}`]) }
  const lsd   = getLastSeen(listing.profiles?.last_sign_in_at||null)
  const ls    = lsd ? t(lsd.key, lsd.n!==undefined?{n:lsd.n}:undefined) : ''
  const isNow = lsd?.key==='card.active_now'
  const hasStats = listing.dano_min_1 || listing.armadura_base
  return (
    <div style={{
      width:245,
      background:'#0f0d0a',
      border:`1px solid ${col}55`,
      overflow:'hidden',
      pointerEvents:'none',
    }}>
      {/* Header */}
      <div style={{
        height:88,
        background:`radial-gradient(ellipse at center,${ac}20 0%,transparent 70%),#14100c`,
        borderBottom:`1px solid ${col}22`,
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative',
      }}>
        <div style={{ position:'absolute', top:8, left:8 }}><TypeBadge type={listing.type} small /></div>
        {listing.rareza && listing.rareza!=='normal' && (
          <span style={{
            fontFamily:'var(--font-mono)', textTransform:'uppercase',
            position:'absolute', top:8, right:8,
            fontSize:9, padding:'2px 7px', letterSpacing:1, fontWeight:700,
            background:`${col}25`, color:col, border:`1px solid ${col}44`,
          }}>
            {RAREZA_LABEL[listing.rareza]}
          </span>
        )}
        <SvgIcon sub={listing.subcategoria} cat={listing.item_category} color={ac} material={listing.material} itemText={`${listing.item_name} ${listing.description||''}`} px={36} />
      </div>
      {/* Body */}
      <div style={{ padding:'10px 13px', display:'flex', flexDirection:'column', gap:8 }}>
        <p style={{ fontFamily:'var(--font-display-v2)', margin:0, fontSize:16, textAlign:'center', color:col, lineHeight:1.3 }}>
          {listing.item_name}
        </p>
        {listing.item_category && (
          <p style={{ margin:0, fontSize:10, textAlign:'center', color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>
            {listing.item_category}{listing.subcategoria?` · ${listing.subcategoria}`:''}
          </p>
        )}
        {hasStats && (
          <div style={{ display:'flex', flexDirection:'column', gap:3, padding:'8px 0 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {listing.dano_min_1 && (
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>{t('card.damage')}</span>
                <span style={{ fontSize:11, fontFamily:'monospace', fontWeight:700, color:'var(--stat-damage)' }}>
                  {listing.dano_min_1}–{listing.dano_max_1}{listing.bonus_xx?` +${listing.bonus_xx}`:''}
                </span>
              </div>
            )}
            {listing.armadura_base && (
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>{t('card.armor')}</span>
                <span style={{ fontSize:11, fontFamily:'monospace', fontWeight:700, color:'var(--stat-armor)' }}>
                  {listing.armadura_base}{listing.armadura_bonus?` +${listing.armadura_bonus}`:''}
                </span>
              </div>
            )}
            {listing.velocidad && (
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>{t('card.speed')}</span>
                <span style={{ fontSize:11, fontFamily:'monospace', fontWeight:700, color:'var(--text-primary)' }}>{listing.velocidad}</span>
              </div>
            )}
          </div>
        )}
        {mods.length>0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:3, padding:'8px 0 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {mods.map((m,i)=>(
              <div key={i} style={{ fontSize:11, color:'var(--success)', fontFamily:'monospace', paddingLeft:10, position:'relative' }}>
                <span style={{ position:'absolute', left:0, color:'color-mix(in srgb, var(--success) 40%, transparent)' }}>+</span>{formatSlot(m)}
              </div>
            ))}
          </div>
        )}
        {!hasStats && !mods.length && listing.description && (
          <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.32)', fontStyle:'italic', lineHeight:1.5,
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>
            {listing.description}
          </p>
        )}
        {/* Precio */}
        <div style={{ textAlign:'center', padding:'8px 0 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <PrecioDisplay priceGold={listing.price_gold} priceMoney={listing.price_money} currencyLabel={listing.currency_label} size="md" />
        </div>
        {/* Seller */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            width:26, height:26, flexShrink:0,
            background:`linear-gradient(135deg,${col}99,${col}44)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:700, color:'#fff',
          }}>
            {(listing.profiles?.username||'?')[0].toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, color:'var(--text-primary)', fontWeight:600,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {listing.profiles?.username}
              {listing.profiles?.avg_rating>0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:2, color:'var(--gold)', fontSize:10, marginLeft:5 }}>
                  <IconStar size={9} /> {listing.profiles.avg_rating.toFixed(1)}
                </span>
              )}
            </div>
            {ls && <div style={{ fontSize:10, color: isNow?'var(--success)':'rgba(255,255,255,0.3)' }}>{ls}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ListingCard({
  listing,
  isFavorito: initFav = false,
}:{
  listing:any; isFavorito?:boolean
}) {
  const { t } = useLanguage()
  const rareza  = listing.rareza as string|undefined
  const rc      = rareza ? RAREZA_COLOR[rareza] : null
  const lsd     = getLastSeen(listing.profiles?.last_sign_in_at||null)
  const ls      = lsd ? t(lsd.key, lsd.n!==undefined?{n:lsd.n}:undefined) : ''
  const isNow   = lsd?.key==='card.active_now'
  const cardRef = useRef<HTMLAnchorElement>(null)

  const [tooltip,     setTooltip]     = useState<{x:number;y:number}|null>(null)
  const [fav,         setFav]         = useState(initFav)
  const [favLoad,     setFavLoad]     = useState(false)
  const [hovered,     setHovered]     = useState(false)

  // Fotos reales subidas por el vendedor — ya no se usan como preview de la
  // card (ver abajo), pero se cuentan para el badge "N fotos" que indica que
  // hay evidencia real disponible en el detalle del ítem.
  const photoCount = [
    listing.item_image_url,
    ...((listing.image_urls as string[] | null) || []),
  ].filter(Boolean).length

  const ac = GREY_CATS.has(listing.item_category) ? 'var(--category-grey)' : (rc || 'var(--category-grey-alt)')

  const mods:string[] = []
  for (let i=1;i<=5;i++) { if (listing[`slot_${i}`]) mods.push(listing[`slot_${i}`]) }

  const tier     = (rareza && RARITY[rareza]) ? RARITY[rareza] : RARITY.normal
  const hasStats = listing.dano_min_1 || listing.armadura_base
  const featured = listing.featured

  const toggleFav = async (e:React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (favLoad) return
    setFavLoad(true); setFav(f=>!f)
    try {
      const res  = await fetch('/api/market/favorito',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({listing_id:listing.id})})
      const json = await res.json()
      if (res.status===401){ setFav(initFav); return }
      setFav(json.favorito)
    } catch { setFav(initFav) }
    finally   { setFavLoad(false) }
  }

  const onEnter = (e:React.MouseEvent) => {
    if (window.matchMedia('(hover: none)').matches) return
    const r=(e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ x:r.right+10, y:r.top })
  }
  const onLeave = () => setTooltip(null)

  const renderTooltip = () => {
    if (!tooltip || typeof window==='undefined') return null
    if (window.matchMedia('(hover: none)').matches) return null
    const vw = window.innerWidth
    const x  = tooltip.x+250>vw ? tooltip.x-260 : tooltip.x
    const y  = Math.max(8, Math.min(tooltip.y, window.innerHeight-440))
    return (
      <div style={{ position:'fixed', left:x, top:y, zIndex:9999, pointerEvents:'none' }}>
        <TooltipPanel listing={listing} rc={rc} ac={ac} />
      </div>
    )
  }

  // ── Vista Grilla — Portrait card ───────────────────────────────
  //
  // h-[420px]: imagen 255px (61%) + datos 165px (39%)
  // El ratio 61/39 es el sweet spot para un marketplace de items de juego:
  // suficiente imagen para reconocer el ítem de un vistazo,
  // suficiente data para tomar la decisión de compra sin abrir el detalle.
  //
  const setItems = listing.is_set && listing.description
    ? listing.description.split('\n').map((l:string)=>l.replace(/^[-•*]\s*/,'').trim()).filter(Boolean)
    : []

  const href = listingHref(listing.item_name, listing.id, listing.short_id)

  return (
    <>
      <Link
        href={href}
        ref={cardRef}
        className="listing-card"
        onMouseEnter={(e)=>{ setHovered(true); onEnter(e) }}
        onMouseLeave={()=>{ setHovered(false); onLeave() }}
        style={{
          textDecoration: 'none', color: 'inherit',
          background: tier.cardBg,
          border: `1px solid ${hovered ? tier.borderHover : tier.border}`,
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          height: 420,                             // portrait fijo
          transition: 'border-color 0.22s ease',
        }}
      >
        {/* ══════════════════════════════════════════
            ZONA IMAGEN — 255px, object-contain
            Imagen flotante con padding sobre fondo oscuro warm.
            object-contain preserva las screenshots verticales del juego.
        ══════════════════════════════════════════ */}
        <div className="listing-card-img" style={{
          position:'relative',
          width:'100%',
          height: 255,
          flexShrink: 0,
          overflow: 'hidden',
          // Fondo warm con toque de rareza — el lienzo oscuro sobre el que "flota" el ítem
          background: tier.imgGrad !== 'transparent'
            ? `radial-gradient(ellipse 70% 60% at 50% 55%, ${tier.imgGrad}1e 0%, var(--dark-surface) 65%)`
            : 'var(--dark-surface)',
        }}>

          {/* Glow de rareza que se intensifica en hover */}
          {tier.imgGrad !== 'transparent' && (
            <div style={{
              position:'absolute', inset:0, pointerEvents:'none',
              background:`radial-gradient(ellipse 55% 50% at 50% 50%, ${tier.imgGrad}18 0%, transparent 65%)`,
              opacity: hovered ? 1 : 0.4,
              transition:'opacity 0.3s ease',
            }} />
          )}

          {/* Featured banner */}
          {featured && (
            <div style={{
              position:'absolute', top:0, left:0, right:0, zIndex:20,
              textAlign:'center', padding:'4px 0', fontSize:8, letterSpacing:'4px', fontWeight:700,
              fontFamily:'var(--font-mono)',
              background:'rgba(201,168,76,0.12)', borderBottom:'1px solid rgba(201,168,76,0.2)',
              color:'var(--gold)',
            }}>
              DESTACADO
            </div>
          )}

          {/* Badge TIPO — top-left */}
          <div style={{ position:'absolute', top: featured?26:9, left:9, zIndex:10 }}>
            <TypeBadge type={listing.type} />
          </div>

          {/* Badge RAREZA/SET — top-right */}
          <div style={{ position:'absolute', top: featured?26:9, right:9, zIndex:10 }}>
            {listing.is_set ? (
              <span style={{
                fontFamily:'var(--font-mono)', textTransform:'uppercase',
                fontSize:9, padding:'2px 8px', fontWeight:700, letterSpacing:'0.1em',
                background:'var(--set-purple-bg)', color:'var(--set-purple)', border:'1px solid var(--set-purple-border)',
              }}>SET</span>
            ) : rareza && rareza!=='normal' ? (
              <span style={{
                fontFamily:'var(--font-mono)', textTransform:'uppercase',
                fontSize:9, padding:'2px 8px', fontWeight:700, letterSpacing:'0.1em',
                background:`color-mix(in srgb, ${rc} 15%, transparent)`, color:rc!, border:`1px solid color-mix(in srgb, ${rc} 33%, transparent)`,
              }}>{RAREZA_LABEL[rareza]}</span>
            ) : null}
          </div>

          {/* Botón favorito — bottom-right */}
          <button
            onClick={toggleFav}
            title={fav?'Quitar de favoritos':'Guardar en favoritos'}
            style={{
              position:'absolute', bottom:9, right:9, zIndex:10,
              width:26, height:26, cursor:'pointer',
              background:'rgba(13,11,9,0.65)',
              border:'1px solid rgba(255,255,255,0.12)',
              color: fav ? 'var(--favorite)' : 'rgba(255,255,255,0.5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'transform 0.15s, color 0.15s',
              transform: favLoad ? 'scale(0.8)' : 'scale(1)',
            }}
          >
            <IconHeart size={13} filled={fav} />
          </button>

          {/* ── ICONO DE CATEGORÍA — siempre, sin importar si hay foto subida ──
              Las capturas del juego que suben los vendedores no son legibles
              como thumbnail (texto minúsculo, tooltip completo del juego).
              La preview usa el mismo ícono vectorial consistente para todos
              los ítems de una categoría; las fotos reales del vendedor se
              ven en el detalle del ítem, no acá. */}
          <div style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              position:'absolute',
              width:'50%', height:'50%', borderRadius:'50%',
              background: tier.imgGrad!=='transparent' ? `${tier.imgGrad}1a` : `${ac}14`,
              filter:'blur(22px)',
            }} />
            <div style={{
              position:'relative',
              transition:'transform 0.45s ease',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}>
              <SvgIcon sub={listing.subcategoria} cat={listing.item_category} color={ac} material={listing.material} itemText={`${listing.item_name} ${listing.description||''}`} px={62} />
            </div>
          </div>

          {/* Badge "N fotos" — esquina inferior izquierda, solo informativo:
              avisa que hay fotos reales del vendedor para ver en el detalle. */}
          {photoCount>0 && (
            <div style={{
              position:'absolute', bottom:9, left:9, zIndex:10,
              display:'flex', alignItems:'center', gap:4,
              padding:'4px 8px',
              background:'rgba(13,11,9,0.65)', border:'1px solid rgba(255,255,255,0.14)',
              color:'rgba(255,255,255,0.75)', fontSize:10, fontFamily:'var(--font-mono)',
            }}>
              <IconCamera size={11} /> {photoCount}
            </div>
          )}

          {/* SET mini-tags en base de imagen */}
          {listing.is_set && setItems.length>0 && (
            <div style={{
              position:'absolute', bottom:0, left:0, right:0, zIndex:10,
              padding:'32px 10px 10px',
              background:'linear-gradient(0deg,rgba(0,0,0,.82) 0%,transparent)',
            }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {setItems.slice(0,3).map((it:string,i:number) => (
                  <span key={i} style={{
                    fontSize:9, fontFamily:'var(--font-mono)', padding:'2px 8px',
                    background:'color-mix(in srgb, var(--set-purple-bg) 70%, transparent)', color:'var(--set-purple)',
                    border:'1px solid rgba(139,92,246,0.3)',
                    maxWidth:115, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{it}</span>
                ))}
                {setItems.length>3 && (
                  <span style={{ fontSize:9, fontFamily:'var(--font-mono)', padding:'2px 6px',
                    background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.35)' }}>
                    +{setItems.length-3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Overlay "Ver Detalles" — gradient desde abajo */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, zIndex:20,
            height:'42%',
            background:'linear-gradient(0deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.3) 55%,transparent)',
            opacity: hovered ? 1 : 0,
            transition:'opacity 0.2s ease',
            display:'flex', alignItems:'flex-end', justifyContent:'center',
            paddingBottom:10,
          }}>
            <span style={{
              fontFamily:'var(--font-mono)', textTransform:'uppercase',
              fontSize:10, letterSpacing:'3px', fontWeight:700,
              color:'rgba(255,255,255,0.9)',
              transform: hovered ? 'translateY(0)' : 'translateY(5px)',
              transition:'transform 0.2s ease',
            }}>
              VER DETALLES →
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ZONA DATOS — 165px restantes
            Diseñada para ser escaneable en < 2 segundos:
            1. Nombre (Cinzel, color rareza)
            2. Meta compacta (reino + clase)
            3. Stats 2-col si existen / mods si no
            4. Footer (precio grande + seller)
        ══════════════════════════════════════════ */}
        <div style={{
          flex:1, overflow:'hidden',
          display:'flex', flexDirection:'column',
          padding:'10px 12px 10px',
          gap:6,
          borderTop:`1px solid ${tier.border}`,
        }}>

          {/* 1. Nombre */}
          <h3
            style={{
              fontFamily:'var(--font-display-v2)',
              margin:0, fontSize:16, fontWeight:600, lineHeight:1.25,
              overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical',
              color: tier.nameColor,
              textShadow: tier.imgGrad!=='transparent' ? `0 0 14px ${tier.imgGrad}44` : 'none',
              flexShrink:0,
            }}
          >
            {listing.item_name}
          </h3>

          {/* 2. Meta: reino + clase (compacto, una línea) */}
          {(listing.reino || (listing.clase_requerida && listing.clase_requerida!=='todas')) && (
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, minHeight:16 }}>
              {listing.reino && REINO_IMG[listing.reino] && (
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted)' }}>
                  <img src={REINO_IMG[listing.reino]} alt={listing.reino}
                    style={{ width:13, height:13, objectFit:'contain', borderRadius:'50%',
                      border:'1px solid rgba(255,255,255,0.1)', padding:1, flexShrink:0 }} />
                  {REINO_NAME[listing.reino]}
                </span>
              )}
              {listing.clase_requerida && listing.clase_requerida!=='todas' && (
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted)' }}>
                  <ClaseIcon clase={listing.clase_requerida} size={11} /> {CLASE_LABEL[listing.clase_requerida]}
                </span>
              )}
            </div>
          )}

          {/* 3. Stats base — fila compacta (daño + armadura en una línea) */}
          {hasStats && (
            <div style={{ display:'flex', gap:14, flexShrink:0, flexWrap:'wrap' }}>
              {listing.dano_min_1 && (
                <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--stat-damage)', lineHeight:1.3 }}>
                  <IconSword size={11} /> {listing.dano_min_1}–{listing.dano_max_1}
                  {listing.bonus_xx && <span style={{ color:'var(--gold)', fontSize:10 }}> +{listing.bonus_xx}</span>}
                </span>
              )}
              {listing.armadura_base && (
                <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--stat-armor)', lineHeight:1.3 }}>
                  <IconShieldLine size={11} /> {listing.armadura_base}
                  {listing.armadura_bonus && <span style={{ color:'var(--gold)', fontSize:10 }}> +{listing.armadura_bonus}</span>}
                </span>
              )}
            </div>
          )}

          {/* 4. Modificadores — columna vertical, texto claro; si no entran todos, scroll interno (el footer no se mueve) */}
          {mods.length > 0 && (
            <div className="listing-card-mods" style={{
              flex:1, minHeight:0,
              display:'flex', flexDirection:'column', gap:3,
              overflowY:'auto', paddingRight:6,
            }}>
              {mods.map((mod, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'baseline', gap:5, flexShrink:0,
                  fontSize:10.5, fontFamily:'var(--font-mono)', color:'var(--success)', lineHeight:1.35,
                }}>
                  <span style={{ color:'color-mix(in srgb, var(--success) 55%, transparent)', flexShrink:0 }}>+</span>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{formatSlot(mod)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 4. Footer: precio + reino/vendedor (siempre al fondo con mt-auto) */}
          <div style={{
            display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:8,
            marginTop:'auto', paddingTop:8,
            borderTop:'1px solid var(--dark-border)',
            flexShrink:0,
          }}>
            <PrecioDisplay
              priceGold={listing.price_gold}
              priceMoney={listing.price_money}
              currencyLabel={listing.currency_label}
              size="lg"
            />
            <div style={{ textAlign:'right', minWidth:0, flexShrink:1 }}>
              <div style={{
                fontSize:11, color:'var(--text-muted)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:95,
              }}>
                {listing.profiles?.username}
                {listing.profiles?.avg_rating>0 && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:2, color:'var(--gold)', fontSize:9, marginLeft:4 }}>
                    <IconStar size={9} /> {listing.profiles.avg_rating.toFixed(1)}
                  </span>
                )}
              </div>
              {ls && (
                <div style={{ fontSize:9, color: isNow?'var(--success)':'var(--text-muted)', marginTop:1, lineHeight:1.2 }}>
                  {isNow?'● ':''}{ls}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {renderTooltip()}
    </>
  )
}
