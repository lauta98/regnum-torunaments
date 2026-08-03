'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function BotonComprar({ listing, currentUserId }: {
  listing: any
  currentUserId: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const esDueno = listing.user_id === currentUserId
  const esVenta = listing.type === 'sell'

  if (!currentUserId) return (
    <a href="/login" style={{
      display: 'block', width: '100%', textAlign: 'center',
      background: 'linear-gradient(135deg, #1a5c35, #2E7D52)',
      color: 'white', padding: '12px', borderRadius: 8,
      fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: 1,
      textDecoration: 'none', fontWeight: 700, marginTop: 16,
    }}>
      ENTRAR PARA {esVenta ? 'COMPRAR' : 'VENDER'}
    </a>
  )

  if (esDueno) return (
    <div style={{
      marginTop: 16, padding: '10px 14px', borderRadius: 8,
      background: 'var(--dark-surface)', border: '1px solid var(--dark-border)',
      fontSize: 13, color: 'var(--text-muted)', textAlign: 'center',
    }}>
      Esta es tu publicación
    </div>
  )

  if (done) return (
    <div style={{
      marginTop: 16, padding: '12px', borderRadius: 8, textAlign: 'center',
      background: 'rgba(46,125,82,0.1)', border: '1px solid rgba(46,125,82,0.4)',
      color: '#5BC98B', fontSize: 14,
    }}>
      ✅ Solicitud enviada —{' '}
      <a href="/transacciones" style={{ color: '#5BC98B', fontWeight: 700, textDecoration: 'underline' }}>
        ver en Mis Tratos
      </a>
    </div>
  )

  const handleClick = async () => {
    setLoading(true)
    setError('')

    // Verificar que no existe ya una transacción activa
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('listing_id', listing.id)
      .eq(esVenta ? 'buyer_id' : 'seller_id', currentUserId)
      .single()

    if (existing) {
      setError('Ya tenés una solicitud activa para este ítem')
      setLoading(false)
      return
    }

    const { error: txError } = await supabase.from('transactions').insert({
      listing_id: listing.id,
      seller_id: esVenta ? listing.user_id : currentUserId,
      buyer_id: esVenta ? currentUserId : listing.user_id,
      confirmed_by_seller: !esVenta, // si es búsqueda, el "vendedor" (quien tiene el ítem) ya confirmó
      confirmed_by_buyer: esVenta,   // si es venta, el comprador ya confirmó al clickear
    })

    if (txError) {
      setError(txError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={handleClick} disabled={loading} style={{
        width: '100%', padding: '12px', borderRadius: 8, cursor: 'pointer',
        fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: 1, fontWeight: 700,
        border: 'none', color: esVenta ? 'var(--dark-bg)' : 'white',
        background: esVenta
          ? 'linear-gradient(135deg, var(--gold-dark), var(--gold))'
          : 'linear-gradient(135deg, #0f2d52, #1E4A7A)',
      }}>
        {loading ? 'Procesando...' : esVenta ? '⚔ INICIAR TRATO' : '🗡 TENGO ESTE ÍTEM'}
      </button>
      {error && <p style={{ color: '#E24B4A', fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  )
}