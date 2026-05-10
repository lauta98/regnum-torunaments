import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'CoR Tournament Stats', template: '%s | CoR Tournaments' },
  description: 'Estadísticas, rankings y rivalidades PvP de Champions of Regnum.',
  openGraph: {
    siteName: 'CoR Tournament Stats',
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
