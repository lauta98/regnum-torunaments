'use client'
import { useState, useTransition } from 'react'
import { ROLE_LABEL, ROLE_COLOR } from '@/lib/roles'
import type { UserRole } from '@/lib/types'

const ALL_ROLES: UserRole[] = ['player', 'organizer', 'admin']

export default function RoleManager({
  playerId,
  currentRole,
  isSelf,
  isProtected,
}: {
  playerId: string
  currentRole: UserRole
  isSelf: boolean
  isProtected: boolean
}) {
  const [role, setRole] = useState<UserRole>(currentRole)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  const disabled = isSelf || isProtected || isPending

  const handleChange = (newRole: UserRole) => {
    if (newRole === role || disabled) return
    startTransition(async () => {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: playerId, newRole }),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error ?? 'Error')
        setStatus('error')
        setTimeout(() => { setStatus('idle'); setErrorMsg('') }, 3000)
      } else {
        setRole(newRole)
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 1800)
      }
    })
  }

  const selectColor = ROLE_COLOR[role]

  if (isProtected) {
    return (
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5,
        color: 'var(--gold)', background: 'rgba(212,175,55,0.08)',
        border: '1px solid rgba(212,175,55,0.25)',
        padding: '3px 8px', borderRadius: 4,
      }}>
        🔒 Permanente
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select
        value={role}
        disabled={disabled}
        onChange={e => handleChange(e.target.value as UserRole)}
        title={isSelf ? 'No podés cambiar tu propio rol' : undefined}
        style={{
          background: 'var(--bg-input)',
          border: `1px solid ${selectColor}44`,
          borderRadius: 6,
          color: selectColor,
          padding: '4px 8px',
          fontSize: 11,
          fontFamily: 'var(--font-display)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          opacity: disabled ? 0.4 : 1,
          letterSpacing: 0.5,
        }}
      >
        {ALL_ROLES.map(r => (
          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
        ))}
      </select>

      {status === 'saved' && (
        <span style={{ fontSize: 10, color: '#4CAF50', fontFamily: 'var(--font-display)' }}>✓</span>
      )}
      {status === 'error' && (
        <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-display)', maxWidth: 120 }}>{errorMsg}</span>
      )}
      {isPending && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>...</span>
      )}
    </div>
  )
}
