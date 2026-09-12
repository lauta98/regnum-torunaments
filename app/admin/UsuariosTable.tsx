'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABEL, ROLE_COLOR, ROLE_BG, isSuperAdmin } from '@/lib/roles'
import { REINO_COLOR } from '@/lib/constants'
import type { UserRole, Reino } from '@/lib/types'
import RoleManager from './RoleManager'
import Pagination from '@/components/Pagination'
import { avatarSrc } from '@/lib/avatar'
import { IconLock } from './AdminIcons'

type Player = {
  id: string; user_id: string | null; nickname_juego: string; reino: string; clase_principal: string
  role: UserRole; discord_username: string | null; discord_avatar: string | null
  avatar_url?: string | null
}

const ALL_ROLES: UserRole[] = ['player', 'organizer', 'admin']
const PAGE_SIZE = 25

type FiltroEstado = 'todos' | 'registrados' | 'no_registrados' | 'organizadores' | 'admins'

const filtroBtnStyle = (active: boolean) => ({
  display: 'flex', alignItems: 'center', padding: '7px 14px', cursor: 'pointer',
  border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
  background: active ? 'color-mix(in srgb, var(--gold) 12%, transparent)' : 'transparent',
  color: active ? 'var(--gold)' : 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
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

  // Conteos reales sobre el total de players (no sobre `filtrados`, que ya
  // aplicó el propio filtro) — cada pill muestra cuántos caen en su
  // categoría independientemente de cuál esté activa ahora.
  const FILTROS: { value: FiltroEstado; label: string; count: number }[] = [
    { value: 'todos', label: 'Todos', count: players.length },
    { value: 'registrados', label: 'Registrados', count: players.filter(p => p.user_id).length },
    { value: 'no_registrados', label: 'No registrados', count: players.filter(p => !p.user_id).length },
    { value: 'organizadores', label: 'Organizadores', count: players.filter(p => p.role === 'organizer').length },
    { value: 'admins', label: 'Admins', count: players.filter(p => p.role === 'admin').length },
  ]

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
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'color-mix(in srgb, var(--gold) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)', padding: '6px 10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{selected.size} seleccionados</span>
            <select
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value as UserRole)}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '4px 6px', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            >
              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <button onClick={aplicarEnLote} disabled={applying} style={{
              padding: '5px 12px', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase',
              cursor: applying ? 'default' : 'pointer', background: 'var(--gold)', color: '#050505', border: '1px solid var(--gold-light)', fontWeight: 700,
            }}>
              {applying ? '...' : 'Aplicar'}
            </button>
            <button onClick={() => setSelected(new Set())} style={{
              padding: '5px 10px', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase',
              cursor: 'pointer', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
            }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
      {error && <p style={{ color: '#f87171', fontSize: 11, marginBottom: 10 }}>{error}</p>}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 140px 120px 140px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', alignItems: 'center' }}>
          <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos} disabled={seleccionables.length === 0} style={{ cursor: seleccionables.length === 0 ? 'not-allowed' : 'pointer' }} />
          {['JUGADOR', 'REGISTRO', 'ROL ACTUAL', 'CAMBIAR ROL'].map(col => (
            <div key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{col}</div>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-display-v2)' }}>
            {q ? `Sin resultados para "${q}".` : 'Sin resultados para este filtro.'}
          </div>
        )}

        {paginados.map((p, i) => {
          const puedeSeleccionar = p.id !== meId && !isSuperAdmin(p.nickname_juego)
          const rc = REINO_COLOR[p.reino as Reino] ?? 'var(--border)'
          return (
            <div key={p.id} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 140px 120px 140px',
              padding: '12px 20px 12px 17px',
              borderBottom: i < paginados.length - 1 ? '1px solid var(--border)' : 'none',
              borderLeft: `3px solid ${rc}`,
              alignItems: 'center',
            }}>
              <input
                type="checkbox" checked={selected.has(p.id)} disabled={!puedeSeleccionar}
                onChange={() => toggleUno(p.id)}
                style={{ cursor: puedeSeleccionar ? 'pointer' : 'not-allowed', opacity: puedeSeleccionar ? 1 : 0.3 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {avatarSrc(p)
                    ? <img src={avatarSrc(p)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 13, color: 'var(--text-muted)' }}>{p.nickname_juego?.[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display-v2)', fontSize: 14, fontWeight: 600, color: p.id === meId ? 'var(--gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nickname_juego}
                    </span>
                    {p.id === meId && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>(tú)</span>}
                    {isSuperAdmin(p.nickname_juego) && <span style={{ color: 'var(--gold)', display: 'flex', flexShrink: 0 }}><IconLock size={11} /></span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: rc }}>
                    {p.reino} · {p.clase_principal}
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {p.user_id
                  ? <span style={{ color: 'var(--text-secondary)' }}>@{p.discord_username ?? '—'}</span>
                  : <span style={{ color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 9 }}>Sin registrar</span>}
              </div>

              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: ROLE_BG[p.role] ?? 'var(--bg-surface)',
                color: ROLE_COLOR[p.role] ?? 'var(--text-muted)',
                border: `1px solid color-mix(in srgb, ${ROLE_COLOR[p.role] ?? 'var(--text-muted)'} 35%, transparent)`,
                padding: '3px 9px',
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
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
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {(paginaActual - 1) * PAGE_SIZE + 1}–{Math.min(paginaActual * PAGE_SIZE, filtrados.length)} de {filtrados.length}
          </span>
          <Pagination page={paginaActual} totalPages={totalPaginas} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
