/** Sin API key — YouTube sirve estas miniaturas públicamente para
 * cualquier video, mientras se conozca el id. */
export function extraerIdYoutube(url: string): string | null {
  const patrones = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ]
  for (const p of patrones) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function thumbnailYoutube(url: string): string | null {
  const id = extraerIdYoutube(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export function esUrlKick(url: string): boolean {
  return /^https?:\/\/(www\.)?kick\.com\//i.test(url.trim())
}
