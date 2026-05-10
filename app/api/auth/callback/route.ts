import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
            catch {}
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Verificar si ya tiene perfil creado
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!existing) {
        // Primer login: guardar metadata de Discord
        const meta = user.user_metadata
        await supabase.from('players').upsert({
          user_id:         user.id,
          nickname_juego:  meta?.full_name || meta?.name || 'Jugador',
          discord_username: meta?.full_name,
          discord_avatar:  meta?.avatar_url,
          reino:           'Syrtis',
          clase_principal: 'Bárbaro',
        }, { onConflict: 'user_id', ignoreDuplicates: true })

        return NextResponse.redirect(`${origin}/completar-perfil`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
