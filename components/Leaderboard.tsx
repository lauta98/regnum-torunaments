'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Reino, Clase } from '@/lib/types'
import { REINO_COLOR, REINOS, CLASES } from '@/lib/constants'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}

export default function Leaderboard({ players: allPlayers }: { players: any[] }) {
  const [filterReino, setFilterReino] = useState<Reino | ''>('')
  const [filterClase, setFilterClase] = useState<Clase | ''>('')

  const players = allPlayers.filter(p => {
    if (filterReino && p.reino !== filterReino) return false
    if (filterClase && p.clase_principal !== filterClase) return false
    return true
  })

  const selectStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 8,
    color: 'var(--text-secondary)', padding: '6px 12px', fontSize: 12,
    fontFamily: 'var(--font-display)', cursor: 'pointer', outline: 'none',
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>
          TOP JUGADORES
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select style={selectStyle} value={filterReino} onChange={e => setFilterReino(e.target.value as Reino | '')}>
            <option value="">Todos los reinos</option>
            {REINOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select style={selectStyle} value={filterClase} onChange={e => setFilterClase(e.target.value as Clase | '')}>
            <option value="">Todas las clases</option>
            {CLASES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 100px 80px 80px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        {['#', 'JUGADOR', 'REINO', 'CLASE', 'MMR', 'WINRATE'].map(col => (
          <div key={col} style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{col}</div>
        ))}
      </div>

      {players.map((p, i) => {
        const globalRank = allPlayers.findIndex((x: any) => x.id === p.id) + 1
        return (
          <Link key={p.id} href={`/jugadores/${p.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 100px 80px 80px', padding: '12px 20px', borderBottom: i < players.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: globalRank <= 3 ? 16 : 14, color: globalRank <= 3 ? 'var(--gold)' : 'var(--text-muted)' }}>
                {MEDAL[globalRank] ?? globalRank}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${REINO_COLOR[p.reino as Reino]}18`, border: `2px solid ${REINO_COLOR[p.reino as Reino]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {CLASE_ICON[p.clase_principal] ?? p.nickname_juego[0]}
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.nickname_juego}</span>
              </div>
              <div style={{ fontSize: 13, color: REINO_COLOR[p.reino as Reino], fontWeight: 600 }}>{p.reino}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.clase_principal}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{p.mmr_global.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: p.winrate >= 70 ? '#4CAF50' : p.winrate >= 55 ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: 600 }}>{p.winrate}%</div>
            </div>
          </Link>
        )
      })}

      {players.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13 }}>
          No hay jugadores con esos filtros.
        </div>
      )}

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
        <Link href="/rankings" style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', textDecoration: 'none', letterSpacing: 1 }}>
          VER RANKING COMPLETO →
        </Link>
      </div>
    </div>
  )
}
