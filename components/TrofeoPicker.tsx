'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TROFEO_COLORES, TROFEO_ICONOS, TROFEO_FORMAS } from '@/lib/constants'
import TrofeoBadge from './TrofeoBadge'

type Trofeo = { id: string; nombre: string; icono: string; color: string; forma: string }

/** Selector de copa para el organizador: elegir una ya creada por él mismo,
 *  no asignar ninguna, o armar una nueva desde un picker curado (forma +
 *  color + ícono) — sin subir imágenes, para que toda copa se vea prolija
 *  sin pedirle diseño gráfico a nadie. */
export default function TrofeoPicker({
  playerId, value, onChange,
}: {
  playerId: string
  value: string | null
  onChange: (trofeoId: string | null) => void
}) {
  const [trofeos, setTrofeos] = useState<Trofeo[]>([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [forma, setForma] = useState<string>(TROFEO_FORMAS[0].id)
  const [color, setColor] = useState<string>(TROFEO_COLORES[0].hex)
  const [icono, setIcono] = useState<string>(Object.keys(TROFEO_ICONOS)[0])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('trofeos').select('id, nombre, icono, color, forma').eq('creado_por', playerId).order('created_at', { ascending: false })
      .then(({ data }) => { setTrofeos(data ?? []); setLoading(false) })
  }, [playerId])

  const crearCopa = async () => {
    if (!nombre.trim()) { setError('Ponele un nombre a la copa'); return }
    setGuardando(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.from('trofeos')
      .insert({ nombre: nombre.trim(), icono, color, forma, creado_por: playerId })
      .select('id, nombre, icono, color, forma').single()
    setGuardando(false)
    if (err || !data) { setError(err?.message ?? 'No se pudo crear la copa'); return }
    setTrofeos(t => [data, ...t])
    onChange(data.id)
    setCreando(false); setNombre('')
  }

  const seleccionado = trofeos.find(t => t.id === value) ?? null

  const chipStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
    color: active ? 'var(--gold)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
  } as const)

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: creando ? 16 : 0 }}>
        <button type="button" onClick={() => onChange(null)} style={chipStyle(value === null)}>
          Sin copa asignada
        </button>
        {!loading && trofeos.map(t => (
          <button type="button" key={t.id} onClick={() => onChange(t.id)} style={chipStyle(value === t.id)}>
            <TrofeoBadge trofeo={t} size="xs" />
            {t.nombre}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCreando(c => !c)}
          style={{ ...chipStyle(creando), borderStyle: 'dashed' }}
        >
          + Crear copa nueva
        </button>
      </div>

      {creando && (
        <div style={{
          background: 'linear-gradient(160deg, rgba(212,175,55,0.06), rgba(212,175,55,0.015))',
          border: '1px solid var(--border-gold)', borderRadius: 14, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 22,
        }}>
          {/* ── Vista previa grande ─────────────────────────── */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            padding: '22px 16px', background: 'rgba(0,0,0,0.25)', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <TrofeoBadge trofeo={{ nombre: nombre || 'Vista previa', icono, color, forma }} size="lg" />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.5, textAlign: 'center' }}>
              {nombre.trim() || 'Nombre de la copa'}
            </div>
          </div>

          {/* ── Nombre ──────────────────────────────────────── */}
          <div>
            <label style={labelStyle}>NOMBRE DE LA COPA</label>
            <input
              value={nombre} onChange={e => { setNombre(e.target.value); setError('') }} maxLength={40}
              placeholder="Ej: Copa de Bárbaros"
              style={inputStyle}
            />
          </div>

          {/* ── Forma ───────────────────────────────────────── */}
          <div>
            <label style={labelStyle}>FORMA</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {TROFEO_FORMAS.map(f => {
                const active = forma === f.id
                return (
                  <button
                    type="button" key={f.id} onClick={() => setForma(f.id)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                      background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <TrofeoBadge trofeo={{ nombre: f.nombre, icono, color, forma: f.id }} size="md" />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: active ? 'var(--gold)' : 'var(--text-secondary)' }}>
                      {f.nombre}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Color ───────────────────────────────────────── */}
          <div>
            <label style={labelStyle}>COLOR</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
              {TROFEO_COLORES.map(c => {
                const active = color === c.hex
                return (
                  <button
                    type="button" key={c.hex} title={c.nombre} onClick={() => setColor(c.hex)}
                    style={{
                      position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '50%',
                      background: `radial-gradient(circle at 32% 28%, ${c.hex}, ${c.hex}cc 70%)`,
                      cursor: 'pointer', border: active ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: active ? `0 0 0 2px ${c.hex}, 0 2px 8px ${c.hex}66` : '0 1px 3px rgba(0,0,0,0.4)',
                      transition: 'transform 0.12s, box-shadow 0.12s',
                      transform: active ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    {active && (
                      <span style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 11, textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                      }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Ícono ───────────────────────────────────────── */}
          <div>
            <label style={labelStyle}>ÍCONO</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
              {Object.entries(TROFEO_ICONOS).map(([key, emoji]) => {
                const active = icono === key
                return (
                  <button
                    type="button" key={key} onClick={() => setIcono(key)}
                    style={{
                      aspectRatio: '1', borderRadius: 8, cursor: 'pointer', fontSize: 16,
                      border: `2px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                      background: active ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.02)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.12s, background 0.12s',
                    }}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {error && <span style={{ color: '#f87171', fontSize: 11, flex: 1, alignSelf: 'center' }}>{error}</span>}
            <button type="button" onClick={() => setCreando(false)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '9px 16px', fontFamily: 'var(--font-display)', fontSize: 11, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="button" onClick={crearCopa} disabled={guardando} style={{ background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#000', padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, cursor: guardando ? 'not-allowed' : 'pointer' }}>
              {guardando ? 'Creando...' : 'Crear y usar'}
            </button>
          </div>
        </div>
      )}

      {seleccionado && !creando && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrofeoBadge trofeo={seleccionado} size="sm" />
          Los campeones de este torneo van a mostrar la copa "{seleccionado.nombre}".
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)',
  letterSpacing: 1, marginBottom: 8,
} as const

const inputStyle = {
  width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', borderRadius: 8,
  color: 'var(--text-primary)', padding: '9px 12px', fontSize: 13, fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
} as const
