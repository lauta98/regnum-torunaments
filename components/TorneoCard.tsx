import Link from 'next/link'
import { FORMAT_COLOR, FORMAT_LABEL, STATUS_STYLE, temaTorneo } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus, Clase } from '@/lib/types'

/** Tarjeta de torneo compartida entre /torneos y /brackets. Antes cada
 *  página tenía su propia versión ligeramente distinta, coloreada solo
 *  por formato (1v1/2v2/...) — no había forma de distinguir a simple
 *  vista un torneo de Magos de uno de Guerreros o de Arqueros. Ahora el
 *  color/ícono principal sale de las subclases permitidas (ver
 *  lib/constants.ts:temaTorneo) y el formato queda como dato secundario. */
export default function TorneoCard({ torneo: t, showCreator = true }: { torneo: any; showCreator?: boolean }) {
  const fc = FORMAT_COLOR[t.formato as TournamentFormat] ?? '#d4af37'
  const st = STATUS_STYLE[t.estado as TournamentStatus]
  const tema = temaTorneo(t.subclases_permitidas as Clase[] | null)
  const mainColor = tema?.color ?? fc
  const inscritos = t.registros?.[0]?.count ?? 0

  return (
    <Link href={`/brackets/${t.id}`} style={{ textDecoration: 'none' }}>
      <div className="card-hover torneo-card" style={{
        position: 'relative', overflow: 'hidden', borderRadius: 14,
        background: t.destacado
          ? `radial-gradient(120% 100% at 100% 0%, ${mainColor}14 0%, #0d0d0d 55%), #0a0a0a`
          : `radial-gradient(120% 100% at 100% 0%, ${mainColor}0d 0%, #0a0a0a 55%)`,
        border: `1px solid ${t.destacado ? mainColor + '55' : mainColor + '26'}`,
        boxShadow: t.estado === 'live' ? `0 0 0 1px ${mainColor}22, 0 12px 28px -14px ${mainColor}55` : '0 8px 20px -12px rgba(0,0,0,0.5)',
        ['--hover-color' as string]: mainColor,
      } as React.CSSProperties}
      >
        {/* Ícono de arquetipo/clase como marca de agua — le da carácter a
            la tarjeta sin competir con el texto. */}
        {tema && (
          <div style={{
            position: 'absolute', right: -10, bottom: -18, fontSize: 96, lineHeight: 1,
            opacity: 0.07, transform: 'rotate(-8deg)', pointerEvents: 'none', userSelect: 'none',
          }}>
            {tema.icon}
          </div>
        )}

        {/* Barra superior */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${mainColor}, ${mainColor}22)` }} />

        <div style={{ position: 'relative', padding: '18px 20px' }}>
          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {tema ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: `${mainColor}20`, color: mainColor, border: `1px solid ${mainColor}44`,
                  padding: '3px 10px 3px 8px', borderRadius: 20, fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                }}>
                  <span style={{ fontSize: 11 }}>{tema.icon}</span>{tema.label}
                </span>
              ) : (
                <span style={{ background: `${fc}18`, color: fc, border: `1px solid ${fc}33`, padding: '3px 9px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5 }}>
                  {FORMAT_LABEL[t.formato as TournamentFormat] ?? t.formato}
                </span>
              )}
              {tema && (
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 0.5, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 8px' }}>
                  {FORMAT_LABEL[t.formato as TournamentFormat] ?? t.formato}
                </span>
              )}
              {t.destacado && (
                <span style={{ color: 'var(--gold)', fontSize: 11 }} title="Destacado">★</span>
              )}
            </div>
            <span style={{
              flexShrink: 0, background: st.bg, color: st.color, padding: '3px 9px', borderRadius: 6,
              fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {t.estado === 'live' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F44336' }} />}
              {st.label}
            </span>
          </div>

          {/* Título */}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3, letterSpacing: 0.3 }}>
            {t.nombre}
          </h2>

          {t.descripcion && (
            <p style={{
              fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {t.descripcion}
            </p>
          )}

          {/* Meta */}
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>📅 {new Date(t.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span>👥 {inscritos}{t.max_equipos ? `/${t.max_equipos}` : ''}</span>
            {t.premio && <span>🎁 {t.premio}</span>}
          </div>

          {/* Organizador */}
          {showCreator && t.creator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t.creator.discord_avatar
                  ? <img src={t.creator.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : <span style={{ fontSize: 8, color: mainColor }}>{t.creator.nickname_juego?.[0]}</span>}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>por <span style={{ color: 'var(--text-secondary)' }}>{t.creator.nickname_juego}</span></span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
