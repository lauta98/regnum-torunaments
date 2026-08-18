'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FORMATS, FORMAT_LABEL, FORMAT_COLOR, CLASES, CLASE_LABEL } from '@/lib/constants'
import type { TournamentFormat, TournamentStatus, Clase } from '@/lib/types'

const ESTADOS: TournamentStatus[] = ['draft', 'inscripciones', 'live', 'finalizado']
const ESTADO_LABEL: Record<TournamentStatus, string> = {
  draft: 'Borrador', inscripciones: 'Inscripciones', live: 'En vivo', finalizado: 'Finalizado',
}

export default function EditarTorneoForm({ torneo }: { torneo: any }) {
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
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

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
        estado: form.estado,
        subclases_permitidas: form.subclases.length > 0 ? form.subclases : null,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        max_equipos: form.max_equipos,
        premio: form.premio.trim() || null,
        reglamento: form.reglamento.trim() || null,
        destacado: form.destacado,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }
    setSaved(true)
    router.refresh()
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)',
    borderRadius: 8, color: 'var(--text-primary)', padding: '10px 14px',
    fontSize: 14, fontFamily: 'var(--font-display)', outline: 'none', boxSizing: 'border-box',
  } as const

  const labelStyle = {
    display: 'block', fontFamily: 'var(--font-display)', fontSize: 11,
    color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6,
  } as const

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={labelStyle}>NOMBRE DEL TORNEO</label>
        <input style={inputStyle} value={form.nombre} maxLength={80} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      </div>

      <div>
        <label style={labelStyle}>DESCRIPCIÓN</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          value={form.descripcion} maxLength={500}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
        />
      </div>

      <div>
        <label style={labelStyle}>FORMATO</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {FORMATS.map(f => {
            const fc = FORMAT_COLOR[f]
            const active = form.formato === f
            return (
              <button type="button" key={f} onClick={() => setForm(frm => ({ ...frm, formato: f }))} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${active ? fc : 'var(--border)'}`,
                background: active ? `${fc}18` : 'transparent',
                color: active ? fc : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
              }}>{FORMAT_LABEL[f]}</button>
            )
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>ESTADO</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ESTADOS.map(s => {
            const active = form.estado === s
            return (
              <button type="button" key={s} onClick={() => setForm(f => ({ ...f, estado: s }))} style={{
                flex: '1 1 100px', padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                color: active ? 'var(--gold)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              }}>{ESTADO_LABEL[s]}</button>
            )
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>SUBCLASES QUE PUEDEN PARTICIPAR</label>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>FECHA DE INICIO</label>
          <input type="date" style={inputStyle} value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>FECHA DE FIN (opcional)</label>
          <input type="date" style={inputStyle} value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>MÁX. EQUIPOS</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.max_equipos} onChange={e => setForm(f => ({ ...f, max_equipos: parseInt(e.target.value) }))}>
            {[4, 8, 16, 32, 64].map(n => <option key={n} value={n}>{n} equipos</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>DESTACADO</label>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, destacado: !f.destacado }))}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${form.destacado ? 'var(--gold)' : 'var(--border)'}`,
              background: form.destacado ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: form.destacado ? 'var(--gold)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
            }}
          >
            {form.destacado ? '★ Destacado' : '☆ No destacado'}
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>PREMIO (opcional)</label>
        <input style={inputStyle} value={form.premio} maxLength={100} onChange={e => setForm(f => ({ ...f, premio: e.target.value }))} />
      </div>

      <div>
        <label style={labelStyle}>REGLAMENTO (opcional)</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          value={form.reglamento} maxLength={2000}
          onChange={e => setForm(f => ({ ...f, reglamento: e.target.value }))}
        />
      </div>

      {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}
      {saved && !error && <p style={{ color: '#5BC98B', fontSize: 13, textAlign: 'center' }}>Guardado.</p>}

      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <button type="button" onClick={() => router.push('/admin')} style={{
          flex: 1, padding: '12px', borderRadius: 10,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13, cursor: 'pointer',
        }}>
          Volver
        </button>
        <button type="submit" disabled={loading} style={{
          flex: 2, padding: '12px', borderRadius: 10, border: 'none',
          background: loading ? 'var(--bg-surface)' : 'var(--gold)',
          color: loading ? 'var(--text-muted)' : '#000',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Guardando...' : 'GUARDAR CAMBIOS'}
        </button>
      </div>
    </form>
  )
}
