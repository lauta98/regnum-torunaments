'use client'
import { useRouter } from 'next/navigation'
import { CLASE_LABEL, ARQUETIPOS, type Arquetipo } from '@/lib/constants'
import type { Clase } from '@/lib/types'

// Mismo mapeo de ícono por arquetipo que TorneoCard — cada subclase toma el
// ícono/color de su arquetipo padre (Bárbaro y Caballero comparten el de
// "Guerreros"), porque no hay un ícono de línea propio por subclase todavía.
const ARQUETIPO_ICON: Record<Arquetipo, React.ReactNode> = {
  guerreros: <path d="M3.75 13.5 14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" strokeLinecap="round" strokeLinejoin="round" />,
  magos: <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" strokeLinecap="round" strokeLinejoin="round" />,
  arqueros: <path d="M15.59 14.37a5 5 0 0 1-.77 6.13l-.72.71a.75.75 0 0 1-1.06 0l-.71-.72a5 5 0 0 1 6.13-.77m-8.98-8.98a5 5 0 0 1 .77-6.13l.72-.71a.75.75 0 0 1 1.06 0l.71.72a5 5 0 0 1-6.13.77m2.12 7.07 4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />,
}
const claseArquetipo: Partial<Record<Clase, Arquetipo>> = {}
for (const key of Object.keys(ARQUETIPOS) as Arquetipo[]) {
  for (const c of ARQUETIPOS[key].clases) claseArquetipo[c] = key
}

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

  const Pill = ({ value, label, icon, color }: { value: string; label: string; icon?: React.ReactNode; color?: string }) => {
    const active = (actual ?? '') === value
    return (
      <button
        onClick={() => router.push(value ? `/torneos?formato=${formato}&sub=${value}` : `/torneos?formato=${formato}`)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
          background: active ? 'var(--bg-card)' : 'var(--bg-surface)',
          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
          border: 'none', cursor: 'pointer',
        }}
      >
        {icon && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">{icon}</svg>}
        {label}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Subclase
      </span>
      <Pill value="" label="Todas" />
      {opciones.map(c => {
        const arq = claseArquetipo[c]
        return <Pill key={c} value={c} label={CLASE_LABEL[c]} icon={arq ? ARQUETIPO_ICON[arq] : undefined} color={arq ? ARQUETIPOS[arq].color : undefined} />
      })}
    </div>
  )
}
