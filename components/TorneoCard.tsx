import Link from 'next/link'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE, temaTorneo } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus, Clase } from '@/lib/types'
import TrofeoBadge from './TrofeoBadge'

// Íconos de línea por arquetipo — mismos trazos que uso el mockup de Stitch,
// reemplazan el emoji que todavía devuelve ARQUETIPOS.icon (lib/constants.ts).
// No se tocó esa constante (es compartida) — el mapeo vive acá, local a la card.
const ARQUETIPO_ICON: Record<string, React.ReactNode> = {
  Guerreros: <path d="M3.75 13.5 14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" strokeLinecap="round" strokeLinejoin="round" />,
  Magos: <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" strokeLinecap="round" strokeLinejoin="round" />,
  Arqueros: <path d="M15.59 14.37a5 5 0 0 1-.77 6.13l-.72.71a.75.75 0 0 1-1.06 0l-.71-.72a5 5 0 0 1 6.13-.77m-8.98-8.98a5 5 0 0 1 .77-6.13l.72-.71a.75.75 0 0 1 1.06 0l.71.72a5 5 0 0 1-6.13.77m2.12 7.07 4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />,
}
const IconCalendar = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
const IconUsers = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0" strokeLinecap="round" strokeLinejoin="round" /></svg>
const IconGift = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" strokeLinecap="round" strokeLinejoin="round" /></svg>

/** Tarjeta de torneo compartida entre /torneos y /brackets. El color/ícono
 *  principal sale de las subclases permitidas (lib/constants.ts:temaTorneo);
 *  el formato queda como dato secundario. */
export default function TorneoCard({ torneo: t, showCreator = true }: { torneo: any; showCreator?: boolean }) {
  const fc = FORMAT_COLOR[t.formato as TournamentFormat] ?? 'var(--text-muted)'
  const st = STATUS_STYLE[t.estado as TournamentStatus]
  const tema = temaTorneo(t.subclases_permitidas as Clase[] | null)
  const mainColor = tema?.color ?? fc
  const inscritos = t.registros?.[0]?.count ?? 0
  const archIcon = tema ? ARQUETIPO_ICON[tema.label] : null

  return (
    <Link href={`/brackets/${t.id}`} style={{ textDecoration: 'none' }}>
      <div className="card-hover torneo-card" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%',
        background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden',
        ['--hover-color' as string]: mainColor,
      } as React.CSSProperties}
      >
        <div>
          <div style={{ height: 3, background: mainColor }} />
          <div style={{ padding: 16 }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'var(--bg-surface)', color: 'var(--text-secondary)',
                  padding: '3px 7px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {archIcon && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={mainColor} strokeWidth="2">{archIcon}</svg>}
                  {tema ? tema.label : (FORMAT_LABEL[t.formato as TournamentFormat] ?? t.formato)}
                </span>
                {tema && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    {FORMAT_LABEL[t.formato as TournamentFormat] ?? t.formato}
                  </span>
                )}
                {t.destacado && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--gold)"><title>Destacado</title><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                )}
                {t.escudo && <TrofeoBadge trofeo={t.escudo} size="xs" title={`Escudo: ${t.escudo.nombre}`} />}
              </div>
              <span style={{
                flexShrink: 0, background: st.bg, color: st.color, padding: '3px 8px',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {t.estado === 'live' && <span style={{ display: 'inline-block', width: 6, height: 6, background: st.color }} />}
                {st.label}
              </span>
            </div>

            {/* Título */}
            <h2 style={{ fontFamily: 'var(--font-display-v2)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.nombre}
            </h2>

            {t.descripcion && (
              <p style={{
                fontFamily: 'var(--font-display-v2)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {t.descripcion}
              </p>
            )}

            {/* Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: t.premio ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 8, background: 'var(--bg-surface)', padding: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}><IconCalendar />Fecha</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-primary)' }}>{new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}><IconUsers />Cupos</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-primary)' }}>{inscritos}{t.max_equipos ? `/${t.max_equipos}` : ''}</span>
              </div>
              {t.premio && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}><IconGift />Premio</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.premio}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Organizador */}
        {showCreator && t.creator && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
            <div style={{ width: 20, height: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t.creator.discord_avatar
                ? <img src={t.creator.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: mainColor }}>{t.creator.nickname_juego?.[0]}</span>}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{t.creator.nickname_juego}</span>
            {t.organizador_verificado && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--alsius)"><title>Organizador verificado</title><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver detalles
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
