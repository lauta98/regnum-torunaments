'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import Spinner from '@/components/market/Spinner'

export default function EditarListing({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [itemName, setItemName] = useState('')
  const [desc, setDesc] = useState('')
  const [priceMagnanitas, setPriceMagnanitas] = useState('')
  const [priceReal, setPriceReal] = useState('')
  const [currency, setCurrency] = useState('ARS')

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('listings').select('*').eq('id', id).eq('user_id', user.id).single()
      if (!data) { router.push('/market/mis-listings'); return }
      setListing(data)
      setItemName(data.item_name || '')
      setDesc(data.description || '')
      setPriceMagnanitas(data.price_gold ? String(data.price_gold) : '')
      setPriceReal(data.price_money ? String(data.price_money) : '')
      setCurrency(data.currency_label || 'ARS')
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    if (!priceMagnanitas && !priceReal) {
      setError('Ingresá al menos un precio')
      return
    }
    setSaving(true)
    setError('')
    const { error: updateError } = await supabase.from('listings').update({
      item_name: itemName,
      description: desc,
      price_gold: priceMagnanitas ? parseFloat(priceMagnanitas) : null,
      price_money: priceReal ? parseFloat(priceReal) : null,
      currency_label: currency,
    }).eq('id', id)
    if (updateError) { setError(updateError.message); setSaving(false); return }
    router.push('/market/mis-listings')
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 14, outline: 'none',
  }
  const lbl: React.CSSProperties = {
    fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 6,
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
  )

  return (
    <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 600 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/market/mis-listings" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 className="cinzel" style={{ fontSize: 18, color: 'var(--gold)' }}>
            ✏ Editar publicación
          </h1>
        </div>

        {/* Info del ítem (no editable) */}
        <div style={{ background: 'var(--dark-surface)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ fontFamily: "'Cinzel',serif", color: 'var(--text-primary)', fontSize: 13 }}>{listing?.item_name}</span>
          {' · '}
          <span style={{ textTransform: 'capitalize' }}>{listing?.item_category}</span>
          {listing?.subcategoria && <span> · {listing.subcategoria}</span>}
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Nombre del ítem</label>
          <input style={inp} value={itemName} onChange={e => setItemName(e.target.value)} />
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Descripción</label>
          <textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }}
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Describí el ítem, condiciones, etc." />
        </div>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--dark-border)' }} />
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>PRECIO</span>
          <div style={{ flex: 1, height: 1, background: 'var(--dark-border)' }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>🪨 Magnanitas (opcional)</label>
          <input style={inp} type="number" placeholder="Ej: 10"
            value={priceMagnanitas} onChange={e => setPriceMagnanitas(e.target.value)} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>$ Dinero real (opcional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
            <input style={inp} type="number" placeholder="Ej: 2500"
              value={priceReal} onChange={e => setPriceReal(e.target.value)} />
            <select style={{ ...inp, width: 90, cursor: 'pointer' }} value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
            Podés poner ambos precios
          </p>
        </div>

        {error && <p style={{ color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/market/mis-listings" style={{
            flex: 1, padding: '10px', borderRadius: 8, textAlign: 'center',
            border: '1px solid var(--dark-border)', color: 'var(--text-muted)',
            fontFamily: "'Cinzel',serif", fontSize: 12, textDecoration: 'none',
          }}>
            Cancelar
          </Link>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: '10px', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            color: 'var(--dark-bg)', border: 'none',
            fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: 1,
          }}>
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner size={16} color="var(--dark-bg)" />
                Guardando...
              </span>
            ) : '✓ GUARDAR CAMBIOS'}
          </button>
        </div>
      </div>
    </div>
  )
}
