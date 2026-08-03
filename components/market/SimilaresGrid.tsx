'use client'
import Link from 'next/link'
import { RAREZA_COLOR, CAT_EMOJI, formatPrecioCard, listingHref } from '@/lib/market/constants'
import { getItemIconColored } from '@/lib/market/icons'

const GREY_CATS = new Set(['joyeria', 'crafting', 'minerales'])

function SimilarCard({ s }: { s: any }) {
  const sRarezaColor = s.rareza ? (RAREZA_COLOR[s.rareza] || '#C9A84C') : '#C9A84C'
  const sColor = GREY_CATS.has(s.item_category) ? '#7A8A9A' : sRarezaColor
  const { gold, money } = formatPrecioCard(s.price_gold, s.price_money, s.currency_label)
  const isSell = s.type === 'sell'
  let sSvg = ''
  try { sSvg = getItemIconColored(s.subcategoria || '', s.item_category, sColor) } catch { sSvg = '' }

  return (
    <Link href={listingHref(s.item_name, s.id, s.short_id)} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--dark-card)', border: `1px solid ${sColor}33`,
          borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s',
        }}
        onMouseOver={e => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = `${sColor}77`
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        }}
        onMouseOut={e => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = `${sColor}33`
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        }}
      >
        {/* Mini hero */}
        <div style={{
          height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `radial-gradient(circle at center, ${sColor}20 0%, ${sColor}06 60%, var(--dark-surface) 85%)`,
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: 6, left: 6,
            fontSize: 8, padding: '2px 6px', borderRadius: 3,
            fontFamily: "'Cinzel',serif", letterSpacing: 1, fontWeight: 700,
            background: isSell ? '#1a5c2e' : '#0f3460',
            color: isSell ? '#6EE89A' : '#7DC4FF',
            border: `1px solid ${isSell ? '#2d9b4e' : '#1e6db5'}`,
          }}>
            {isSell ? '▲' : '▼'}
          </span>
          {sSvg
            ? <div suppressHydrationWarning style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 6px ${sColor}55)` }} dangerouslySetInnerHTML={{ __html: sSvg }} />
            : <span style={{ fontSize: 28 }}>{CAT_EMOJI[s.item_category] || '📦'}</span>
          }
        </div>
        {/* Info */}
        <div style={{ padding: '8px 10px' }}>
          <div className="cinzel" style={{ fontSize: 11, color: sRarezaColor, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.item_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>
            {gold || money || <span style={{ color: 'var(--text-muted)' }}>A convenir</span>}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {s.profiles?.username || '—'}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function SimilaresGrid({ similares }: { similares: any[] }) {
  if (!similares?.length) return null
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, var(--dark-border), transparent)' }} />
        <span className="cinzel" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>
          PUBLICACIONES SIMILARES
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, var(--dark-border), transparent)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {similares.map((s: any) => <SimilarCard key={s.id} s={s} />)}
      </div>
    </div>
  )
}
