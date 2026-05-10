'use client'
import { createClient } from '@/lib/supabase'

export async function signInWithDiscord() {
  const supabase = createClient()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      scopes: 'identify',
    },
  })
  if (error) console.error('Discord OAuth error:', error)
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/'
}

export async function getSessionPlayer() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('players')
    .select('id, nickname_juego, discord_avatar, role, reino, clase_principal')
    .eq('user_id', user.id)
    .single()
  return data
}
