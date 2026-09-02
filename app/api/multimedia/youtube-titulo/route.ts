import { NextRequest, NextResponse } from 'next/server'

/** oEmbed es público, sin API key — pero se llama desde el servidor
 * (no directo del navegador) para no depender de si YouTube habilita
 * CORS para ese endpoint, mismo criterio que el resto de las
 * integraciones externas del sitio. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Falta la URL' }, { status: 400 })

  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    if (!res.ok) return NextResponse.json({ titulo: null })
    const data = await res.json()
    return NextResponse.json({ titulo: data.title ?? null })
  } catch {
    return NextResponse.json({ titulo: null })
  }
}
