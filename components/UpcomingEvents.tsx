'use client'
import Link from 'next/link'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

export default function UpcomingEvents({ tournaments }: { tournaments: any[] }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>PRÓXIMOS EVENTOS</div>
        <Link href="/torneos" style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: 1 }}>VER TODOS ›</Link>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < tournaments.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${fc}18`, border: `1px solid ${fc}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏆</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ background: `${fc}18`, color: fc, border: `1px solid ${fc}33`, padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1 }}>
                  {FORMAT_LABEL[t.formato as TournamentFormat]}
                </span>
                <span style={{ background: st.bg, color: st.color, padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1 }}>
                  {st.label}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
