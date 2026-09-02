import Link from 'next/link'

const TIPO_LABEL: Record<string, string> = { youtube: '▶ YouTube', kick: '🟢 Kick' }

function hace(fecha: string) {
  const diffMs = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  if (days < 21) return `hace ${days}d`
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HighlightCard({ highlight }: { highlight: any }) {
  const h = highlight
  return (
    <a href={h.video_url} target="_blank" rel="noopener noreferrer" style={{
      display: 'block', textDecoration: 'none', background: 'var(--bg-card)',
      border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-card)', overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-surface)' }}>
        {h.thumbnail_url ? (
          <img src={h.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            {h.tipo === 'kick' ? '🟢' : '▶'}
          </div>
        )}
        <span style={{
          position: 'absolute', top: 8, left: 8, background: 'rgba(10,10,10,0.75)',
          color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 9,
          letterSpacing: 0.5, padding: '3px 8px', borderRadius: 4,
        }}>
          {TIPO_LABEL[h.tipo] ?? h.tipo}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
          {h.titulo}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{h.jugador?.discord_username ?? h.jugador?.nickname_juego ?? 'Jugador'}</span>
          <span>{hace(h.created_at)}</span>
        </div>
        {h.torneo?.nombre && (
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            🏆 {h.torneo.nombre}
          </div>
        )}
      </div>
    </a>
  )
}
