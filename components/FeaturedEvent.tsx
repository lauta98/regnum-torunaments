'use client'
import Link from 'next/link'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

export default function FeaturedEvent({ tournament }: { tournament: any | null }) {
  const t = tournament

  if (!t) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0d0820 0%, #1a0d2e 50%, #0a0a0a 100%)', border: '1px solid var(--border-gold)', borderRadius: 16, padding: '28px', position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 1 }}>SIN EVENTO DESTACADO</div>
          <Link href="/torneos" style={{ display: 'inline-block', marginTop: 16, fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', textDecoration: 'none', letterSpacing: 1 }}>VER TODOS LOS TORNEOS →</Link>
        </div>
      </div>
    )
  }

  const fc = FORMAT_COLOR[t.formato as TournamentFormat]
  const st = STATUS_STYLE[t.estado as TournamentStatus]
  const inscritos = t.registros?.[0]?.count ?? 0

  return (
    <div style={{ background: 'linear-gradient(135deg, #0d0820 0%, #1a0d2e 50%, #0a0a0a 100%)', border: '1px solid var(--border-gold)', borderRadius: 16, padding: '28px', position: 'relative', overflow: 'hidden', height: '100%' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(circle, ${fc}44 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--gold)', letterSpacing: 3, marginBottom: 16 }}>
        — EVENTO DESTACADO —
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <span style={{ background: `${fc}22`, color: fc, border: `1px solid ${fc}44`, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1 }}>
          {FORMAT_LABEL[t.formato as TournamentFormat]}
        </span>
        <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 1 }}>
          {t.estado === 'live' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F44336', marginRight: 5 }} />}
          {st.label}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 10 }}>
        {t.nombre}
      </div>

      {t.descripcion && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>{t.descripcion}</p>
      )}

      <div style={{ display: 'flex', gap: 20, marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
        <span>📅 {new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span>👥 {inscritos}/{t.max_equipos}</span>
        {t.premio && <span>🏆 {t.premio}</span>}
      </div>

      <Link href={`/brackets/${t.id}`} style={{
        background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--gold)',
        padding: '10px 20px', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 12, letterSpacing: 1, cursor: 'pointer', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        VER BRACKET ›
      </Link>
    </div>
  )
}
