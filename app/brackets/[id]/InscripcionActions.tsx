'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FORMAT_TEAM_SIZE, CLASE_LABEL } from '@/lib/constants'
import type { TournamentFormat, Clase } from '@/lib/types'
import AgregarPersonaje from '@/app/jugadores/[id]/AgregarPersonaje'

interface Personaje {
  id: string
  nickname_juego: string
  clase: Clase
}

interface TeamOpcion {
  id: string
  nombre: string
  miembros: number
}

export default function InscripcionActions({
  torneoId,
  formato,
  playerId,
  personajesElegibles,
  yaInscritoTeamId,
  equiposConCupo,
}: {
  torneoId: string
  formato: TournamentFormat
  playerId: string
  personajesElegibles: Personaje[]
  yaInscritoTeamId: string | null
  equiposConCupo: TeamOpcion[]
}) {
  const teamSize = FORMAT_TEAM_SIZE[formato]
  const [personajeId, setPersonajeId] = useState(personajesElegibles[0]?.id ?? '')
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modo, setModo] = useState<'elegir' | 'crear'>('elegir')

  if (yaInscritoTeamId) {
    return (
      <div style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, color: '#4CAF50', fontFamily: 'var(--font-display)', fontSize: 12 }}>
        ✓ Ya estás inscripto en este torneo.
      </div>
    )
  }

  if (personajesElegibles.length === 0) {
    return (
      <div style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
        Ninguno de tus personajes puede inscribirse en este torneo (subclase no habilitada). Si tenés uno de la clase correcta que todavía no cargaste, agregalo acá:
        <AgregarPersonaje playerId={playerId} />
      </div>
    )
  }

  const crearEquipo = async () => {
    if (teamSize > 1 && !nombreEquipo.trim()) { setError('Ponele un nombre a tu equipo'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const personaje = personajesElegibles.find(p => p.id === personajeId)
    const nombre = teamSize === 1 ? (personaje?.nickname_juego ?? 'Equipo') : nombreEquipo.trim()

    const { data: team, error: teamErr } = await supabase.from('teams').insert({
      nombre, capitan_id: playerId, tipo: formato,
    }).select('id').single()

    if (teamErr || !team) { setError(teamErr?.message ?? 'Error al crear el equipo'); setLoading(false); return }

    const { error: memberErr } = await supabase.from('team_members').insert({
      team_id: team.id, player_id: playerId, personaje_id: personajeId,
    })
    if (memberErr) { setError(memberErr.message); setLoading(false); return }

    const { error: regErr } = await supabase.from('tournament_registrations').insert({
      tournament_id: torneoId, team_id: team.id,
    })
    if (regErr) { setError(regErr.message); setLoading(false); return }

    window.location.reload()
  }

  const unirseA = async (teamId: string) => {
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: memberErr } = await supabase.from('team_members').insert({
      team_id: teamId, player_id: playerId, personaje_id: personajeId,
    })
    if (memberErr) { setError(memberErr.message); setLoading(false); return }
    window.location.reload()
  }

  const selectStyle = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)',
    borderRadius: 8, color: 'var(--text-primary)', padding: '9px 12px',
    fontSize: 13, fontFamily: 'var(--font-display)', outline: 'none', marginBottom: 10,
  } as const

  const btnStyle = {
    background: 'var(--gold)', color: '#000', padding: '10px 20px', borderRadius: 8, border: 'none',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
  } as const

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>
        INSCRIPCIÓN
      </div>

      {personajesElegibles.length > 1 && (
        <>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>
            PERSONAJE
          </label>
          <select style={selectStyle} value={personajeId} onChange={e => setPersonajeId(e.target.value)}>
            {personajesElegibles.map(p => (
              <option key={p.id} value={p.id}>{p.nickname_juego} — {CLASE_LABEL[p.clase]}</option>
            ))}
          </select>
        </>
      )}

      {teamSize === 1 ? (
        <button onClick={crearEquipo} disabled={loading} style={btnStyle}>
          {loading ? 'Inscribiendo...' : 'Inscribirme'}
        </button>
      ) : (
        <>
          {equiposConCupo.length > 0 && modo === 'elegir' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>
                EQUIPOS CON CUPO
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {equiposConCupo.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-primary)' }}>
                      {t.nombre} <span style={{ color: 'var(--text-muted)' }}>({t.miembros}/{teamSize})</span>
                    </span>
                    <button onClick={() => unirseA(t.id)} disabled={loading} style={{ ...btnStyle, padding: '5px 12px', fontSize: 10 }}>
                      Unirme
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setModo('crear')} style={{ marginTop: 10, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}>
                o crear mi propio equipo
              </button>
            </div>
          )}

          {(equiposConCupo.length === 0 || modo === 'crear') && (
            <>
              <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>
                NOMBRE DEL EQUIPO
              </label>
              <input
                style={selectStyle} value={nombreEquipo} maxLength={40} placeholder="Ej: Los Invencibles"
                onChange={e => setNombreEquipo(e.target.value)}
              />
              <button onClick={crearEquipo} disabled={loading} style={btnStyle}>
                {loading ? 'Creando...' : 'Crear equipo e inscribirme'}
              </button>
            </>
          )}
        </>
      )}

      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 10 }}>{error}</p>}
    </div>
  )
}
