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
      const meta = user.user_metadata
      const discordUsername = meta?.full_name || meta?.name

      // 1. Buscar perfil ya vinculado a este user_id
      const { data: byUserId } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (byUserId) {
        // Ya tiene perfil vinculado → ir al inicio
        return NextResponse.redirect(`${origin}${next}`)
      }

      // 2. Buscar perfil migrado con el mismo discord_username (sin user_id aún)
      if (discordUsername) {
        const { data: byDiscord } = await supabase
          .from('players')
          .select('id')
          .eq('discord_username', discordUsername)
          .is('user_id', null)
          .single()

        if (byDiscord) {
          // Auto-vincular: asociar este Discord al perfil existente
          await supabase
            .from('players')
            .update({
              user_id:        user.id,
              discord_avatar: meta?.avatar_url,
            })
            .eq('id', byDiscord.id)

          return NextResponse.redirect(`${origin}${next}`)
        }
      }

      // 3. Primer login sin perfil previo → completar perfil
      return NextResponse.redirect(`${origin}/completar-perfil`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
