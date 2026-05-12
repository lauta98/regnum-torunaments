'use client'
/* StatsBar — 6 métricas con iconos SVG y datos reales */

const IconTrophy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)
const IconPeople = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconSwords = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
    <line x1="5" y1="11" x2="11" y2="5"/>
    <line x1="8" y1="8" x2="4" y2="4"/>
  </svg>
)
const IconMedal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="15" r="7"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    <path d="M10 5.5a5 5 0 0 1 4 0"/><path d="M8.21 13.89C8.07 13.27 8 12.64 8 12a4 4 0 0 1 8 0c0 .64-.07 1.27-.21 1.89"/>
  </svg>
)
const IconVideo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

interface StatsBarProps {
  totalTorneos: number
  totalJugadores: number
  totalMatches: number
}

export default function StatsBar({ totalTorneos, totalJugadores, totalMatches }: StatsBarProps) {
  const stats = [
    { icon: <IconTrophy />,   label: 'Torneos Jugados',       value: totalTorneos.toLocaleString('es-AR'),   delta: 'históricos', color: '#d4af37' },
    { icon: <IconPeople />,   label: 'Jugadores Registrados', value: totalJugadores.toLocaleString('es-AR'), delta: 'en rankings',  color: '#4CAF50' },
    { icon: <IconSwords />,   label: 'Combates Registrados',  value: totalMatches.toLocaleString('es-AR'),   delta: 'disputados',  color: '#F44336' },
    { icon: <IconMedal />,    label: 'MVPs Entregados',       value: '—',                                    delta: 'próximamente', color: '#8a2be2' },
    { icon: <IconVideo />,    label: 'Highlights Subidos',    value: '—',                                    delta: 'próximamente', color: '#2196F3' },
    { icon: <IconCalendar />, label: 'Temporadas Activas',    value: '1',                                    delta: 'en curso',     color: '#ff6b35' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
      {stats.map(({ icon, label, value, delta, color }) => (
        <div key={label} style={{
          background: '#0f0f0f',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '18px 20px',
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}44`)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, marginBottom: 12,
          }}>
            {icon}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 11, color: '#4CAF50' }}>{delta}</div>
        </div>
      ))}
    </div>
  )
}
