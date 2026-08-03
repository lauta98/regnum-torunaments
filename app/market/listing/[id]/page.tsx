export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import SellerCard from '@/components/market/SellerCard'
import BotonComprar from '@/components/market/BotonComprar'
import ViewCounter from '@/components/market/ViewCounter'
import SimilaresGrid from '@/components/market/SimilaresGrid'
import ReportButton from '@/components/market/ReportButton'
import FavoriteButton from '@/components/market/FavoriteButton'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import {
  RAREZA_COLOR, RAREZA_LABEL, CALIDAD_COLOR, CALIDAD_LABEL,
  VELOCIDAD_LABEL, CLASE_LABEL, SUBCLASE_LABEL, MUESCA_LABEL, formatPrecio, CAT_EMOJI, listingHref, formatSlot
} from '@/lib/market/constants'
import { getItemIconColored } from '@/lib/market/icons'

// Detecta el tipo de param y devuelve el identificador correcto
// - UUID puro:       "3a63a92b-f123-4567-89ab-cdef01234567"  → { type: 'uuid', value }
// - slug + UUID:     "artesano-fusion-3a63a92b-f123-..."      → { type: 'uuid', value }
// - slug + short_id: "artesano-fusion-k7x2mq9"               → { type: 'short', value }
function resolveId(param: string): { type: 'uuid' | 'short'; value: string } {
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const uuidMatch = param.match(uuidRegex)
  if (uuidMatch) return { type: 'uuid', value: uuidMatch[0] }
  // short_id: último segmento de 7 chars alfanuméricos (solo letras y números)
  const shortMatch = param.match(/-([a-z0-9]{7})$/i)
  if (shortMatch) return { type: 'short', value: shortMatch[1] }
  return { type: 'uuid', value: param }
}

// Extrae el nombre del ítem del slug (sin UUID ni short_id al final)
function nameFromSlug(slug: string): string {
  return slug
    .replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, '')
    .replace(/-[a-z0-9]{7}$/i, '')
    .replace(/-/g, ' ')
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    .trim() || 'Regnum Market'
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id: rawId } = await params

  // Título base desde el slug — funciona sin ningún query a DB
  const slugTitle = nameFromSlug(rawId)

  try {
    const supabase = createServiceSupabase()
    const { type: idType, value: idValue } = resolveId(rawId)
    const { data: listing } = await supabase
      .from('listings')
      .select('id, short_id, item_name, item_category, rareza, price_gold, price_money, currency_label, type, description, image_url')
      .eq(idType === 'short' ? 'short_id' : 'id', idValue)
      .maybeSingle()

    if (listing) {
      const tipo = listing.type === 'sell' ? 'Vende' : 'Busca'
      const emoji = CAT_EMOJI[listing.item_category] ?? '⚔'
      const rareza = listing.rareza ? ` · ${listing.rareza}` : ''
      const precio = formatPrecio(listing.price_gold, listing.price_money, listing.currency_label)
      const title = `${emoji} ${listing.item_name}${rareza} · ${precio} · Regnum Market`
      const description = listing.description
        ? listing.description.slice(0, 160)
        : `${tipo}: ${listing.item_name}${rareza}. Precio: ${precio}. Marketplace de Champions of Regnum.`

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://regnum-market.vercel.app'
      const pageUrl = `${siteUrl}${listingHref(listing.item_name, listing.id, listing.short_id)}`

      return {
        title,
        description,
        openGraph: {
          title, description, url: pageUrl, siteName: 'Regnum Market', type: 'website',
          ...(listing.image_url ? { images: [{ url: listing.image_url, width: 800, height: 600, alt: listing.item_name }] } : {}),
        },
        twitter: {
          card: listing.image_url ? 'summary_large_image' : 'summary',
          title, description,
          ...(listing.image_url ? { images: [listing.image_url] } : {}),
        },
      }
    }
  } catch (e) {
    console.error('[generateMetadata] error:', e)
  }

  // Fallback: título extraído del slug, nunca "not found"
  return { title: slugTitle }
}

const GREY_CATS = new Set(['joyeria', 'crafting', 'minerales'])

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, var(--dark-border), transparent)' }} />
      <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, var(--dark-border), transparent)' }} />
    </div>
  )
}

