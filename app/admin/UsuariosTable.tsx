'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABEL, ROLE_COLOR, ROLE_BG, isSuperAdmin } from '@/lib/roles'
import type { UserRole } from '@/lib/types'
import RoleManager from './RoleManager'
import Pagination from '@/components/Pagination'
import { avatarSrc } from '@/lib/avatar'

type Player = {
  id: string; user_id: string | null; nickname_juego: string; reino: string; clase_principal: string
  role: UserRole; discord_username: string | null; discord_avatar: string | null
  avatar_url?: string | null
}

const ALL_ROLES: UserRole[] = ['player', 'organizer', 'admin']
const PAGE_SIZE = 25

type FiltroEstado = 'todos' | 'registrados' | 'no_registrados' | 'organizadores' | 'admins'
const FILTROS: { value: FiltroEstado; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'registrados', label: 'Registrados' },
  { value: 'no_registrados', label: 'No registrados' },
  { value: 'organizadores', label: 'Organizadores' },
  { value: 'admins', label: 'Admins' },
]

const filtroBtnStyle = (active: boolean) => ({
  display: 'flex', alignItems: 'center', padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
  border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
  background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
  color: active ? 'var(--gold)' : 'var(--text-secondary)',
  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
  whiteSpace: 'nowrap', transition: 'all 0.15s',
} as const)

export default function UsuariosTable({ players, meId }: { players: Player[]; meId: string }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkRole, setBulkRole] = useState<UserRole>('organizer')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    return players.filter(p => {
      if (term && !p.nickname_juego?.toLowerCase().includes(term) && !p.discord_username?.toLowerCase().includes(term)) return false
      if (filtro === 'registrados' && !p.user_id) return false
      if (filtro === 'no_registrados' && p.user_id) return false
      if (filtro === 'organizadores' && p.role !== 'organizer') return false
      if (filtro === 'admins' && p.role !== 'admin') return false
      return true
    })
  }, [players, q, filtro])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(page, totalPaginas)
  const paginados = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  const cambiarQuery = (val: string) => { setQ(val); setPage(1) }
  const cambiarFiltro = (val: FiltroEstado) => { setFiltro(val); setPage(1) }

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
          className="field"
          style={{ flex: '1 1 220px' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FILTROS.map(f => (
            <button
              type="button"
              key={f.value}
              onClick={() => cambiarFiltro(f.value)}
              style={filtroBtnStyle(filtro === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--gold)', letterSpacing: 0.5 }}>{selected.size} seleccionados</span>
            <select
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value as UserRole)}
              style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'var(--text-primary)', padding: '4px 6px', fontSize: 11, fontFamily: 'var(--font-display)' }}
            >
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <button onClick={aplicarEnLote} disabled={applying} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 10 }}>
              {applying ? '...' : 'Aplicar'}
            </button>
            <button onClick={() => setSelected(new Set())} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 10 }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
      {error && <p style={{ color: '#f87171', fontSize: 11, marginBottom: 10 }}>{error}</p>}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 120px 140px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', alignItems: 'center' }}>
          <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} disabled={seleccionables.length === 0} style={{ cursor: seleccionables.length === 0 ? 'not-allowed' : 'pointer' }} />
          {['JUGADOR', 'ROL ACTUAL', 'CAMBIAR ROL'].map(col => (
            <div key={col} style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.5 }}>{col}</div>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-display)' }}>
            {q ? `Sin resultados para "${q}".` : 'Sin resultados para este filtro.'}
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
                  {avatarSrc(p)
                    ? <img src={avatarSrc(p)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)' }}>{p.nickname_juego?.[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: p.id === meId ? 'var(--gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nickname_juego}
                    </span>
                    {p.id === meId && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>(tú)</span>}
                    {isSuperAdmin(p.nickname_juego) && <span style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: 0.5, flexShrink: 0 }}>🔒</span>}
                    {!p.user_id && (
                      <span style={{ fontSize: 9, color: '#8A8A8A', background: 'rgba(138,138,138,0.12)', border: '1px solid rgba(138,138,138,0.3)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-display)', letterSpacing: 0.5, flexShrink: 0 }}>
                        SIN REGISTRAR
                      </span>
                    )}
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
          <Pagination page={paginaActual} totalPages={totalPaginas} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
