'use client'
import Link from 'next/link'
import { RAREZA_COLOR, RAREZA_LABEL, formatPrecio, listingHref } from '@/lib/market/constants'
import { getItemIconColored } from '@/lib/market/icons'
import { useLanguage } from '@/lib/market/i18n'
import { IconPackage, IconStar } from './LineIcons'

const GREY_CATS = new Set(['joyeria', 'crafting', 'minerales'])

export default function FeaturedCarousel({ listings }: { listings: any[] }) {
  const { t } = useLanguage()
  if (!listings.length) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--featured)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {t('carousel.featured')}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
        scrollbarWidth: 'thin', scrollbarColor: 'color-mix(in srgb, var(--featured) 30%, transparent) transparent',
        justifyContent: listings.length < 5 ? 'center' : 'flex-start',
      }}>
        {listings.map(l => {
          const rarezaColor = RAREZA_COLOR[l.rareza] || '#888'
          const emojiColor = GREY_CATS.has(l.item_category) ? 'var(--category-grey)' : (rarezaColor || 'var(--category-grey-alt)')
          let svg = ''
          try { svg = getItemIconColored(l.subcategoria || '', l.item_category, emojiColor, l.material, l.item_name) } catch {}

          return (
            <Link
              key={l.id}
              href={listingHref(l.item_name, l.id, l.short_id)}
              style={{
                flexShrink: 0, width: 200, textDecoration: 'none',
                background: 'var(--bg-card)',
                border: `1px solid color-mix(in srgb, var(--featured) 35%, transparent)`,
                overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--featured) 70%, transparent)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--featured) 35%, transparent)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                height: 100,
                background: `radial-gradient(circle at center, color-mix(in srgb, ${emojiColor} 13%, transparent) 0%, color-mix(in srgb, ${emojiColor} 2%, transparent) 55%, var(--bg-surface) 80%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                filter: `drop-shadow(0 0 10px color-mix(in srgb, ${emojiColor} 27%, transparent))`,
              }}>
                {svg
                  ? <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: svg }} />
                  : <IconPackage size={36} style={{ color: emojiColor, opacity: 0.7 }} />
                }
                {l.rareza && l.rareza !== 'normal' && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    fontSize: 9, padding: '2px 6px',
                    background: `color-mix(in srgb, ${rarezaColor} 13%, transparent)`, color: rarezaColor,
                    border: `1px solid color-mix(in srgb, ${rarezaColor} 27%, transparent)`,
                    fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {RAREZA_LABEL[l.rareza] || l.rareza}
                  </span>
                )}
                <span style={{
                  position: 'absolute', top: 6, left: 6,
                  fontSize: 9, padding: '2px 6px',
                  background: 'color-mix(in srgb, var(--featured) 15%, transparent)', color: 'var(--featured)',
                  border: '1px solid color-mix(in srgb, var(--featured) 40%, transparent)',
                  fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>{t('carousel.badge')}</span>
              </div>

              <div style={{ padding: '10px 12px' }}>
                <p style={{
                  fontFamily: 'var(--font-display-v2)', fontSize: 14, color: 'var(--text-primary)', marginBottom: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {l.item_name}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>
                  {formatPrecio(l.price_gold, l.price_money, l.currency_label)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {l.profiles?.username || '—'}
                  {l.profiles?.avg_rating > 0 && (<><IconStar size={10} style={{ color: 'var(--gold)' }} /> {l.profiles.avg_rating.toFixed(1)}</>)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