function StatRow({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 12px', borderRadius: 6, marginBottom: 4,
      background: 'var(--dark-bg)', gap: 8,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        {icon && <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>}
        {label}
      </span>
      <span style={{ fontSize: 13, color: color || 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function ModChip({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 12px', borderRadius: 6, marginBottom: 4,
      background: 'rgba(91,201,139,0.06)', border: '1px solid rgba(91,201,139,0.2)',
    }}>
      <span style={{ color: 'rgba(91,201,139,0.5)', fontSize: 12 }}>✦</span>
      <span style={{ fontSize: 13, color: '#5BC98B' }}>{formatSlot(text)}</span>
    </div>
  )
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const { type: idType, value: idValue } = resolveId(rawId)
  const supabase = await createServerSupabase()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(id, username, avg_rating, total_reviews, discord, discord_id, whatsapp, regnum_nick, created_at, last_sign_in_at)')
    .eq(idType === 'short' ? 'short_id' : 'id', idValue)
    .single()

  if (!listing) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Favorito del usuario actual
  let isFavorito = false
  if (user) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listing!.id)
      .maybeSingle()
    isFavorito = !!fav
  }

  // Historial de precios (mismo nombre de ítem, últimas 8 ventas)
  const { data: precioHistorial } = await supabase
    .from('price_history')
    .select('price_gold, price_money, currency_label, rareza, completed_at')
    .ilike('item_name', listing.item_name)
    .order('completed_at', { ascending: false })
    .limit(8)

  // Ítems similares (misma categoría, distinto id, activos)
  const { data: similares } = await supabase
    .from('listings')
    .select('id, item_name, item_category, subcategoria, rareza, type, price_gold, price_money, currency_label, profiles(username)')
    .eq('status', 'active')
    .eq('item_category', listing.item_category)
    .neq('id', listing.id)
    .order('created_at', { ascending: false })
    .limit(6)
  const rareza = listing.rareza
  const rarezaColor = rareza ? RAREZA_COLOR[rareza] : '#C9A84C'
  const iconColor = GREY_CATS.has(listing.item_category) ? '#7A8A9A' : rarezaColor

  const isSell = listing.type === 'sell'
  const badge = isSell
    ? { label: '▲ VENDE', bg: '#1a5c2e', border: '#2d9b4e', color: '#6EE89A' }
    : { label: '▼ BUSCA', bg: '#0f3460', border: '#1e6db5', color: '#7DC4FF' }

  const esArma     = listing.item_category === 'armas'
  const esArmadura = listing.item_category === 'armaduras'
  const esGema     = listing.item_category === 'gemas_magicas'

  const slots: string[] = []
  for (let i = 1; i <= 5; i++) if (listing[`slot_${i}`]) slots.push(listing[`slot_${i}`])

  const mejoras: string[] = []
  for (let i = 1; i <= 2; i++) if (listing[`mejora_${i}`]) mejoras.push(listing[`mejora_${i}`])

  const resistencias = [
    { key: 'cortante',   label: 'Cortante',   icon: '🗡' },
    { key: 'punzante',   label: 'Punzante',   icon: '↑' },
    { key: 'aplastante', label: 'Aplastante', icon: '🔨' },
    { key: 'fuego',      label: 'Fuego',      icon: '🔥' },
    { key: 'hielo',      label: 'Hielo',      icon: '❄' },
    { key: 'electrico',  label: 'Eléctrico',  icon: '⚡' },
  ].filter(r => listing[`res_${r.key}`])

  let svgIcon = ''
  try {
    svgIcon = getItemIconColored(listing.subcategoria || '', listing.item_category, iconColor)
  } catch { svgIcon = '' }

  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const fechaD = new Date(listing.created_at)
  const fechaStr = `${fechaD.getUTCDate()} ${MESES[fechaD.getUTCMonth()]} ${fechaD.getUTCFullYear()}`

  return (
    <>
    <Header />
    <div style={{ padding: '20px 16px 48px', maxWidth: 980, margin: '0 auto' }}>

      {/* Back */}
      <Link href="/market" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, textDecoration: 'none', transition: 'color 0.2s' }}>
        ← Volver al mercado
      </Link>

      {/* Layout principal */}
      <div className="listing-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 24, alignItems: 'start' }}>

        {/* ── COLUMNA IZQUIERDA ── */}
        <div style={{ minWidth: 0 }}>

          {/* Hero: ícono + nombre + precio */}
          <div style={{
            borderRadius: 12, overflow: 'hidden', marginBottom: 20,
            border: `1px solid ${rarezaColor}33`,
            background: `linear-gradient(160deg, var(--dark-card) 0%, var(--dark-surface) 100%)`,
          }}>
            {/* Área del ícono */}
            <div style={{
              height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `radial-gradient(ellipse at 50% 30%, ${iconColor}20 0%, ${iconColor}06 50%, transparent 80%)`,
              borderBottom: `1px solid ${rarezaColor}22`, position: 'relative',
            }}>
              {/* Badge tipo — top left */}
              <span style={{
                position: 'absolute', top: 12, left: 12,
                padding: '4px 10px', borderRadius: 4, fontSize: 10,
                fontFamily: "'Cinzel',serif", letterSpacing: 1, fontWeight: 700,
                background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
              }}>
                {badge.label}
              </span>

              {/* Badge rareza — top right */}
              {rareza && rareza !== 'normal' && (
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  padding: '4px 10px', borderRadius: 4, fontSize: 10,
                  fontFamily: "'Cinzel',serif", letterSpacing: 1, fontWeight: 700,
                  background: `${rarezaColor}22`, color: rarezaColor, border: `1px solid ${rarezaColor}55`,
                }}>
                  {RAREZA_LABEL[rareza]}
                </span>
              )}

              {/* Ícono — en desktop solo SVG/emoji, en mobile también la imagen */}
              {listing.item_image_url ? (
                <div className="listing-hero-image">
                  <img
                    src={listing.item_image_url}
                    alt={listing.item_name}
                    style={{ maxHeight: 160, maxWidth: '80%', objectFit: 'contain', borderRadius: 8 }}
                  />
                </div>
              ) : null}
              {/* SVG icon: siempre visible en desktop, solo si no hay imagen en mobile */}
              <div className={listing.item_image_url ? 'listing-hero-icon' : undefined}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {svgIcon ? (
                <div style={{
                  width: 110, height: 110, borderRadius: '50%',
                  background: `radial-gradient(circle, ${iconColor}28 0%, ${iconColor}06 65%, transparent 85%)`,
                  border: `1px solid ${iconColor}33`,
                  filter: `drop-shadow(0 0 16px ${iconColor}66)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{ __html: svgIcon.replace('width="48"', 'width="64"').replace('height="48"', 'height="64"') }}
                />
              ) : (
                <span style={{ fontSize: 72 }}>{CAT_EMOJI[listing.item_category] || '📦'}</span>
              )}
              </div>{/* fin listing-hero-icon */}
            </div>{/* fin área ícono */}

            {/* Info bajo el ícono */}
            <div style={{ padding: '16px 20px 20px' }}>
              {/* Clase / subcategoría */}
              {(listing.clase_requerida && listing.clase_requerida !== 'todas') && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>
                  {CLASE_LABEL[listing.clase_requerida]}
                  {listing.subclase_requerida && listing.subclase_requerida !== 'todas'
                    ? ` · ${SUBCLASE_LABEL[listing.subclase_requerida]}` : ''}
                  {listing.subcategoria ? ` · ${listing.subcategoria}` : ''}
                </div>
              )}

              <h1 className="cinzel" style={{
                fontSize: 24, color: rarezaColor, marginBottom: 12, lineHeight: 1.25,
                textShadow: `0 0 24px ${rarezaColor}44`,
              }}>
                {listing.item_name}
              </h1>

              {/* Precio */}
              <div style={{ fontSize: 22, color: 'var(--gold)', fontWeight: 700, letterSpacing: 0.5 }}>
                {formatPrecio(listing.price_gold, listing.price_money, listing.currency_label)}
              </div>
            </div>
          </div>

          {/* Descripción */}
          {listing.description && (
            <div style={{
              background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
              borderRadius: 10, padding: '14px 18px', marginBottom: 20,
              borderLeft: `3px solid ${rarezaColor}66`,
            }}>
              <p style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>
                "{listing.description}"
              </p>
            </div>
          )}

          {/* STATS ARMA */}
          {esArma && (
            <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, padding: '4px 8px 8px' }}>
              <Divider label="ESTADÍSTICAS" />
              {listing.dano_tipo_1 && <StatRow icon="⚔" label={`Daño ${listing.dano_tipo_1}`} value={`${listing.dano_min_1} – ${listing.dano_max_1}`} color="#E24B4A" />}
              {listing.dano_tipo_2 && <StatRow icon="⚔" label={`Daño ${listing.dano_tipo_2}`} value={`${listing.dano_min_2} – ${listing.dano_max_2}`} color="#E24B4A" />}
              {listing.dano_tipo_3 && <StatRow icon="⚔" label={`Daño ${listing.dano_tipo_3}`} value={`${listing.dano_min_3} – ${listing.dano_max_3}`} color="#E24B4A" />}
              {listing.bonus_xx  && <StatRow icon="✦" label="Bonus" value={`+${listing.bonus_xx}`} color="var(--gold)" />}
              {listing.velocidad && <StatRow icon="⚡" label="Velocidad" value={VELOCIDAD_LABEL[listing.velocidad] || listing.velocidad} />}
              {listing.rango     && <StatRow icon="🎯" label="Rango" value={listing.rango} />}
              {listing.material  && <StatRow icon="🔩" label="Material" value={listing.material} />}
              {listing.estado    && <StatRow icon="🛠" label="Estado" value={listing.estado} />}

              {slots.length > 0 && (
                <>
                  <Divider label="MODIFICADORES" />
                  {slots.map((s, i) => <ModChip key={i} text={s} />)}
                </>
              )}

              {listing.muesca_1_tipo && (
                <>
                  <Divider label="MUESCA" />
                  <StatRow icon="💠" label="Estado" value={MUESCA_LABEL[listing.muesca_1_tipo] || listing.muesca_1_tipo} />
                  {listing.muesca_1_gema && <StatRow icon="💎" label="Gema" value={listing.muesca_1_gema} color="#A78BFA" />}
                </>
              )}
            </div>
          )}

          {/* STATS ARMADURA */}
          {esArmadura && (
            <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, padding: '4px 8px 8px' }}>
              <Divider label="ESTADÍSTICAS" />
              {listing.armadura_base  && <StatRow icon="🛡" label="Armadura base" value={listing.armadura_base} />}
              {listing.armadura_bonus && <StatRow icon="✦" label="Bonus" value={`+${listing.armadura_bonus}`} color="var(--gold)" />}
              {listing.material       && <StatRow icon="🔩" label="Material" value={listing.material} />}
              {listing.estado         && <StatRow icon="🛠" label="Estado" value={listing.estado} />}

              {resistencias.length > 0 && (
                <>
                  <Divider label="RESISTENCIAS" />
                  {resistencias.map(r => {
                    const val = listing[`res_${r.key}`]
                    return <StatRow key={r.key} icon={r.icon} label={r.label} value={CALIDAD_LABEL[val] || val} color={CALIDAD_COLOR[val]} />
                  })}
                </>
              )}

              {slots.length > 0 && (
                <>
                  <Divider label="MODIFICADORES" />
                  {slots.map((s, i) => <ModChip key={i} text={s} />)}
                </>
              )}

              {mejoras.length > 0 && (
                <>
                  <Divider label="MEJORAS" />
                  {mejoras.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 6, marginBottom: 4, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: 12 }}>★</span>
                      <span style={{ fontSize: 13, color: 'var(--gold)' }}>{m}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* GEMAS */}
          {esGema && slots.length > 0 && (
            <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, padding: '4px 8px 8px' }}>
              <Divider label="PROPIEDADES" />
              {slots.map((s, i) => <ModChip key={i} text={s} />)}
            </div>
          )}

          {/* Otros slots (crafting, joyería, etc.) */}
          {!esArma && !esArmadura && !esGema && slots.length > 0 && (
            <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, padding: '4px 8px 8px' }}>
              <Divider label="MODIFICADORES" />
              {slots.map((s, i) => <ModChip key={i} text={s} />)}
            </div>
          )}

          {/* Meta: categoría + servidor + reino + fecha */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              listing.item_category,
              listing.subcategoria,
            ].filter(Boolean).map((tag: string) => (
              <span key={tag} style={{
                background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
                padding: '4px 12px', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)',
              }}>
                {CAT_EMOJI[tag] || ''} {tag}
              </span>
            ))}
            {listing.servidor && (
              <span style={{
                background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
                padding: '4px 12px', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)',
              }}>
                🌐 {listing.servidor}
              </span>
            )}
            {listing.reino && (() => {
              const reinoColors: Record<string, string> = { alsius: '#5B9BDF', syrtis: '#5BC98B', ignis: '#EF4444' }
              const reinoLabel: Record<string, string> = { alsius: 'Alsius', syrtis: 'Syrtis', ignis: 'Ignis' }
              const color = reinoColors[listing.reino] || 'var(--text-muted)'
              return (
                <span style={{
                  background: `${color}18`, border: `1px solid ${color}44`,
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, color,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  <img src={`/${listing.reino}.png`} alt={listing.reino} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                  {reinoLabel[listing.reino] || listing.reino}
                </span>
              )
            })()}
            <span style={{
              background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
              padding: '4px 12px', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)',
            }}>
              📅 {fechaStr}
            </span>
            {listing.views > 0 && (
              <span style={{
                background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
                padding: '4px 12px', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)',
              }}>
                👁 {listing.views} vista{listing.views !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="listing-sidebar" style={{ position: 'sticky', top: 76, alignSelf: 'start' }}>
          <SellerCard profile={listing.profiles} listingId={listing.id} sellerId={listing.user_id} />
          <BotonComprar listing={listing} currentUserId={user?.id || null} />
          <FavoriteButton listingId={listing.id} initialFavorito={isFavorito} isLoggedIn={!!user} />
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <ReportButton listingId={listing.id} currentUserId={user?.id || null} sellerId={listing.user_id} />
          </div>

          {/* Imagen del ítem — solo desktop, grande */}
          {listing.item_image_url && (
            <div className="listing-sidebar-image" style={{
              marginTop: 16, borderRadius: 10, overflow: 'hidden',
              border: `1px solid ${rarezaColor}33`,
              background: `radial-gradient(ellipse at 50% 30%, ${iconColor}12 0%, var(--dark-card) 80%)`,
            }}>
              <img
                src={listing.item_image_url}
                alt={listing.item_name}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: SellerCard + BotonComprar debajo (visible solo en móvil) */}
      <div className="listing-mobile-sidebar" style={{ marginTop: 20 }}>
        <SellerCard profile={listing.profiles} listingId={listing.id} sellerId={listing.user_id} />
        <BotonComprar listing={listing} currentUserId={user?.id || null} />
        <FavoriteButton listingId={listing.id} initialFavorito={isFavorito} isLoggedIn={!!user} />
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <ReportButton listingId={listing.id} currentUserId={user?.id || null} sellerId={listing.user_id} />
        </div>
      </div>

      {/* Historial de precios */}
      {precioHistorial && precioHistorial.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, var(--dark-border), transparent)' }} />
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>HISTORIAL DE PRECIOS</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, var(--dark-border), transparent)' }} />
          </div>
          <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, overflow: 'hidden' }}>
            {precioHistorial.map((h, i) => {
              const d = new Date(h.completed_at)
              const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
              const fecha = `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 16px',
                  borderBottom: i < precioHistorial.length - 1 ? '1px solid var(--dark-border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 {fecha}</span>
                    {h.rareza && (
                      <span style={{ fontSize: 10, color: RAREZA_COLOR[h.rareza] || 'var(--text-muted)' }}>
                        {h.rareza}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 600 }}>
                    {formatPrecio(h.price_gold, h.price_money, h.currency_label)}
                  </span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
            Últimas {precioHistorial.length} venta{precioHistorial.length !== 1 ? 's' : ''} confirmada{precioHistorial.length !== 1 ? 's' : ''} de "{listing.item_name}"
          </p>
        </div>
      )}

      <SimilaresGrid similares={similares || []} />

      <ViewCounter listingId={listing.id} />

      <style>{`
        /* Desktop: imagen en sidebar derecha, oculta en hero */
        @media (min-width: 681px) {
          .listing-mobile-sidebar { display: none !important; }
          .listing-hero-image { display: none !important; }
          .listing-hero-icon { display: flex !important; }
          .listing-sidebar-image { display: block !important; }
        }
        /* Mobile: imagen en hero, oculta en sidebar */
        @media (max-width: 680px) {
          .listing-grid { grid-template-columns: 1fr !important; }
          .listing-sidebar { display: none !important; }
          .listing-mobile-sidebar { display: block !important; }
          .listing-hero-image { display: flex !important; }
          .listing-hero-icon { display: none !important; }
          .listing-sidebar-image { display: none !important; }
        }
      `}</style>
    </div>
    </>
  )
}
