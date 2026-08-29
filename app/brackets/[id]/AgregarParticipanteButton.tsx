'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CLASE_ICON, FORMAT_TEAM_SIZE } from '@/lib/constants'
import type { TournamentFormat, Clase } from '@/lib/types'

type PersonajeOpt = { id: string; nickname_juego: string; clase: Clase; reino: string }

/** Carga manual de participantes por el organizador — busca personajes ya
 *  existentes (creados por self-service o por otro alta manual) y arma un
 *  equipo con ellos vía /api/torneos/[id]/agregar-participante. Pensado
 *  para jugadores que se anotaron por fuera del sitio (Discord) o para
 *  poblar torneos de prueba sin pasar por la inscripción self-service. */
export default function AgregarParticipanteButton({
  torneoId, formato, subclasesPermitidas,
}: {
  torneoId: string
  formato: TournamentFormat
  subclasesPermitidas: string[] | null
}) {
  const router = useRouter()
  const teamSize = FORMAT_TEAM_SIZE[formato] ?? 1

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<PersonajeOpt[]>([])
  const [elegidos, setElegidos] = useState<PersonajeOpt[]>([])
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const reset = () => {
    setQuery(''); setResultados([]); setElegidos([]); setNombreEquipo(''); setError(''); setOk('')
  }

  const buscar = async (q: string) => {
    setQuery(q)
    setError('')
    if (!q.trim()) { setResultados([]); return }
    setBuscando(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('personajes')
      .select('id, nickname_juego, clase, reino')
      .ilike('nickname_juego', `%${q.trim()}%`)
      .limit(15)
    const yaElegidoIds = new Set(elegidos.map(e => e.id))
    setResultados((data ?? []).filter((p: PersonajeOpt) => !yaElegidoIds.has(p.id)))
    setBuscando(false)
  }

  const elegir = (p: PersonajeOpt) => {
    if (elegidos.length >= teamSize) return
    setElegidos(e => [...e, p])
    setResultados(r => r.filter(x => x.id !== p.id))
    setError('')
  }
  const quitar = (id: string) => setElegidos(e => e.filter(p => p.id !== id))

  const confirmar = async () => {
    if (elegidos.length !== teamSize) {
      setError(`Elegí exactamente ${teamSize} personaje${teamSize > 1 ? 's' : ''} (llevás ${elegidos.length}).`)
      return
    }
    if (teamSize > 1 && !nombreEquipo.trim()) {
      setError('Ponele un nombre al equipo.')
      return
    }
    setEnviando(true); setError(''); setOk('')
    const res = await fetch(`/api/torneos/${torneoId}/agregar-participante`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personajeIds: elegidos.map(p => p.id),
        nombreEquipo: nombreEquipo.trim() || undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setEnviando(false)
    if (!res.ok) { setError(data.error ?? 'No se pudo agregar el participante.'); return }
    setOk(`${teamSize > 1 ? nombreEquipo.trim() : elegidos[0].nickname_juego} agregado.`)
    setElegidos([]); setNombreEquipo(''); setQuery(''); setResultados([])
    router.refresh()
  }

  const permitidas = subclasesPermitidas && subclasesPermitidas.length > 0 ? subclasesPermitidas : null

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost" style={{ fontSize: 11 }}>
        + Agregar participante
      </button>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(212,175,55,0.06), rgba(212,175,55,0.015))',
      border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: 18,
      display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: 0.5 }}>
          AGREGAR PARTICIPANTE MANUALMENTE
        </div>
        <button
          type="button"
          onClick={() => { setOpen(false); reset() }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
        >
          ✕
        </button>
      </div>

      {permitidas && (
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
          Este torneo solo admite: {permitidas.join(', ')}.
        </div>
      )}

      {elegidos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {elegidos.map(p => (
            <span key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20,
              border: '1px solid var(--gold)', background: 'rgba(212,175,55,0.12)',
              color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
            }}>
              {CLASE_ICON[p.clase] ?? ''} {p.nickname_juego}
              <button
                type="button" onClick={() => quitar(p.id)}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {elegidos.length < teamSize && (
        <div>
          <label className="field-label">
            BUSCAR PERSONAJE ({elegidos.length}/{teamSize})
          </label>
          <input
            value={query}
            onChange={e => buscar(e.target.value)}
            placeholder="Nickname del personaje..."
            className="field"
          />
          {buscando && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Buscando...</div>}
          {!buscando && query.trim() && resultados.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Sin resultados.</div>
          )}
          {resultados.length > 0 && (
            <div style={{
              marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', padding: 4,
            }}>
              {resultados.map(p => {
                const noElegible = permitidas && !permitidas.includes(p.clase)
                return (
                  <button
                    type="button" key={p.id} disabled={!!noElegible} onClick={() => elegir(p)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: 'none', textAlign: 'left',
                      background: 'rgba(255,255,255,0.02)', cursor: noElegible ? 'not-allowed' : 'pointer',
                      opacity: noElegible ? 0.4 : 1,
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {CLASE_ICON[p.clase] ?? ''} {p.nickname_juego}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                      {p.reino} · {p.clase}{noElegible ? ' (no permitida)' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {teamSize > 1 && (
        <div>
          <label className="field-label">NOMBRE DEL EQUIPO</label>
          <input
            value={nombreEquipo} onChange={e => { setNombreEquipo(e.target.value); setError('') }}
            placeholder="Ej: Los Invencibles" maxLength={40} className="field"
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {error && <span style={{ color: '#f87171', fontSize: 11, flex: 1 }}>{error}</span>}
        {ok && <span style={{ color: '#4CAF50', fontSize: 11, flex: 1 }}>{ok}</span>}
        <button type="button" onClick={() => { setOpen(false); reset() }} className="btn btn-ghost">
          Cerrar
        </button>
        <button type="button" onClick={confirmar} disabled={enviando || elegidos.length !== teamSize} className="btn btn-primary">
          {enviando ? 'Agregando...' : 'Agregar al torneo'}
        </button>
      </div>
    </div>
  )
}
