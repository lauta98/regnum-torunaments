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
        className="field"
        style={{ flex: 1 }}
      />
      <button type="submit" className="btn btn-primary">
        Buscar
      </button>
    </form>
  )
}
