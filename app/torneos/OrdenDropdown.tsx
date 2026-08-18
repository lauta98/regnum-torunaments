'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OrdenDropdown() {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
        ORDENAR
      </span>
      <div style={{ position: 'relative' }}>
        <select
          value={searchParams.get('orden') ?? 'recientes'}
          onChange={e => {
            const next = new URLSearchParams(searchParams.toString())
            if (e.target.value === 'recientes') next.delete('orden')
            else next.set('orden', e.target.value)
            router.push(`/torneos${next.toString() ? `?${next.toString()}` : ''}`)
          }}
          style={{
            appearance: 'none',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            padding: '8px 32px 8px 14px',
            fontSize: 12,
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
        </select>
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--gold)', fontSize: 10,
        }}>▾</span>
      </div>
    </div>
  )
}
