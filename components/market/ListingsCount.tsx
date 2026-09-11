'use client'
import { useLanguage } from '@/lib/market/i18n'

export default function ListingsCount({ count }: { count: number }) {
  const { t } = useLanguage()
  if (!count || count <= 0) return null
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-muted)', marginBottom: 12, maxWidth: 960, margin: '0 auto 12px',
    }}>
      {count} {count === 1 ? t('listings.found_one') : t('listings.found_many')}
    </div>
  )
}
