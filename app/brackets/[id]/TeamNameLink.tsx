'use client'
import { useState } from 'react'
import Link from 'next/link'

type Miembro = { id: string; nickname_juego: string; player_id: string | null }

/** Nombre de equipo clickeable. En 1v1 el "equipo" es un solo jugador,
 *  así que va directo a su perfil. En 2v2/3v3/7v7 un click abre la lista
 *  de todos los integrantes (cada uno con su propio link) en vez de
 *  mandar a ciegas al perfil del capitán — el equipo no es una sola
 *  persona. */
export default function TeamNameLink({
  nombre, miembros, style, title,
}: {
  nombre: string
  miembros: Miembro[]
  style?: React.CSSProperties
  title?: string
}) {
  const [open, setOpen] = useState(false)

  if (miembros.length <= 1) {
    const m = miembros[0]
    if (!m?.player_id) return <span title={title} style={style}>{nombre}</span>
    return (
      <Link href={`/jugadores/${m.player_id}`} title={title} style={{ ...style, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
        {nombre}
      </Link>
    )
  }

  return (
    <div style={{ position: 'relative', minWidth: 0, flex: 1 }}>
      <span
        title={title}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        style={{ ...style, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}
      >
        {nombre}
      </span>
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, minWidth: 160,
            padding: '8px 10px', borderRadius: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
            boxShadow: 'var(--shadow-elevated)', display: 'flex', flexDirection: 'column', gap: 4,
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 2 }}>
            INTEGRANTES
          </div>
          {miembros.map(m => m.player_id ? (
            <Link
              key={m.id} href={`/jugadores/${m.player_id}`} onClick={() => setOpen(false)}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              {m.nickname_juego}
            </Link>
          ) : (
            <span key={m.id} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)' }}>
              {m.nickname_juego}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
