'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CLASES, REINOS, CLASE_LABEL } from '@/lib/constants'
import type { Clase, Reino } from '@/lib/types'

type Personaje = {
  id: string; nickname_juego: string; reino: string; clase: string; mmr: number
  partidas_jugadas: number; partidas_ganadas: number; winstreak: number; verificado: boolean
}

export default function PersonajeRow({ personaje, borderBottom }: { personaje: Personaje; borderBottom: boolean }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nickname_juego: personaje.nickname_juego,
    reino: personaje.reino as Reino,
    clase: personaje.clase as Clase,
    mmr: personaje.mmr,
    partidas_jugadas: personaje.partidas_jugadas,
    partidas_ganadas: personaje.partidas_ganadas,
    winstreak: personaje.winstreak,
    verificado: personaje.verificado,
  })

  const guardar = async () => {
    setLoading(true); setError('')
    const res = await fetch(`/api/personajes/${personaje.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }
    setEditando(false)
    router.refresh()
  }

  const borrar = async () => {
    setLoading(true); setError('')
    const res = await fetch(`/api/personajes/${personaje.id}`, { method: 'DELETE' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al borrar'); setConfirmandoBorrado(false); return }
    router.refresh()
  }

  const inputStyle = {
    background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', borderRadius: 6,
    color: 'var(--text-primary)', padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-display)', outline: 'none',
  } as const

  if (editando) {
    return (
      <div style={{ padding: '16px 20px', borderBottom: borderBottom ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Nickname
            <input style={{ ...inputStyle, width: '100%', marginTop: 3, boxSizing: 'border-box' }} value={form.nickname_juego} onChange={e => setForm(f => ({ ...f, nickname_juego: e.target.value }))} />
          </label>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            MMR
            <input type="number" style={{ ...inputStyle, width: '100%', marginTop: 3, boxSizing: 'border-box' }} value={form.mmr} onChange={e => setForm(f => ({ ...f, mmr: Number(e.target.value) }))} />
          </label>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Clase
            <select style={{ ...inputStyle, width: '100%', marginTop: 3, boxSizing: 'border-box' }} value={form.clase} onChange={e => setForm(f => ({ ...f, clase: e.target.value as Clase }))}>
              {CLASES.map(c => <option key={c} value={c}>{CLASE_LABEL[c]}</option>)}
              <option value="Desconocido">Desconocido</option>
            </select>
          </label>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Reino
            <select style={{ ...inputStyle, width: '100%', marginTop: 3, boxSizing: 'border-box' }} value={form.reino} onChange={e => setForm(f => ({ ...f, reino: e.target.value as Reino }))}>
              {REINOS.map(r => <option key={r} value={r}>{r}</option>)}
              <option value="Desconocido">Desconocido</option>
            </select>
          </label>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Partidas jugadas
            <input type="number" min={0} style={{ ...inputStyle, width: '100%', marginTop: 3, boxSizing: 'border-box' }} value={form.partidas_jugadas} onChange={e => setForm(f => ({ ...f, partidas_jugadas: Number(e.target.value) }))} />
          </label>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Partidas ganadas
            <input type="number" min={0} style={{ ...inputStyle, width: '100%', marginTop: 3, boxSizing: 'border-box' }} value={form.partidas_ganadas} onChange={e => setForm(f => ({ ...f, partidas_ganadas: Number(e.target.value) }))} />
          </label>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Winstreak
            <input type="number" min={0} style={{ ...inputStyle, width: '100%', marginTop: 3, boxSizing: 'border-box' }} value={form.winstreak} onChange={e => setForm(f => ({ ...f, winstreak: Number(e.target.value) }))} />
          </label>
          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
            <input type="checkbox" checked={form.verificado} onChange={e => setForm(f => ({ ...f, verificado: e.target.checked }))} />
            Verificado
          </label>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: 11, marginBottom: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={guardar} disabled={loading} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: 'var(--gold)', color: '#000', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          }}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={() => { setEditando(false); setError('') }} style={{
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)', fontSize: 11,
          }}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '12px 20px', borderBottom: borderBottom ? '1px solid rgba(255,255,255,0.04)' : 'none',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {personaje.nickname_juego}
          </span>
          {personaje.verificado && <span style={{ fontSize: 9, color: '#5BC98B' }}>✓ verificado</span>}
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {personaje.clase} · {personaje.reino} · mmr {personaje.mmr} · {personaje.partidas_ganadas}/{personaje.partidas_jugadas} victorias
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {confirmandoBorrado ? (
          <>
            {error && <span style={{ fontSize: 9, color: '#F44336', maxWidth: 220 }}>{error}</span>}
            <button onClick={borrar} disabled={loading} style={{
              fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
              background: 'rgba(244,67,54,0.18)', border: '1px solid rgba(244,67,54,0.5)', color: '#F44336', fontFamily: 'var(--font-display)',
            }}>
              {loading ? '...' : 'Confirmar'}
            </button>
            <button onClick={() => { setConfirmandoBorrado(false); setError('') }} style={{
              fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
            }}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditando(true)} style={{
              fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold)', fontFamily: 'var(--font-display)',
            }}>
              Editar
            </button>
            <button onClick={() => setConfirmandoBorrado(true)} style={{
              fontSize: 9, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(244,67,54,0.3)', color: 'rgba(244,67,54,0.8)', fontFamily: 'var(--font-display)',
            }}>
              Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
