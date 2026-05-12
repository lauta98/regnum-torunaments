'use client'
import Link from 'next/link'

const IconPlay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const IconHeart = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

export default function HighlightsSection({ highlights }: { highlights: any[] }) {
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#2196F3' }}><IconVideo /></span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Highlights Destacados</span>
        </div>
        <Link href="/eventos" style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          Ver Todos <span style={{ fontSize: 13 }}>›</span>
        </Link>
      </div>

      {highlights.length === 0 ? (
        /* Empty state */
        <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(33,150,243,0.1)', border: '1px solid rgba(33,150,243,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2196F3', marginBottom: 4 }}>
            <IconPlay />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Highlights próximamente</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, lineHeight: 1.5 }}>
            Las mejores jugadas de los torneos aparecerán aquí.
          </div>
        </div>
      ) : (
        highlights.map((h: any, i: number) => (
          <div key={h.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
            borderBottom: i < highlights.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            {/* Thumbnail */}
            <div style={{ width: 72, height: 48, borderRadius: 8, background: 'rgba(33,150,243,0.1)', border: '1px solid rgba(33,150,243,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
              {h.thumbnail_url
                ? <img src={h.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ color: 'rgba(33,150,243,0.6)' }}><IconPlay /></div>}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.titulo}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{h.jugador?.nickname_juego ?? '—'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <IconHeart /> {h.likes ?? 0}
              </div>
            </div>

            {/* Ver */}
            <a href={h.video_url} target="_blank" rel="noopener noreferrer" style={{
              background: 'rgba(33,150,243,0.1)', border: '1px solid rgba(33,150,243,0.25)',
              color: '#2196F3', padding: '5px 12px', borderRadius: 6,
              fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
              textDecoration: 'none', flexShrink: 0, transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(33,150,243,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(33,150,243,0.1)' }}
            >
              Ver
            </a>
          </div>
        ))
      )}
    </div>
  )
}
