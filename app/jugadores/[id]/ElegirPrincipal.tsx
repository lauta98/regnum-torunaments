'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

/** Estrella para que el dueño de la cuenta elija con qué personaje se lo
 * identifica (nombre de usuario) en el ranking por cuenta y demás lugares
 * donde antes solo se mostraba el discord_username. */
export default function ElegirPrincipal({ playerId, personajeId, esPrincipal }: { playerId: string; personajeId: string; esPrincipal: boolean }) {
  const [loading, setLoading] = useState(false)

  const elegir = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').update({ personaje_principal_id: personajeId }).eq('id', playerId)
    if (!error) window.location.reload()
    else setLoading(false)
  }

  return (
    <button
      onClick={elegir}
      disabled={loading || esPrincipal}
      title={esPrincipal ? 'Este es tu personaje principal' : 'Usar como nombre de usuario'}
      style={{
        background: 'transparent', border: 'none', cursor: esPrincipal ? 'default' : 'pointer',
        fontSize: 14, opacity: esPrincipal ? 1 : 0.3, padding: 2, lineHeight: 1,
      }}
    >
      {esPrincipal ? '⭐' : '☆'}
    </button>
  )
}
