'use client'
import Link from 'next/link'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

const IconTrophyLg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)

export default function FeaturedEvent({ tournament }: { tournament: any | null }) {
  const t = tournament

  if (!t) {
    return (
      <div style={{
        background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 280, textAlign: 'center',
      }}>
        <div style={{ color: 'rgba(212,175,55,0.3)', marginBottom: 12 }}><IconTrophyLg /></div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 16 }}>SIN EVENTO DESTACADO</div>
        <Link href="/torneos" style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', textDecoration: 'none', letterSpacing: 1 }}>VER TORNEOS →</Link>
      </div>
    )
  }

  const fc = FORMAT_COLOR[t.formato as TournamentFormat]
  const st = STATUS_STYLE[t.estado as TournamentStatus]
  const inscritos = t.registros?.[0]?.count ?? 0

  return (
    <div style={{
      background: '#0f0f0f',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '24px 26px',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', minHeight: 280,
    }}>
      {/* Glow accent */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: `radial-gradient(circle, ${fc}20 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{
          background: 'rgba(212,175,55,0.12)', color: 'var(--gold)',
          border: '1px solid rgba(212,175,55,0.25)',
          padding: '4px 12px', borderRadius: 20,
          fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 2, fontWeight: 700,
        }}>
          EVENTO DESTACADO
        </div>
        <div style={{ color: 'rgba(212,175,55,0.4)' }}><IconTrophyLg /></div>
      </div>

      {/* Format + Status badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ background: `${fc}18`, color: fc, border: `1px solid ${fc}33`, padding: '4px 11px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5 }}>
          {FORMAT_LABEL[t.formato as TournamentFormat]}
        </span>
        <span style={{ background: st.bg, color: st.color, padding: '4px 11px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
          {t.estado === 'live' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F44336' }} />}
          {st.label}
        </span>
        {t.descripcion && (
          <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '4px 11px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5 }}>
            {t.formato === '7v7' ? 'CLANES' : t.formato === '2v2' ? 'EQUIPOS' : 'EXCLUSIVO'}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: 8, flex: 1 }}>
        {t.nombre}
      </div>

      {t.descripcion && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
          {t.descripcion.length > 80 ? t.descripcion.slice(0, 80) + '…' : t.descripcion}
        </p>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>📅</span>
          {new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>👥</span>
          {inscritos}/{t.max_equipos}
        </span>
        {t.premio && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 14 }}>🎁</span>{t.premio}</span>}
      </div>

      {/* CTA */}
      <Link href={`/brackets/${t.id}`} style={{
        background: 'transparent', border: '1px solid rgba(212,175,55,0.35)',
        color: 'var(--gold)', padding: '10px 20px', borderRadius: 8,
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
        cursor: 'pointer', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'all 0.15s', alignSelf: 'flex-start',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)' }}
      >
        Ver Detalles ›
      </Link>
    </div>
  )
}
