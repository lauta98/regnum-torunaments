'use client'
import { LanguageProvider } from '@/lib/market/i18n'
import { CurrencyProvider } from '@/lib/market/CurrencyContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </LanguageProvider>
  )
}
