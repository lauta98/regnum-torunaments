'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FORMATS, FORMAT_LABEL, CLASES, CLASE_LABEL, BRACKET_TYPES, BRACKET_TYPE_LABEL } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus, Clase, BracketType } from '@/lib/types'
import TrofeoPicker from '@/components/TrofeoPicker'
import VistaPreviaTorneo from '@/components/VistaPreviaTorneo'
import CoOrganizadoresPicker from '@/components/CoOrganizadoresPicker'

const ESTADOS: TournamentStatus[] = ['draft', 'inscripciones', 'live', 'finalizado']
const ESTADO_LABEL: Record<TournamentStatus, string> = {
  draft: 'Borrador', inscripciones: 'Inscripciones', live: 'En vivo', finalizado: 'Finalizado',
}

export default function EditarTorneoForm({ torneo, isAdmin = true }: { torneo: any; isAdmin?: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: torneo.nombre ?? '',
    descripcion: torneo.descripcion ?? '',
    formato: torneo.formato as TournamentFormat,
    estado: torneo.estado as TournamentStatus,
    subclases: (torneo.subclases_permitidas ?? []) as Clase[],
    fecha_inicio: torneo.fecha_inicio ?? '',
    fecha_fin: torneo.fecha_fin ?? '',
    max_equipos: torneo.max_equipos ?? 8,
    premio: torneo.premio ?? '',
    reglamento: torneo.reglamento ?? '',
    destacado: torneo.destacado ?? false,
    organizador_verificado: torneo.organizador_verificado ?? false,
    trofeo_id: torneo.trofeo_id ?? null as string | null,
    trofeo_subcampeon_id: torneo.trofeo_subcampeon_id ?? null as string | null,
    escudo_id: torneo.escudo_id ?? null as string | null,
    bracket_type: torneo.bracket_type as BracketType,
    playoff_cupo: torneo.playoff_cupo ?? 4,
    playoff_bracket_type: (torneo.playoff_bracket_type ?? 'single_elimination') as 'single_elimination' | 'double_elimination',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [miPlayerId, setMiPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('players').select('id').eq('user_id', user.id).single()
        .then(({ data }) => setMiPlayerId(data?.id ?? null))
    })
  }, [])

  const toggleSubclase = (c: Clase) => {
    setForm(f => ({ ...f, subclases: f.subclases.includes(c) ? f.subclases.filter(x => x !== c) : [...f.subclases, c] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es requerido.')
    if (!form.fecha_inicio) return setError('La fecha de inicio es requerida.')
    setLoading(true); setError(''); setSaved(false)

    const res = await fetch(`/api/torneos/${torneo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        formato: form.formato,
        subclases_permitidas: form.subclases.length > 0 ? form.subclases : null,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        max_equipos: form.max_equipos,
        premio: form.premio.trim() || null,
        reglamento: form.reglamento.trim() || null,
        trofeo_id: form.trofeo_id,
        trofeo_subcampeon_id: form.trofeo_subcampeon_id,
        escudo_id: form.escudo_id,
        bracket_type: form.bracket_type,
        playoff_cupo: form.bracket_type === 'league_cup' ? form.playoff_cupo : null,
        playoff_bracket_type: form.bracket_type === 'league_cup' ? form.playoff_bracket_type : null,
        ...(isAdmin ? { estado: form.estado, destacado: form.destacado, organizador_verificado: form.organizador_verificado } : {}),
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="cor-editar-torneo" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
      <style>{`
        @media (max-width: 820px) {
          .cor-editar-torneo { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

        <div className="card-section">
          <div className="card-section__title">Identidad</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">NOMBRE DEL TORNEO</label>
              <input className="field" value={form.nombre} maxLength={80} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">DESCRIPCIÓN</label>
              <textarea
                className="field" style={{ resize: 'vertical', minHeight: 80 }}
                value={form.descripcion} maxLength={500}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="card-section">
          <div className="card-section__title">Formato y reglas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">FORMATO</label>
              <div className="segmented">
                {FORMATS.map(f => {
                  const active = form.formato === f
                  return (
                    <button type="button" key={f} className={`segmented-btn${active ? ' is-active' : ''}`}
                      onClick={() => setForm(frm => ({ ...frm, formato: f }))}>
                      {FORMAT_LABEL[f]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="field-label">SUBCLASES QUE PUEDEN PARTICIPAR</label>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>Ninguna seleccionada = todas.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CLASES.map(c => {
                  const active = form.subclases.includes(c)
                  return (
                    <button type="button" key={c} onClick={() => toggleSubclase(c)} style={{
                      padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                      background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                      color: active ? 'var(--gold)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                    }}>{CLASE_LABEL[c]}</button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card-section">
          <div className="card-section__title">Tipo de cuadro</div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
            Si ya generaste el cuadro y lo cambiás acá, los partidos actuales se borran — vas a tener que generar el cuadro de nuevo desde la página del torneo.
          </p>
          <div className="segmented">
            {BRACKET_TYPES.map(bt => {
              const active = form.bracket_type === bt
              return (
                <button type="button" key={bt} className={`segmented-btn${active ? ' is-active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, bracket_type: bt }))}>
                  {BRACKET_TYPE_LABEL[bt]}
                </button>
              )
            })}
          </div>
          {form.bracket_type === 'league_cup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
              <div>
                <label className="field-label">CUPO A COPA</label>
                <input
                  type="number" min={2} className="field" value={form.playoff_cupo}
                  onChange={e => setForm(f => ({ ...f, playoff_cupo: parseInt(e.target.value) || 0 }))}
                />
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  Cuántos de los mejores puestos de la liga pasan a la copa.
                </p>
              </div>
              <div>
                <label className="field-label">FORMATO DE LA COPA</label>
                <div className="segmented">
                  {(['single_elimination', 'double_elimination'] as const).map(bt => {
                    const active = form.playoff_bracket_type === bt
                    return (
                      <button type="button" key={bt} className={`segmented-btn${active ? ' is-active' : ''}`}
                        onClick={() => setForm(f => ({ ...f, playoff_bracket_type: bt }))}>
                        {BRACKET_TYPE_LABEL[bt]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card-section">
          <div className="card-section__title">Fechas y cupo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="field-label">FECHA DE INICIO</label>
                <input type="date" className="field" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">FECHA DE FIN (opcional)</label>
                <input type="date" className="field" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="field-label">MÁX. EQUIPOS</label>
              <select className="field" value={form.max_equipos} onChange={e => setForm(f => ({ ...f, max_equipos: parseInt(e.target.value) }))}>
                {[4, 8, 16, 32, 64].map(n => <option key={n} value={n}>{n} equipos</option>)}
              </select>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="card-section">
            <div className="card-section__title">Panel de administración</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label">ESTADO</label>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  Override manual — para el flujo normal usá los botones de la página del torneo (abrir inscripciones, generar cuadro, finalizar).
                </p>
                <div className="segmented">
                  {ESTADOS.map(s => {
                    const active = form.estado === s
                    return (
                      <button type="button" key={s} className={`segmented-btn${active ? ' is-active' : ''}`}
                        onClick={() => setForm(f => ({ ...f, estado: s }))}>
                        {ESTADO_LABEL[s]}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="field-label">DESTACADO</label>
                  <div className="segmented">
                    <button type="button" className={`segmented-btn${form.destacado ? ' is-active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, destacado: !f.destacado }))}>
                      {form.destacado ? '★ Destacado' : '☆ No destacado'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="field-label">ORGANIZADOR VERIFICADO</label>
                  <div className="segmented">
                    <button type="button" className={`segmented-btn${form.organizador_verificado ? ' is-active is-success' : ''}`}
                      onClick={() => setForm(f => ({ ...f, organizador_verificado: !f.organizador_verificado }))}>
                      {form.organizador_verificado ? '✓ Verificado' : 'Sin verificar'}
                    </button>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                &quot;Organizador verificado&quot; es un sello de confianza — no afecta el cálculo de MMR.
              </p>
            </div>
          </div>
        )}

        {(isAdmin || (miPlayerId && miPlayerId === torneo.creator_id)) && (
          <div className="card-section">
            <div className="card-section__title">Co-organizadores</div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
              Colaboradores puntuales de este torneo — pueden generar el cuadro, cargar resultados y editar estos datos, pero no pueden expulsar jugadores ni gestionar esta lista.
            </p>
            <CoOrganizadoresPicker torneoId={torneo.id} />
          </div>
        )}

        <div className="card-section">
          <div className="card-section__title">Trofeos del torneo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="field-label">COPA DEL CAMPEÓN</label>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                El campeón va a mostrar esta copa en vez del trofeo genérico.
              </p>
              {miPlayerId ? (
                <TrofeoPicker playerId={miPlayerId} value={form.trofeo_id} forma="copa" tipoNombre="copa"
                  onChange={id => setForm(f => ({ ...f, trofeo_id: id }))} />
              ) : (
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cargando…</p>
              )}
            </div>

            <div style={{ paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <label className="field-label">MEDALLA DEL SUBCAMPEÓN</label>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                El subcampeón va a mostrar esta medalla en vez de la genérica.
              </p>
              {miPlayerId ? (
                <TrofeoPicker playerId={miPlayerId} value={form.trofeo_subcampeon_id} forma="medalla" tipoNombre="medalla"
                  onChange={id => setForm(f => ({ ...f, trofeo_subcampeon_id: id }))} />
              ) : (
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cargando…</p>
              )}
            </div>

            <div style={{ paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <label className="field-label">ESCUDO DEL TORNEO</label>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                Puramente decorativo — no se le asigna a ningún puesto, solo identifica visualmente a este torneo en la llave y en los listados.
              </p>
              {miPlayerId ? (
                <TrofeoPicker playerId={miPlayerId} value={form.escudo_id} forma="escudo" tipoNombre="escudo"
                  onChange={id => setForm(f => ({ ...f, escudo_id: id }))} />
              ) : (
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cargando…</p>
              )}
            </div>
          </div>
        </div>

        <div className="card-section">
          <div className="card-section__title">Premio y reglamento</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">PREMIO (opcional)</label>
              <input className="field" value={form.premio} maxLength={100} onChange={e => setForm(f => ({ ...f, premio: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">REGLAMENTO (opcional)</label>
              <textarea
                className="field" style={{ resize: 'vertical', minHeight: 80 }}
                value={form.reglamento} maxLength={2000}
                onChange={e => setForm(f => ({ ...f, reglamento: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}
        {saved && !error && <p style={{ color: '#5BC98B', fontSize: 13, textAlign: 'center' }}>Guardado.</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => router.push(isAdmin ? '/admin' : '/organizador')}>
            Volver
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, letterSpacing: 1 }}>
            {loading ? 'Guardando...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </div>

      <VistaPreviaTorneo form={form} />
    </form>
  )
}
