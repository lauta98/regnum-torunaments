'use client'
import { useState } from 'react'

type Listing = {
  id: string; item_name: string; item_category: string; type: string; status: string
  price_gold: number | null; price_money: number | null; currency_label: string | null
  user_id: string; created_at: string; seller?: { username: string }
}

const ESTADOS = ['active', 'reserved', 'completed']

export default function PublicacionesTab() {
  const [q, setQ] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [error, setError] = useState('')

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim().length < 2) return
    setLoading(true); setError(''); setBuscado(true)
    const res = await fetch(`/api/market/admin/listings?q=${encodeURIComponent(q.trim())}`)
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al buscar'); return }
    setListings(data.listings ?? [])
  }

  const actualizar = (id: string, cambios: Partial<Listing>) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...cambios } : l))
  }

  return (
    <div>
      <form onSubmit={buscar} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar publicación por nombre de ítem..."
          style={{
            flex: 1, background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
            borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
          }}
        />
        <button type="submit" disabled={loading} style={{
          padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'var(--gold)', color: '#000', fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 12,
        }}>
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 8, padding: 14, color: '#E24B4A', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {buscado && !loading && listings.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Sin resultados para "{q}"
        </div>
      )}

      {listings.map(l => <ListingRow key={l.id} listing={l} onUpdate={actualizar} onRemove={() => setListings(prev => prev.filter(x => x.id !== l.id))} />)}
    </div>
  )
}

function ListingRow({ listing, onUpdate, onRemove }: { listing: Listing; onUpdate: (id: string, c: Partial<Listing>) => void; onRemove: () => void }) {
  const [editando, setEditando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    item_name: listing.item_name, status: listing.status,
    price_gold: listing.price_gold ?? '', price_money: listing.price_money ?? '',
    currency_label: listing.currency_label ?? '',
  })

  const guardar = async () => {
    setLoading(true); setError('')
    const res = await fetch('/api/market/admin/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: listing.id,
        item_name: form.item_name,
        status: form.status,
        price_gold: form.price_gold === '' ? null : Number(form.price_gold),
        price_money: form.price_money === '' ? null : Number(form.price_money),
        currency_label: form.currency_label || null,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }
    onUpdate(listing.id, {
      item_name: form.item_name, status: form.status,
      price_gold: form.price_gold === '' ? null : Number(form.price_gold),
      price_money: form.price_money === '' ? null : Number(form.price_money),
      currency_label: form.currency_label || null,
    })
    setEditando(false)
  }

  const borrar = async () => {
    setLoading(true); setError('')
    const res = await fetch('/api/market/admin/listings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: listing.id }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al borrar'); setConfirmando(false); return }
    onRemove()
  }

  const inputStyle = {
    background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 6,
    color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box',
  } as const

  return (
    <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 10, padding: 16, marginBottom: 10 }}>
      {editando ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 10 }}>
            <input style={inputStyle} value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="Nombre del ítem" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input style={inputStyle} type="number" value={form.price_gold} onChange={e => setForm(f => ({ ...f, price_gold: e.target.value }))} placeholder="Precio (gold)" />
              <input style={inputStyle} type="number" value={form.price_money} onChange={e => setForm(f => ({ ...f, price_money: e.target.value }))} placeholder="Precio (dinero real)" />
              <input style={inputStyle} value={form.currency_label} onChange={e => setForm(f => ({ ...f, currency_label: e.target.value }))} placeholder="Moneda (ej. ARS)" />
            </div>
            <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {error && <p style={{ color: '#E24B4A', fontSize: 11, marginBottom: 8 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={guardar} disabled={loading} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--gold)', color: '#000', fontFamily: "'Cinzel',serif", fontSize: 11, fontWeight: 700 }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => { setEditando(false); setError('') }} style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', background: 'none', border: '1px solid var(--dark-border)', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 11 }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div className="cinzel" style={{ fontSize: 14, color: 'var(--text-primary)' }}>{listing.item_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              por <strong style={{ color: 'var(--text-primary)' }}>{listing.seller?.username ?? '—'}</strong>
              {' · '}{listing.status}
              {listing.price_gold ? ` · ${listing.price_gold} gold` : ''}
              {listing.price_money ? ` · ${listing.price_money} ${listing.currency_label ?? ''}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            {confirmando ? (
              <>
                {error && <span style={{ fontSize: 10, color: '#E24B4A' }}>{error}</span>}
                <button onClick={borrar} disabled={loading} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(226,75,74,0.15)', border: '1px solid rgba(226,75,74,0.4)', color: '#E24B4A', fontFamily: 'inherit' }}>
                  {loading ? '...' : 'Confirmar'}
                </button>
                <button onClick={() => { setConfirmando(false); setError('') }} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'none', border: '1px solid var(--dark-border)', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditando(true)} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'none', border: '1px solid var(--gold-dark)', color: 'var(--gold)', fontFamily: 'inherit' }}>
                  Editar
                </button>
                <button onClick={() => setConfirmando(true)} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: 'none', border: '1px solid rgba(226,75,74,0.3)', color: '#E24B4A', fontFamily: 'inherit' }}>
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
