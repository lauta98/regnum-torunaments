'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { FORMATS, FORMAT_LABEL, BRACKET_TYPES, BRACKET_TYPE_LABEL } from '@/lib/constants'
import type { TournamentFormat, BracketType } from '@/lib/types'
import Header from '@/components/Header'
import dynamic from 'next/dynamic'

const sectionStyle: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '20px 22px' }
const sectionTitleStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }

function NuevoTorneoPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '',
    formato: '1v1' as TournamentFormat,
    bracket_type: 'single_elimination' as BracketType,
    fecha_inicio: '',
    playoff_cupo: 4,
    playoff_bracket_type: 'single_elimination' as 'single_elimination' | 'double_elimination',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es requerido.')
    if (!form.fecha_inicio) return setError('La fecha de inicio es requerida.')
    if (form.bracket_type === 'league_cup' && (!form.playoff_cupo || form.playoff_cupo < 2)) {
      return setError('El cupo de copa tiene que ser al menos 2.')
    }
    setLoading(true); setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: player } = await supabase
      .from('players')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!player || !['organizer', 'admin'].includes(player.role)) {
      setError('Sin permisos para crear torneos.')
      setLoading(false)
      return
    }

    const { data: torneo, error: err } = await supabase.from('tournaments').insert({
      creator_id: player.id,
      nombre: form.nombre.trim().toUpperCase(),
      formato: form.formato,
      bracket_type: form.bracket_type,
      estado: 'draft',
      fecha_inicio: form.fecha_inicio,
      max_equipos: 8,
      playoff_cupo: form.bracket_type === 'league_cup' ? form.playoff_cupo : null,
      playoff_bracket_type: form.bracket_type === 'league_cup' ? form.playoff_bracket_type : null,
    }).select('id').single()

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      // El resto (descripción, subclases, cupo real, premio, reglamento) se
      // completa después — la creación solo pide lo estructural.
      router.push(`/organizador/torneos/${torneo.id}`)
    }
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px', flex: 1 }}>
        <Link href="/torneos" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 20 }}>
          ← Volver a Torneos
        </Link>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, background: 'var(--gold)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase' }}>
              Estado inicial: Borrador
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display-v2)', fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Crear Torneo
          </h1>
          <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 15, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
            Con esto alcanza para publicarlo — descripción, cupo, premio y reglamento se completan después, en la pantalla de gestión del torneo.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Identidad</div>
            <div>
              <label className="field-label">NOMBRE DEL TORNEO</label>
              <input
                className="field" value={form.nombre} maxLength={80} placeholder="Ej: GRAN TORNEO DE PRIMAVERA"
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', letterSpacing: '0.03em' }}>
                Se guarda automáticamente en mayúsculas.
              </p>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Formato y tipo de cuadro</div>
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
                <label className="field-label">TIPO DE CUADRO</label>
                <div className="segmented">
                  {BRACKET_TYPES.map(bt => {
                    const active = form.bracket_type === bt
                    return (
                      <button type="button" key={bt} className={`segmented-btn${active ? ' is-active' : ''}`}
                        onClick={() => setForm(frm => ({ ...frm, bracket_type: bt }))}>
                        {BRACKET_TYPE_LABEL[bt]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {form.bracket_type === 'league_cup' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                    <label className="field-label">TIPO DE COPA</label>
                    <div className="segmented">
                      {(['single_elimination', 'double_elimination'] as const).map(bt => {
                        const active = form.playoff_bracket_type === bt
                        return (
                          <button type="button" key={bt} className={`segmented-btn${active ? ' is-active' : ''}`}
                            onClick={() => setForm(f => ({ ...f, playoff_bracket_type: bt }))}>
                            {bt === 'single_elimination' ? 'Simple' : 'Doble'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Fecha</div>
            <div>
              <label className="field-label">FECHA DE INICIO</label>
              <input
                type="datetime-local" className="field" value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              />
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => router.back()}>
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, letterSpacing: 1 }}>
                {loading ? 'Creando...' : 'CREAR Y CONTINUAR →'}
              </button>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              Se guardará como borrador y serás redirigido al editor avanzado.
            </p>
          </div>
        </form>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        CoR Tournament Stats © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}

export default dynamic(() => Promise.resolve(NuevoTorneoPage), { ssr: false })
