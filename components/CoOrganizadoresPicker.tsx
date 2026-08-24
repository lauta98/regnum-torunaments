'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type PlayerLite = { id: string; discord_username: string | null; discord_avatar: string | null }

/** Gestión de co-organizadores de un torneo — colaboradores puntuales que
 *  ganan permisos de organizador solo en ESTE torneo (generar cuadro,
 *  cargar resultados, editar datos), sin importar su rol global. Solo
 *  visible para el creador del torneo o un admin (ver EditarTorneoForm) —
 *  agregar/quitar pasa por /api/torneos/[id]/organizadores, que además
 *  rechaza esta acción si quien llama no es dueño/admin, así que el
 *  gate del lado del cliente no es el único candado. */
export default function CoOrganizadoresPicker({ torneoId }: { torneoId: string }) {
  const [organizadores, setOrganizadores] = useState<PlayerLite[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<PlayerLite[]>([])
  const [buscando, setBuscando] = useState(false)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [error, setError] = useState('')

  const cargar = () => {
    const supabase = createClient()
    supabase
      .from('tournament_organizers')
      .select('player:players(id, discord_username, discord_avatar)')
      .eq('tournament_id', torneoId)
      .then(({ data }) => {
        setOrganizadores(((data ?? []) as any[]).map(r => r.player).filter(Boolean))
        setLoading(false)
      })
  }

  useEffect(cargar, [torneoId])

  const buscar = async () => {
    if (q.trim().length < 2) { setResultados([]); return }
    setBuscando(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('players')
      .select('id, discord_username, discord_avatar')
      .ilike('discord_username', `%${q.trim()}%`)
      .limit(8)
    setBuscando(false)
    const yaAgregados = new Set(organizadores.map(o => o.id))
    setResultados((data ?? []).filter(p => !yaAgregados.has(p.id)))
  }

  const agregar = async (playerId: string) => {
    setProcesando(playerId); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/organizadores`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: playerId }),
    })
    setProcesando(null)
    if (!res.ok) { const d = await res.json().catch(() => null); setError(d?.error ?? 'No se pudo agregar'); return }
    setQ(''); setResultados([]); cargar()
  }

  const quitar = async (playerId: string) => {
    setProcesando(playerId); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/organizadores`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: playerId }),
    })
    setProcesando(null)
    if (!res.ok) { const d = await res.json().catch(() => null); setError(d?.error ?? 'No se pudo quitar'); return }
    cargar()
  }

  return (
    <div>
      {!loading && organizadores.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {organizadores.map(o => (
            <span key={o.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px 5px 6px', borderRadius: 20,
              background: 'var(--bg-input)', border: '1px solid var(--border-input)',
            }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {o.discord_avatar
                  ? <img src={o.discord_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{o.discord_username?.[0]?.toUpperCase()}</span>}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{o.discord_username}</span>
              <button type="button" onClick={() => quitar(o.id)} disabled={procesando === o.id} title="Quitar co-organizador" style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '0 4px',
              }}>
                {procesando === o.id ? '…' : '×'}
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="field" value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); buscar() } }}
          placeholder="Buscar por nombre de Discord..."
        />
        <button type="button" onClick={buscar} className="btn btn-ghost-gold" disabled={buscando}>
          {buscando ? '...' : 'Buscar'}
        </button>
      </div>

      {resultados.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {resultados.map(p => (
            <button key={p.id} type="button" onClick={() => agregar(p.id)} disabled={procesando === p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)',
              fontSize: 13, textAlign: 'left',
            }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.discord_avatar
                  ? <img src={p.discord_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.discord_username?.[0]?.toUpperCase()}</span>}
              </span>
              {p.discord_username}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gold)' }}>{procesando === p.id ? 'Agregando…' : '+ Agregar'}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  )
}
