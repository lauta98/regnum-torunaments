import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ListingCard from '@/components/market/ListingCard'
import Link from 'next/link'

export default async function FavoritosPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: favs } = await supabase
    .from('favorites')
    .select('listing_id, listings(*, profiles(username, avg_rating, total_reviews, last_sign_in_at))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const listings = (favs || []).map((f: any) => f.listings).filter(Boolean)
  const favIds = new Set(listings.map((l: any) => l.id))

  return (
    <div style={{ padding: '24px 20px 48px', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/market" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← Volver</Link>
        <h1 className="cinzel" style={{ fontSize: 20, color: 'var(--gold)' }}>♥ Favoritos</h1>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{listings.length} guardado{listings.length !== 1 ? 's' : ''}</span>
      </div>

      {listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
          <p className="cinzel" style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
            Sin favoritos aún
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, fontStyle: 'italic' }}>
            Tocá el ♡ en cualquier publicación para guardarla acá
          </p>
          <Link href="/market" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            color: 'var(--dark-bg)', padding: '10px 24px', borderRadius: 8,
            fontFamily: "'Cinzel',serif", fontSize: 12, textDecoration: 'none', fontWeight: 700,
          }}>
            VER MERCADO
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, alignItems: 'stretch' }}>
          {listings.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} isFavorito={favIds.has(listing.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
