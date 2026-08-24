'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TROFEO_COLORES, TROFEO_ICONOS } from '@/lib/constants'
import TrofeoBadge from './TrofeoBadge'

type Trofeo = { id: string; nombre: string; icono: string; color: string }

/** Selector de copa para el organizador: elegir una ya creada por él mismo,
 *  no asignar ninguna, o armar una nueva desde un picker curado (nombre +
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
  const [color, setColor] = useState<string>(TROFEO_COLORES[0].hex)
  const [icono, setIcono] = useState<string>(Object.keys(TROFEO_ICONOS)[0])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('trofeos').select('id, nombre, icono, color').eq('creado_por', playerId).order('created_at', { ascending: false })
      .then(({ data }) => { setTrofeos(data ?? []); setLoading(false) })
  }, [playerId])

  const crearCopa = async () => {
    if (!nombre.trim()) { setError('Ponele un nombre a la copa'); return }
    setGuardando(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.from('trofeos')
      .insert({ nombre: nombre.trim(), icono, color, creado_por: playerId })
      .select('id, nombre, icono, color').single()
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: creando ? 14 : 0 }}>
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
        <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid var(--border-gold)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>NOMBRE DE LA COPA</label>
            <input
              value={nombre} onChange={e => { setNombre(e.target.value); setError('') }} maxLength={40}
              placeholder="Ej: Copa de Bárbaros"
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', borderRadius: 8, color: 'var(--text-primary)', padding: '9px 12px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>COLOR</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TROFEO_COLORES.map(c => (
                <button
                  type="button" key={c.hex} title={c.nombre} onClick={() => setColor(c.hex)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: c.hex, cursor: 'pointer',
                    border: color === c.hex ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: color === c.hex ? `0 0 0 2px ${c.hex}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>ÍCONO</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(TROFEO_ICONOS).map(([key, emoji]) => (
                <button
                  type="button" key={key} onClick={() => setIcono(key)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 15,
                    border: `2px solid ${icono === key ? 'var(--gold)' : 'var(--border)'}`,
                    background: icono === key ? 'rgba(212,175,55,0.12)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
            <TrofeoBadge trofeo={{ nombre: nombre || 'Vista previa', icono, color }} size="md" />
            <div style={{ flex: 1 }} />
            {error && <span style={{ color: '#f87171', fontSize: 11 }}>{error}</span>}
            <button type="button" onClick={() => setCreando(false)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '8px 14px', fontFamily: 'var(--font-display)', fontSize: 11, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="button" onClick={crearCopa} disabled={guardando} style={{ background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#000', padding: '8px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, cursor: guardando ? 'not-allowed' : 'pointer' }}>
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
