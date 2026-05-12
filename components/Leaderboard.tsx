'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Reino, Clase } from '@/lib/types'
import { REINO_COLOR, REINOS, CLASES } from '@/lib/constants'

const CLASE_ICON: Record<string, string> = {
  Bárbaro: '⚔️', Caballero: '🛡️', Conjurador: '✨', Brujo: '🔮', Tirador: '🏹', Cazador: '🐺',
}
const SHIELD_SRC: Record<string, string> = {
  Syrtis: '/shield-syrtis.png', Ignis: '/shield-ignis.png', Alsius: '/shield-alsius.png',
}

function RankBadge({ rank }: { rank: number }) {
  const configs: Record<number, { bg: string; color: string; border: string }> = {
    1: { bg: 'rgba(212,175,55,0.2)',   color: '#d4af37', border: 'rgba(212,175,55,0.5)' },
    2: { bg: 'rgba(180,180,180,0.15)', color: '#c0c0c0', border: 'rgba(180,180,180,0.4)' },
    3: { bg: 'rgba(141,110,99,0.2)',   color: '#cd7f32', border: 'rgba(141,110,99,0.5)' },
  }
  const cfg = configs[rank] ?? { bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: 'transparent' }
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
      {rank}
    </div>
  )
}

function PersonajeAvatar({ nickname, reino }: { nickname: string; reino: string }) {
  const color = REINO_COLOR[reino as Reino] ?? 'var(--gold)'
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
      {nickname[0]?.toUpperCase()}
    </div>
  )
}

export default function Leaderboard({ personajes: allPersonajes }: { personajes: any[] }) {
  const [filterReino, setFilterReino] = useState<Reino | ''>('')
  const [filterClase, setFilterClase] = useState<Clase | ''>('')

  const personajes = allPersonajes.filter(p => {
    if (filterReino && p.reino !== filterReino) return false
    if (filterClase && p.clase !== filterClase) return false
    return true
  })

  const selectStyle = {
    background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7,
    color: 'var(--text-secondary)', padding: '5px 10px', fontSize: 11,
    fontFamily: 'var(--font-display)', cursor: 'pointer', outline: 'none',
  }

  return (
    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.5 }}>
          Top Personajes de la Temporada
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 54px 38px', padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', alignItems: 'center', gap: 6 }}>
        {['#', 'PERSONAJE', 'MMR', 'WR'].map((col, i) => (
          <div key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{col}</div>
        ))}
      </div>

      {/* Rows */}
      {personajes.map((p, i) => {
        const globalRank = allPersonajes.findIndex((x: any) => x.id === p.id) + 1
        const rc = REINO_COLOR[p.reino as Reino]
        const wr = Number(p.winrate)
        const wrColor = wr >= 70 ? '#4CAF50' : wr >= 55 ? 'var(--gold)' : 'var(--text-secondary)'
        const playerId = p.player?.id ?? p.player_id

        return (
          <Link key={p.id} href={`/jugadores/${playerId}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 54px 38px', padding: '9px 14px', borderBottom: i < personajes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', gap: 8, transition: 'background 0.15s', cursor: 'pointer', borderLeft: `3px solid ${rc}44` }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

              <RankBadge rank={globalRank} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <PersonajeAvatar nickname={p.nickname_juego} reino={p.reino} />
                  {SHIELD_SRC[p.reino] && (
                    <img src={SHIELD_SRC[p.reino]} alt={p.reino} width={12} height={12} className={`shield-${p.reino?.toLowerCase()}`} style={{ objectFit: 'contain', position: 'absolute', bottom: -2, right: -4 }} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {p.nickname_juego}
                    {p.verificado && <span style={{ fontSize: 9, color: '#2196F3' }}>✓</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: rc, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {CLASE_ICON[p.clase]} {p.clase}
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{p.mmr}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: wrColor, fontWeight: 600 }}>{wr}%</div>
            </div>
          </Link>
        )
      })}

      {personajes.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12 }}>
          No hay personajes con esos filtros.
        </div>
      )}

      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/jugadores" style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', textDecoration: 'none', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver Ranking Completo <span style={{ fontSize: 14 }}>›</span>
        </Link>
      </div>
    </div>
  )
}
