import { FORMAT_LABEL, FORMAT_COLOR, STATUS_STYLE } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus } from '@/lib/types'

type PreviewForm = {
  nombre: string
  formato: TournamentFormat
  estado: TournamentStatus
  fecha_inicio: string
  fecha_fin: string
  max_equipos: number
  premio: string
  destacado: boolean
  organizador_verificado: boolean
}

/** Panel lateral que refleja en vivo cómo se va a ver el torneo con los
 *  datos que el organizador está cargando — le da un propósito real al
 *  espacio ganado al ensanchar el formulario, en vez de dejarlo vacío. */
export default function VistaPreviaTorneo({ form }: { form: PreviewForm }) {
  const fc = FORMAT_COLOR[form.formato]
  const st = STATUS_STYLE[form.estado]
  const fecha = form.fecha_inicio
    ? new Date(form.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="card-section" style={{ position: 'sticky', top: 24 }}>
      <div className="card-section__title">Vista previa</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ background: `${fc}18`, color: fc, border: `1px solid ${fc}33`, padding: '3px 9px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5 }}>
          {FORMAT_LABEL[form.formato]}
        </span>
        <span style={{ background: st.bg, color: st.color, padding: '3px 9px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          {form.estado === 'live' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F44336', display: 'inline-block' }} />}
          {st.label}
        </span>
        {form.destacado && (
          <span style={{ background: 'var(--gold-muted)', color: 'var(--gold)', padding: '3px 9px', borderRadius: 6, fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5 }}>
            ★ Destacado
          </span>
        )}
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {form.nombre || <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Sin nombre todavía</span>}
        {form.organizador_verificado && (
          <span title="Organizador verificado" style={{ color: '#4CAF50', marginLeft: 6, fontSize: 13 }}>✓</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <PreviewRow label="Fecha" value={fecha ?? '—'} />
        <PreviewRow label="Cupo" value={`${form.max_equipos} equipos`} />
        {form.premio && <PreviewRow label="Premio" value={form.premio} />}
      </div>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}
