// Solo server-side — la URL del webhook nunca debe llegar al cliente. Los
// componentes 'use client' que crean torneos/publicaciones piden estas rutas
// después de guardar en Supabase, en vez de postear a Discord directo.
const GOLD = 0xd4af37

type Embed = { title: string; description?: string; url?: string; color?: number; footer?: string }

export async function notifyDiscord(embed: Embed): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return // no configurado — no rompe el flujo que lo llama

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: embed.title,
          description: embed.description,
          url: embed.url,
          color: embed.color ?? GOLD,
          footer: embed.footer ? { text: embed.footer } : undefined,
          timestamp: new Date().toISOString(),
        }],
      }),
    })
  } catch (err) {
    // Un aviso de Discord que falla no debe tumbar la acción real (crear
    // torneo, publicar ítem, coronar campeón) — solo se loguea.
    console.error('[discord-webhook] falló el POST', err)
  }
}

export function siteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://regnum-torunaments.vercel.app'
  return `${base}${path}`
}
