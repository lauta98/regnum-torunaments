'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OrdenDropdown() {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '4px 10px 4px 12px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Orden:
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
            appearance: 'none', width: 'auto', border: 'none', background: 'transparent',
            padding: '2px 18px 2px 0', fontFamily: 'var(--font-mono)', fontSize: 11.5,
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
        </select>
        <span style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 9,
        }}>▾</span>
      </div>
    </div>
  )
}
