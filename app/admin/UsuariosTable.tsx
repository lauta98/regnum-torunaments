'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABEL, ROLE_COLOR, ROLE_BG, isSuperAdmin } from '@/lib/roles'
import type { UserRole } from '@/lib/types'
import RoleManager from './RoleManager'

type Player = {
  id: string; nickname_juego: string; reino: string; clase_principal: string
  role: UserRole; discord_username: string | null; discord_avatar: string | null
}

const ALL_ROLES: UserRole[] = ['player', 'organizer', 'admin']
const PAGE_SIZE = 25

export default function UsuariosTable({ players, meId }: { players: Player[]; meId: string }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkRole, setBulkRole] = useState<UserRole>('organizer')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return players
    return players.filter(p =>
      p.nickname_juego?.toLowerCase().includes(term) ||
      p.discord_username?.toLowerCase().includes(term)
    )
  }, [players, q])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(page, totalPaginas)
  const paginados = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  const cambiarQuery = (val: string) => { setQ(val); setPage(1) }

  // Solo se pueden seleccionar los que un cambio en lote realmente podría
  // tocar — no tiene sentido ofrecer tildar a uno mismo o a un admin
  // permanente si esa fila igual va a quedar afuera del lote.
  const seleccionables = filtrados.filter(p => p.id !== meId && !isSuperAdmin(p.nickname_juego))
  const todosSeleccionados = seleccionables.length > 0 && seleccionables.every(p => selected.has(p.id))

  const toggleTodos = () => {
    setSelected(prev => {
      if (todosSeleccionados) return new Set()
      return new Set(seleccionables.map(p => p.id))
    })
  }
  const toggleUno = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const aplicarEnLote = async () => {
    if (selected.size === 0) return
    if (!confirm(`¿Cambiar el rol de ${selected.size} jugador(es) a "${ROLE_LABEL[bulkRole]}"?`)) return
    setApplying(true); setError('')
    const res = await fetch('/api/admin/set-role-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetIds: [...selected], newRole: bulkRole }),
    })
    const data = await res.json()
    setApplying(false)
    if (!res.ok) { setError(data.error ?? 'Error al aplicar el cambio'); return }
    setSelected(new Set())
    router.refresh()
  }

  return (
    <div>
      {/* Buscador + acción en lote */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={q}
          onChange={e => cambiarQuery(e.target.value)}
          placeholder="Buscar jugador por nombre o Discord..."
          style={{
            flex: '1 1 220px', background: '#0f0f0f', border: '1px solid var(--border-gold)', borderRadius: 8,
            color: 'var(--text-primary)', padding: '8px 12px', fontSize: 12, fontFamily: 'var(--font-sans)', outline: 'none',
          }}
        />
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 8, padding: '6px 10px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--gold)', letterSpacing: 0.5 }}>{selected.size} seleccionados</span>
            <select
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value as UserRole)}
              style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'var(--text-primary)', padding: '4px 6px', fontSize: 11, fontFamily: 'var(--font-display)' }}
            >
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <button onClick={aplicarEnLote} disabled={applying} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: applying ? 'not-allowed' : 'pointer',
              background: 'var(--gold)', color: '#000', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
            }}>
              {applying ? '...' : 'Aplicar'}
            </button>
            <button onClick={() => setSelected(new Set())} style={{
              padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 10,
            }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
      {error && <p style={{ color: '#f87171', fontSize: 11, marginBottom: 10 }}>{error}</p>}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 120px 140px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', alignItems: 'center' }}>
          <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} disabled={seleccionables.length === 0} style={{ cursor: seleccionables.length === 0 ? 'not-allowed' : 'pointer' }} />
          {['JUGADOR', 'ROL ACTUAL', 'CAMBIAR ROL'].map(col => (
            <div key={col} style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.5 }}>{col}</div>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-display)' }}>
            Sin resultados para "{q}".
          </div>
        )}

        {paginados.map((p, i) => {
          const puedeSeleccionar = p.id !== meId && !isSuperAdmin(p.nickname_juego)
          return (
            <div key={p.id} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 120px 140px',
              padding: '12px 20px',
              borderBottom: i < paginados.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              alignItems: 'center',
            }}>
              <input
                type="checkbox" checked={selected.has(p.id)} disabled={!puedeSeleccionar}
                onChange={() => toggleUno(p.id)}
                style={{ cursor: puedeSeleccionar ? 'pointer' : 'not-allowed', opacity: puedeSeleccionar ? 1 : 0.3 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {p.discord_avatar
                    ? <img src={p.discord_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)' }}>{p.nickname_juego?.[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: p.id === meId ? 'var(--gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nickname_juego}
                    </span>
                    {p.id === meId && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>(tú)</span>}
                    {isSuperAdmin(p.nickname_juego) && <span style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: 0.5, flexShrink: 0 }}>🔒</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {p.reino} · {p.clase_principal}
                  </div>
                </div>
              </div>

              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: ROLE_BG[p.role] ?? 'rgba(255,255,255,0.05)',
                color: ROLE_COLOR[p.role] ?? 'var(--text-muted)',
                border: `1px solid ${ROLE_COLOR[p.role] ?? 'transparent'}44`,
                padding: '3px 9px', borderRadius: 4,
                fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5,
                width: 'fit-content',
              }}>
                {ROLE_LABEL[p.role] ?? p.role}
              </span>

              <RoleManager
                playerId={p.id}
                currentRole={p.role}
                isSelf={p.id === meId}
                isProtected={isSuperAdmin(p.nickname_juego)}
              />
            </div>
          )
        })}
      </div>

      {filtrados.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            {(paginaActual - 1) * PAGE_SIZE + 1}–{Math.min(paginaActual * PAGE_SIZE, filtrados.length)} de {filtrados.length}
          </span>
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                style={pagBtnStyle(false, paginaActual === 1)}
              >
                ‹
              </button>
              {paginasVisibles(paginaActual, totalPaginas).map((n, idx) =>
                n === '…' ? (
                  <span key={`e${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 12 }}>…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n as number)} style={pagBtnStyle(n === paginaActual, false)}>
                    {n}
                  </button>
                )
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                style={pagBtnStyle(false, paginaActual === totalPaginas)}
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function pagBtnStyle(activa: boolean, deshabilitada: boolean): React.CSSProperties {
  return {
    minWidth: 28, padding: '5px 8px', borderRadius: 6,
    border: `1px solid ${activa ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
    background: activa ? 'rgba(212,175,55,0.15)' : 'transparent',
    color: deshabilitada ? 'var(--text-muted)' : activa ? 'var(--gold)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: activa ? 700 : 400,
    cursor: deshabilitada ? 'not-allowed' : 'pointer', opacity: deshabilitada ? 0.4 : 1,
  }
}

// Lista de páginas a mostrar: siempre primera y última, la actual ±1, con
// "…" donde se corta — así con 14 páginas no se listan 14 botones seguidos.
function paginasVisibles(actual: number, total: number): (number | '…')[] {
  const paginas = new Set<number>([1, total, actual, actual - 1, actual + 1])
  const ordenadas = [...paginas].filter(n => n >= 1 && n <= total).sort((a, b) => a - b)
  const resultado: (number | '…')[] = []
  for (let i = 0; i < ordenadas.length; i++) {
    if (i > 0 && ordenadas[i] - ordenadas[i - 1] > 1) resultado.push('…')
    resultado.push(ordenadas[i])
  }
  return resultado
}
