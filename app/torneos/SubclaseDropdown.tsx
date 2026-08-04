'use client'
import { useRouter } from 'next/navigation'
import { CLASE_LABEL } from '@/lib/constants'
import type { Clase } from '@/lib/types'

export default function SubclaseDropdown({
  formato,
  actual,
  opciones,
}: {
  formato: string
  actual?: string
  opciones: Clase[]
}) {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
        SUBCLASE
      </span>
      <div style={{ position: 'relative' }}>
        <select
          value={actual ?? ''}
          onChange={e => {
            const v = e.target.value
            router.push(v ? `/torneos?formato=${formato}&sub=${v}` : `/torneos?formato=${formato}`)
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
          <option value="">Todas</option>
          {opciones.map(c => (
            <option key={c} value={c}>{CLASE_LABEL[c]}</option>
          ))}
        </select>
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--gold)', fontSize: 10,
        }}>▾</span>
      </div>
    </div>
  )
}
