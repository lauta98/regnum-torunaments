import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'CoR — Torneos y Comercio', template: '%s | CoR' },
  description: 'Torneos, rankings y mercado de la comunidad de Champions of Regnum.',
  openGraph: {
    siteName: 'CoR',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
