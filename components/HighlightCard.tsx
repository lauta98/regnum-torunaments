const TIPO_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  youtube: { label: '▶ YouTube', color: '#FF0000', bg: 'linear-gradient(160deg, #1a0505, #0c0202)' },
  kick:    { label: '🟢 Kick',   color: '#53FC18', bg: 'linear-gradient(160deg, #0a1505, #050a02)' },
}

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
  const estilo = TIPO_STYLE[h.tipo] ?? TIPO_STYLE.youtube

  return (
    <a href={h.video_url} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', flexDirection: 'column', textDecoration: 'none', background: 'var(--bg-card)',
      border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-card)', overflow: 'hidden', height: '100%',
    }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: h.thumbnail_url ? 'var(--bg-surface)' : estilo.bg }}>
        {h.thumbnail_url ? (
          <img src={h.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: estilo.color, opacity: 0.85 }}>
            {h.tipo === 'kick' ? '🟢' : '▶'}
          </div>
        )}
        <span style={{
          position: 'absolute', top: 8, left: 8, background: 'rgba(10,10,10,0.8)',
          color: estilo.color, fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
          letterSpacing: 0.5, padding: '3px 8px', borderRadius: 4, border: `1px solid ${estilo.color}44`,
        }}>
          {estilo.label}
        </span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.35, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {h.titulo}
        </div>

        {h.torneo?.nombre && (
          <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            🏆 {h.torneo.nombre}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {h.jugador?.avatar_url
              ? <img src={h.jugador.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 10, fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>{(h.jugador?.discord_username ?? h.jugador?.nickname_juego ?? '?')[0]?.toUpperCase()}</span>}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {h.jugador?.discord_username ?? h.jugador?.nickname_juego ?? 'Jugador'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{hace(h.created_at)}</span>
        </div>
      </div>
    </a>
  )
}
