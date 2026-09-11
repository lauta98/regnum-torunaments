'use client'
import Link from 'next/link'
import { useLanguage } from '@/lib/market/i18n'
import { IconLock, IconUser, IconTag, IconTrash, IconPlus } from './LineIcons'

const TRUST_ITEMS = [
  { icon: IconLock, text: 'Sin datos de pago' },
  { icon: IconUser, text: 'Tu email es privado' },
  { icon: IconTag,  text: 'Gratis para usar' },
  { icon: IconTrash, text: 'Podés borrar tu cuenta' },
]

export default function HeroSection() {
  const { t } = useLanguage()
  return (
    <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, background: 'var(--gold)', transform: 'rotate(45deg)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase' }}>
            Mercado P2P entre jugadores
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display-v2)', fontSize: 32, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-primary)', textTransform: 'uppercase', margin: 0 }}>
              Champions of Commerce
            </h1>
            <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 16, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 520 }}>
              {t('hero.subtitle')}
            </p>
          </div>

          <Link href="/market/nuevo" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
            background: 'var(--gold)', color: '#050505', padding: '11px 22px',
            fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', fontWeight: 700,
            textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--gold-light)',
          }}>
            <IconPlus size={14} />
            Publicar un artículo
          </Link>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10,
          marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)',
        }}>
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-muted)' }}>
              <item.icon size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
              <span style={{ fontSize: 12 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
