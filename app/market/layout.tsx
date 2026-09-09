import Providers from '@/components/market/Providers'
import Header from '@/components/Header'

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {/* Header queda afuera del scope: es compartido con el resto del
          sitio y no debe tomar la paleta cálida de Comercio. */}
      <Header />
      <div className="theme-market">
        {children}
      </div>
    </Providers>
  )
}
