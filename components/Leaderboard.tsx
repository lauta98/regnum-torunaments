'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Reino, Clase } from '@/lib/types'
import { REINO_COLOR, REINOS, CLASES } from '@/lib/constants'

const SHIELD_SRC: Record<string, string> = {
  Syrtis: '/shield-syrtis.png', Ignis: '/shield-ignis.png', Alsius: '/shield-alsius.png',
}
// Numeral romano para el podio (I/II/III) — el resto usa el número de puesto tal cual.
const ROMANOS = ['I', 'II', 'III']

function RankMark({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 18, fontWeight: 700, color: `color-mix(in srgb, var(--gold) ${100 - (rank - 1) * 10}%, transparent)`, lineHeight: 1 }}>
        {ROMANOS[rank - 1]}
      </span>
    )
  }
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{rank}</span>
}

function PersonajeAvatar({ nickname, reino }: { nickname: string; reino: string }) {
  const color = REINO_COLOR[reino as Reino] ?? 'var(--gold)'
  return (
    <div style={{ width: 26, height: 26, background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display-v2)', fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
      {nickname[0]?.toUpperCase()}
    </div>
  )
}

export default function Leaderboard({ personajes: initialPersonajes }: { personajes: any[] }) {
  const [filterReino, setFilterReino] = useState<Reino | ''>('')
  const [filterClase, setFilterClase] = useState<Clase | ''>('')
  const [personajes, setPersonajes] = useState(initialPersonajes)
  const [loading, setLoading] = useState(false)

  // Sin filtros, el top 10 ya lo trajo el servidor. Con algún filtro
  // puesto, había que traer el top 10 DE ESE FILTRO — antes esto
  // filtraba en el navegador sobre el top 10 general, así que si ningún
  // jugador del top 10 global era de la subclase elegida, la tabla
  // aparecía vacía aunque esa subclase tuviera sus propios cracks más
  // abajo en el ranking general.
  useEffect(() => {
    if (!filterReino && !filterClase) { setPersonajes(initialPersonajes); return }
    let cancelado = false
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('personajes').select('*, player:players!personajes_player_id_fkey(id, discord_username, role)').order('mmr', { ascending: false }).limit(10)
    if (filterReino) q = q.eq('reino', filterReino)
    if (filterClase) q = q.eq('clase', filterClase)
    q.then(({ data }) => {
      if (cancelado) return
      setPersonajes(data ?? [])
      setLoading(false)
    })
    return () => { cancelado = true }
  }, [filterReino, filterClase, initialPersonajes])

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Tabla de Clasificación
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select className="field" style={{ width: 'auto', padding: '5px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', borderRadius: 0 }} value={filterReino} onChange={e => setFilterReino(e.target.value as Reino | '')}>
            <option value="">Todos los reinos</option>
            {REINOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="field" style={{ width: 'auto', padding: '5px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', borderRadius: 0 }} value={filterClase} onChange={e => setFilterClase(e.target.value as Clase | '')}>
            <option value="">Todas las clases</option>
            {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Column headers — label-caps: es exactamente uno de los 5 roles permitidos (header de tabla) */}
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 70px 50px', padding: '8px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', alignItems: 'center', gap: 6 }}>
        {['#', 'JUGADOR', 'MMR', 'WR'].map((col, i) => (
          <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textAlign: i >= 2 ? 'right' : 'left' }}>{col}</div>
        ))}
      </div>

      <div style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.15s' }}>

      {/* Rows */}
      {personajes.map((p, i) => {
        const rc = REINO_COLOR[p.reino as Reino]
        const wr = Number(p.winrate)
        const wrColor = wr >= 70 ? 'var(--syrtis)' : wr >= 55 ? 'var(--gold)' : 'var(--text-secondary)'
        const playerId = p.player?.id ?? p.player_id

        return (
          <Link key={p.id} href={`/jugadores/${playerId}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 70px 50px', padding: '10px 18px', borderBottom: i < personajes.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', gap: 8, transition: 'background 0.15s', cursor: 'pointer', borderLeft: `2px solid ${i < 3 ? rc : 'transparent'}` }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

              <RankMark rank={i + 1} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <PersonajeAvatar nickname={p.nickname_juego} reino={p.reino} />
                  {SHIELD_SRC[p.reino] && (
                    <img src={SHIELD_SRC[p.reino]} alt={p.reino} width={11} height={11} className={`shield-${p.reino?.toLowerCase()}`} style={{ objectFit: 'contain', position: 'absolute', bottom: -2, right: -3 }} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display-v2)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {p.nickname_juego}
                    {p.verificado && <span style={{ fontSize: 10, color: 'var(--alsius)' }}>✓</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ width: 6, height: 6, background: rc, flexShrink: 0 }} />
                    {p.clase} <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>/ {p.reino}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--gold)', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.mmr}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: wrColor, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{wr}%</div>
            </div>
          </Link>
        )
      })}

      {personajes.length === 0 && !loading && (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display-v2)', fontSize: 13 }}>
          No hay personajes con esos filtros.
        </div>
      )}
      </div>

      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/jugadores" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Ranking Completo
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
        </Link>
      </div>
    </div>
  )
}
