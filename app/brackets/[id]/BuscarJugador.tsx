'use client'

import { useMemo, useState } from 'react'

type Estado =
  | { tipo: 'pendiente'; ronda: string; rival: string | null }
  | { tipo: 'gano' | 'perdio'; ronda: string; rival: string | null; resultado: string | null }
  | { tipo: 'sin-partidos' }

type Entrada = { teamId: string; teamNombre: string; nombres: string[]; estado: Estado }

function normalizar(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function mensaje(estado: Estado): string {
  switch (estado.tipo) {
    case 'pendiente':
      return `⏳ Juega vs ${estado.rival ?? 'rival a definir'} — ${estado.ronda}`
    case 'perdio':
      return `❌ Eliminado en ${estado.ronda} — perdió vs ${estado.rival}${estado.resultado ? ` (${estado.resultado})` : ''}`
    case 'gano':
      return `✅ Ganó en ${estado.ronda} vs ${estado.rival}${estado.resultado ? ` (${estado.resultado})` : ''}`
    default:
      return 'Todavía sin partidos jugados.'
  }
}

/** Buscador de jugador en la barra lateral: escribís un nick (propio o
 *  de cualquier integrante del equipo) y resalta sus tarjetas en la
 *  llave (vía `data-team-id`, pintado en TeamRow) + muestra a quién
 *  enfrenta a continuación o, si ya perdió, el resultado de su último
 *  partido. El resaltado solo tiene efecto si estás viendo la pestaña
 *  Llave (ahí es donde existen esos nodos) — el mensaje de estado se ve
 *  igual en cualquier pestaña. */
export default function BuscarJugador({ entradas }: { entradas: Entrada[] }) {
  const [query, setQuery] = useState('')
  const [seleccion, setSeleccion] = useState<Entrada | null>(null)

  const sugerencias = useMemo(() => {
    const q = normalizar(query.trim())
    if (q.length < 2) return []
    return entradas.filter(e => e.nombres.some(n => normalizar(n).includes(q))).slice(0, 8)
  }, [query, entradas])

  function limpiarResaltado() {
    document.querySelectorAll('.cor-search-hl').forEach(el => el.classList.remove('cor-search-hl'))
  }

  function seleccionar(e: Entrada) {
    limpiarResaltado()
    setSeleccion(e)
    setQuery(e.teamNombre)
    const nodes = document.querySelectorAll(`[data-team-id="${e.teamId}"]`)
    nodes.forEach(n => n.classList.add('cor-search-hl'))
    nodes[0]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }

  function limpiar() {
    limpiarResaltado()
    setQuery('')
    setSeleccion(null)
  }

  return (
    <div style={{ padding: '12px 16px 4px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 8 }}>
        BUSCAR JUGADOR
      </div>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSeleccion(null) }}
          placeholder="Nick del jugador..."
          style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 26px 7px 10px',
            color: 'var(--text-primary)', fontSize: 11.5, fontFamily: 'var(--font-body)', outline: 'none',
          }}
        />
        {query && (
          <button onClick={limpiar} aria-label="Limpiar búsqueda" style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 2, lineHeight: 1,
          }}>
            ✕
          </button>
        )}
        {sugerencias.length > 0 && !seleccion && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 4,
            background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden',
          }}>
            {sugerencias.map(e => (
              <button key={e.teamId} onClick={() => seleccionar(e)} className="cor-search-suggestion" style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px',
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer',
              }}>
                {e.teamNombre}
              </button>
            ))}
          </div>
        )}
      </div>
      {seleccion && (
        <div style={{
          marginTop: 8, padding: '8px 10px', background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.2)', borderRadius: 6, fontSize: 10.5,
          color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          {mensaje(seleccion.estado)}
        </div>
      )}
    </div>
  )
}
