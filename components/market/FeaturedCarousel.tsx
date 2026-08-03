'use client'
import Link from 'next/link'
import { RAREZA_COLOR, RAREZA_LABEL, formatPrecio, listingHref } from '@/lib/market/constants'
import { getItemIconColored } from '@/lib/market/icons'
import { useLanguage } from '@/lib/market/i18n'

const GREY_CATS = new Set(['joyeria', 'crafting', 'minerales'])

export default function FeaturedCarousel({ listings }: { listings: any[] }) {
  const { t } = useLanguage()
  if (!listings.length) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.4))' }} />
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: '#F59E0B', letterSpacing: 2 }}>
          {t('carousel.featured')}
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(245,158,11,0.4))' }} />
      </div>

      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(245,158,11,0.3) transparent',
        justifyContent: listings.length < 5 ? 'center' : 'flex-start',
      }}>
        {listings.map(l => {
          const rarezaColor = RAREZA_COLOR[l.rareza] || '#888'
          const emojiColor = GREY_CATS.has(l.item_category) ? '#7A8A9A' : (rarezaColor || '#B8A157')
          let svg = ''
          try { svg = getItemIconColored(l.subcategoria || '', l.item_category, emojiColor) } catch {}

          return (
            <Link
              key={l.id}
              href={listingHref(l.item_name, l.id, l.short_id)}
              style={{
                flexShrink: 0, width: 200, textDecoration: 'none',
                background: 'var(--dark-card)',
                border: `1px solid rgba(245,158,11,0.35)`,
                borderRadius: 10, overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.7)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.35)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                height: 100,
                background: `radial-gradient(circle at center, ${emojiColor}22 0%, ${emojiColor}06 55%, var(--dark-surface) 80%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                filter: `drop-shadow(0 0 10px ${emojiColor}44)`,
              }}>
                {svg
                  ? <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: svg }} />
                  : <span style={{ fontSize: 42 }}>📦</span>
                }
                {l.rareza && l.rareza !== 'normal' && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    fontSize: 9, padding: '2px 6px', borderRadius: 4,
                    background: `${rarezaColor}22`, color: rarezaColor,
                    border: `1px solid ${rarezaColor}44`,
                    fontFamily: "'Cinzel',serif",
                  }}>
                    {RAREZA_LABEL[l.rareza] || l.rareza}
                  </span>
                )}
                <span style={{
                  position: 'absolute', top: 6, left: 6,
                  fontSize: 9, padding: '2px 6px', borderRadius: 4,
                  background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                  border: '1px solid rgba(245,158,11,0.4)',
                  fontFamily: "'Cinzel',serif",
                }}>{t('carousel.badge')}</span>
              </div>

              <div style={{ padding: '10px 12px' }}>
                <p className="cinzel" style={{
                  fontSize: 12, color: 'var(--text-primary)', marginBottom: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {l.item_name}
                </p>
                <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>
                  {formatPrecio(l.price_gold, l.price_money, l.currency_label)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {l.profiles?.username || '—'} · ⭐ {l.profiles?.avg_rating?.toFixed(1) || '—'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
