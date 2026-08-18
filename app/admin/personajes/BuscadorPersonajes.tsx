'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BuscadorPersonajes({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)

  const buscar = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(q.trim() ? `/admin/personajes?q=${encodeURIComponent(q.trim())}` : '/admin/personajes')
  }

  return (
    <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar por nickname (mín. 2 caracteres)..."
        style={{
          flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-gold)',
          borderRadius: 8, color: 'var(--text-primary)', padding: '10px 14px',
          fontSize: 14, fontFamily: 'var(--font-display)', outline: 'none',
        }}
      />
      <button type="submit" style={{
        padding: '10px 20px', borderRadius: 8, border: 'none',
        background: 'var(--gold)', color: '#000', cursor: 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
      }}>
        Buscar
      </button>
    </form>
  )
}
