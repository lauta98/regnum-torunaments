'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { REGION_CURRENCY, convertir, formatMoneda } from '@/lib/market/useTasas'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CurrencyCtx {
  enabled: boolean
  toggle: () => void
  userCurrency: string       // moneda detectada por IP (ej: 'EUR', 'BRL')
  rates: Record<string, number>
  convertir: typeof convertir
  formatMoneda: typeof formatMoneda
}

const DEFAULTS: CurrencyCtx = {
  enabled: false,
  toggle: () => {},
  userCurrency: 'USD',
  rates: {},
  convertir,
  formatMoneda,
}

const CurrencyContext = createContext<CurrencyCtx>(DEFAULTS)

// ─── Provider ────────────────────────────────────────────────────────────────

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [enabled,      setEnabled]      = useState(false)
  const [userCurrency, setUserCurrency] = useState('USD')
  const [rates,        setRates]        = useState<Record<string, number>>({})

  useEffect(() => {
    // Leer preferencia guardada
    setEnabled(localStorage.getItem('currency-conv') === '1')

    // Detectar moneda desde cookie ucountry (seteada por proxy.ts con x-vercel-ip-country)
    const match = document.cookie.match(/(?:^|;\s*)ucountry=([A-Z]{2})/)
    const country = match?.[1] ?? ''
    setUserCurrency(REGION_CURRENCY[country] ?? 'USD')

    // Tasas: localStorage cache 1h
    const CACHE_KEY = 'tasas_cache'
    const CACHE_TTL = 60 * 60 * 1000
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { rates: r, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) { setRates(r); return }
      }
    } catch { /* ignorar */ }

    fetch('/api/tasas')
      .then(r => r.json())
      .then((r: Record<string, number>) => {
        setRates(r)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: r, ts: Date.now() }))
      })
      .catch(() => {})
  }, [])

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev
      localStorage.setItem('currency-conv', next ? '1' : '0')
      return next
    })
  }, [])

  return (
    <CurrencyContext.Provider value={{ enabled, toggle, userCurrency, rates, convertir, formatMoneda }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
