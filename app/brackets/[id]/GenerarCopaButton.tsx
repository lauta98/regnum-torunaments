'use client'
import { useState } from 'react'

export default function GenerarCopaButton({ torneoId, cupo }: { torneoId: string; cupo: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generar = async () => {
    if (!confirm(`¿Generar la copa con los ${cupo} mejores puestos de la liga? No se puede deshacer.`)) return
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/generar-copa`, { method: 'POST' })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json().catch(() => null)
      setError(d?.error ?? 'Error al generar la copa')
      setLoading(false)
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        La liga terminó. Listo para armar la copa.
      </p>
      <button onClick={generar} disabled={loading} className="btn btn-primary" style={{ padding: '12px 28px' }}>
        {loading ? 'Generando...' : `⚔ Generar Copa (top ${cupo})`}
      </button>
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 14 }}>{error}</p>}
    </div>
  )
}
