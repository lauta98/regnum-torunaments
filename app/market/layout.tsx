import Providers from '@/components/market/Providers'
import Header from '@/components/Header'

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Header />
      {children}
    </Providers>
  )
}
