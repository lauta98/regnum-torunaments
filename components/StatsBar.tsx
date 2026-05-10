import type { CSSProperties } from 'react'

interface Stat {
  icon: string
  label: string
  value: string
  delta: string
}

const STATS: Stat[] = [
  { icon: '⚔️', label: 'TORNEOS JUGADOS',      value: '128',    delta: '+12 este mes' },
  { icon: '👥', label: 'JUGADORES REGISTRADOS', value: '1.248',  delta: '+56 este mes' },
  { icon: '🗡️', label: 'COMBATES REGISTRADOS',  value: '15.683', delta: '+892 este mes' },
  { icon: '🏆', label: 'MVPs ENTREGADOS',        value: '342',    delta: '+18 este mes' },
]

const card: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-gold)',
  borderRadius: 12,
  padding: '20px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flex: 1,
}

export default function StatsBar() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {STATS.map(({ icon, label, value, delta }) => (
        <div key={label} style={card} className="hover-lift">
          <span style={{ fontSize: 36 }}>{icon}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#4CAF50', marginTop: 4 }}>{delta}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
