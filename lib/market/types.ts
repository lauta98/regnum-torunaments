export type ListingType = 'sell' | 'buy'
export type ListingCat = 'armas' | 'armaduras' | 'joyas' | 'consumibles' | 'materiales' | 'monturas' | 'otros'
export type ListingStatus = 'active' | 'reserved' | 'completed'

export interface Profile {
  id: string
  username: string
  discord: string | null
  whatsapp: string | null
  avg_rating: number
  total_reviews: number
  created_at: string
}

export interface Listing {
  id: string
  user_id: string
  type: ListingType
  item_name: string
  item_category: ListingCat
  item_image_url: string | null
  image_urls: string[] | null    // additional images for sets / carousel (max 4)
  is_set: boolean | null
  description: string
  price_gold: number | null
  price_money: number | null
  currency_label: string
  status: ListingStatus
  created_at: string
  profiles?: Profile
}

export interface Transaction {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string
  confirmed_by_seller: boolean
  confirmed_by_buyer: boolean
  completed_at: string | null
  created_at: string
  listings?: Listing
  seller?: Profile
  buyer?: Profile
}

export interface Review {
  id: string
  transaction_id: string
  reviewer_id: string
  reviewed_id: string
  score: number
  comment: string | null
  created_at: string
  reviewer?: Profile
}