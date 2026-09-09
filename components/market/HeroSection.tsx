'use client'
import Link from 'next/link'
import { useLanguage } from '@/lib/market/i18n'

export default function HeroSection() {
  const { t } = useLanguage()
  return (
    <div className="home-hero" style={{ textAlign: 'center', padding: '28px 16px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--burgundy) 25%, transparent) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <h1 className="cinzel home-hero-title" style={{ fontSize: 28, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
        CHAMPIONS OF COMMERCE
      </h1>
      <p className="home-hero-sub" style={{ color: 'var(--text-muted)', fontSize: 15, fontStyle: 'italic' }}>
        {t('hero.subtitle')}
      </p>
      <Link href="/market/nuevo" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
        background: 'linear-gradient(135deg, var(--cta-sell-from), var(--cta-sell-to))',
        color: '#fff', padding: '11px 26px', borderRadius: 8,
        fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: 1, fontWeight: 700,
        textDecoration: 'none', boxShadow: '0 2px 12px color-mix(in srgb, var(--cta-sell-to) 30%, transparent)', position: 'relative', zIndex: 1,
      }}>
        🗡 Publicar un artículo
      </Link>
      <div className="home-hero-line" style={{ width: 120, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', margin: '14px auto 0' }} />

      {/* Trust strip */}
      <div className="home-trust" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
        {[
          { icon: '🔒', text: 'Sin datos de pago' },
          { icon: '👤', text: 'Tu email es privado' },
          { icon: '🆓', text: 'Gratis para usar' },
          { icon: '🗑', text: 'Podés borrar tu cuenta' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.text}</span>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .home-hero { padding: 14px 16px 10px !important; }
          .home-hero-title { font-size: 20px !important; letter-spacing: 2px !important; margin-bottom: 0 !important; }
          .home-hero-sub { display: none; }
          .home-hero-line { display: none; }
          .home-trust { display: none !important; }
        }
      `}</style>
    </div>
  )
}
