'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Notif = {
  id: string
  type: string
  title: string
  body: string | null
  listing_id: string | null
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  contact: '📲',
  featured_approved: '⭐',
  featured_rejected: '❌',
  review: '🌟',
  message: '💬',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

export default function NotificacionesPage() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetch('/api/market/notificaciones')
      .then(r => r.json())
      .then(({ notifications }) => {
        setNotifs(notifications ?? [])
        setLoading(false)
      })
  }, [])

  const markAllRead = async () => {
    setMarkingAll(true)
    await fetch('/api/market/notificaciones', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setMarkingAll(false)
  }

  const markOneRead = async (id: string) => {
    if (notifs.find(n => n.id === id)?.read) return
    await fetch('/api/market/notificaciones', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifs.filter(n => !n.read).length

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 10, background: 'var(--dark-card)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 20px 60px', maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div>
          <h1 className="cinzel" style={{ fontSize: 20, color: 'var(--gold)', letterSpacing: 1, marginBottom: 4 }}>
            🔔 Notificaciones
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo leído'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            style={{
              background: 'none', border: '1px solid var(--dark-border)',
              color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 8,
              cursor: 'pointer', fontSize: 12, opacity: markingAll ? 0.5 : 1,
            }}
          >
            {markingAll ? 'Marcando...' : 'Marcar todo como leído'}
          </button>
        )}
      </div>

      {/* Lista */}
      {notifs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔕</div>
          <p className="cinzel" style={{ fontSize: 14, color: 'var(--text-muted)', letterSpacing: 1 }}>Sin notificaciones</p>
          <p style={{ fontSize: 13, color: 'var(--dark-border)', marginTop: 8 }}>
            Cuando alguien contacte tus publicaciones o haya novedades, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map(n => {
            const icon = TYPE_ICON[n.type] ?? '🔔'
            const card = (
              <div
                onClick={() => markOneRead(n.id)}
                style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '14px 16px', borderRadius: 10,
                  background: n.read ? 'var(--dark-card)' : 'rgba(201,168,76,0.06)',
                  border: `1px solid ${n.read ? 'var(--dark-border)' : 'rgba(201,168,76,0.25)'}`,
                  cursor: n.listing_id ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {/* Punto de no leído */}
                {!n.read && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#C9A84C',
                  }} />
                )}

                {/* Icono */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: n.read ? 'var(--dark-bg)' : 'rgba(201,168,76,0.1)',
                  border: `1px solid ${n.read ? 'var(--dark-border)' : 'rgba(201,168,76,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>{icon}</div>

                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: n.read ? 400 : 600,
                    color: n.read ? 'var(--text-muted)' : 'var(--text-primary)',
                    marginBottom: 4,
                  }}>{n.title}</p>
                  {n.body && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.body}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--dark-border)' }}>{timeAgo(n.created_at)}</p>
                </div>
              </div>
            )

            return n.listing_id ? (
              <Link key={n.id} href={`/listing/${n.listing_id}`} style={{ textDecoration: 'none' }}>
                {card}
              </Link>
            ) : (
              <div key={n.id}>{card}</div>
            )
          })}
        </div>
      )}

      {/* Link a tratos */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Link href="/market/transacciones" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          Ver también → Mis Tratos
        </Link>
      </div>
    </div>
  )
}
