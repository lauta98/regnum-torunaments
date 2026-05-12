'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FORMATS, FORMAT_LABEL, FORMAT_COLOR } from '@/lib/constants'
import type { TournamentFormat } from '@/lib/types'
import Header from '@/components/Header'
import dynamic from 'next/dynamic'

function NuevoTorneoPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    formato: '1v1' as TournamentFormat,
    fecha_inicio: '',
    max_equipos: 8,
    premio: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es requerido.')
    if (!form.fecha_inicio) return setError('La fecha de inicio es requerida.')
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

    const { error: err } = await supabase.from('tournaments').insert({
      creator_id: player.id,
      nombre: form.nombre.trim().toUpperCase(),
      descripcion: form.descripcion.trim() || null,
      formato: form.formato,
      estado: 'draft',
      fecha_inicio: form.fecha_inicio,
      max_equipos: form.max_equipos,
      premio: form.premio.trim() || null,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/organizador')
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)',
    borderRadius: 8, color: 'var(--text-primary)', padding: '10px 14px',
    fontSize: 14, fontFamily: 'var(--font-display)', outline: 'none',
  } as const

  const labelStyle = {
    display: 'block', fontFamily: 'var(--font-display)', fontSize: 11,
    color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6,
  } as const

  return (
    <>
      <Header />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px', flex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--gold)', letterSpacing: 2 }}>
            CREAR TORNEO
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Configurá los detalles del nuevo torneo.
          </p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 16, padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <label style={labelStyle}>NOMBRE DEL TORNEO</label>
              <input
                style={inputStyle} value={form.nombre} maxLength={80} placeholder="Ej: GRAN TORNEO DE PRIMAVERA"
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div>
              <label style={labelStyle}>DESCRIPCIÓN (opcional)</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                value={form.descripcion} maxLength={500} placeholder="Describe las reglas o características del torneo..."
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
                      transition: 'all 0.15s',
                    }}>{FORMAT_LABEL[f]}</button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>FECHA DE INICIO</label>
                <input
                  type="datetime-local" style={inputStyle} value={form.fecha_inicio}
                  onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>MÁX. EQUIPOS</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.max_equipos}
                  onChange={e => setForm(f => ({ ...f, max_equipos: parseInt(e.target.value) }))}
                >
                  {[4, 8, 16, 32].map(n => <option key={n} value={n}>{n} equipos</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>PREMIO (opcional)</label>
              <input
                style={inputStyle} value={form.premio} maxLength={100} placeholder="Ej: 1000 Gold coins + título de campeón"
                onChange={e => setForm(f => ({ ...f, premio: e.target.value }))}
              />
            </div>

            {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button type="button" onClick={() => router.back()} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13, cursor: 'pointer',
              }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading} style={{
                flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                background: loading ? 'var(--bg-surface)' : 'var(--gold)',
                color: loading ? 'var(--text-muted)' : '#000',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Creando...' : 'CREAR TORNEO'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>
        CoR TOURNAMENT STATS © 2026 — Champions of Regnum Community
      </footer>
    </>
  )
}

export default dynamic(() => Promise.resolve(NuevoTorneoPage), { ssr: false })
