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
          className="field"
          style={{
            appearance: 'none',
            width: 'auto',
            padding: '8px 32px 8px 14px',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
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
