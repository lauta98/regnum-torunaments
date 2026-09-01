'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function ResolverReclamo({ reclamoId }: { reclamoId: string }) {
  const router = useRouter()
  const [status, setStatus]     = useState<'idle' | 'ok_transferir' | 'ok_rechazar' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  const resolver = (accion: 'transferir' | 'rechazar') => {
    startTransition(async () => {
      const res = await fetch('/api/admin/resolver-reclamo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reclamoId, accion }),
      })
      if (res.ok) {
        setStatus(accion === 'transferir' ? 'ok_transferir' : 'ok_rechazar')
        // Sin esto el reclamo resuelto se queda pegado en la lista de
        // "pendientes" (con el check ya marcado) hasta que alguien recargue
        // a mano — mismo bug que ya se encontró y corrigió hoy en
        // RoleManager, el resto de esta familia de componentes de admin
        // tampoco refrescaba al padre.
        router.refresh()
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 2500)
      }
    })
  }

  if (status === 'ok_transferir') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 14 }}>✅</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#4CAF50', letterSpacing: 0.5 }}>Transferido</span>
    </div>
  )

  if (status === 'ok_rechazar') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 14 }}>✗</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#909090', letterSpacing: 0.5 }}>Rechazado</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={() => resolver('transferir')}
        disabled={isPending}
        style={{ padding: '6px 10px', borderRadius: 6, cursor: isPending ? 'not-allowed' : 'pointer', background: 'rgba(76,175,80,0.12)', color: '#4CAF50', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5, border: '1px solid rgba(76,175,80,0.3)', whiteSpace: 'nowrap' }}
      >
        ✓ Transferir
      </button>
      <button
        onClick={() => resolver('rechazar')}
        disabled={isPending}
        style={{ padding: '6px 10px', borderRadius: 6, cursor: isPending ? 'not-allowed' : 'pointer', background: 'rgba(244,67,54,0.08)', color: '#f87171', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 0.5, border: '1px solid rgba(244,67,54,0.25)', whiteSpace: 'nowrap' }}
      >
        ✗ Rechazar
      </button>
      {status === 'error' && (
        <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--font-display)' }}>Error</span>
      )}
    </div>
  )
}
