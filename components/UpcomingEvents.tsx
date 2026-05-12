'use client'
import Link from 'next/link'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

const IconTrophySm = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)

export default function UpcomingEvents({ tournaments }: { tournaments: any[] }) {
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--gold)' }}><IconTrophySm /></span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Próximos Eventos</span>
        </div>
        <Link href="/torneos" style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          Ver Todos <span style={{ fontSize: 13 }}>›</span>
        </Link>
      </div>

      {tournaments.length === 0 && (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12 }}>
          No hay eventos próximos.
        </div>
      )}

      {tournaments.map((t: any, i: number) => {
        const fc = FORMAT_COLOR[t.formato as TournamentFormat]
        const st = STATUS_STYLE[t.estado as TournamentStatus]
        return (
          <Link key={t.id} href={`/brackets/${t.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
              borderBottom: i < tournaments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `${fc}15`, border: `1px solid ${fc}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: fc,
              }}>
                <IconTrophySm />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.nombre}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Badge */}
              <span style={{
                background: `${fc}15`, color: fc, border: `1px solid ${fc}30`,
                padding: '3px 8px', borderRadius: 20,
                fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, flexShrink: 0,
              }}>
                {FORMAT_LABEL[t.formato as TournamentFormat]}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
