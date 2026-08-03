'use client'
import { useEffect, useState } from 'react'

// ─── Mapa región → moneda ────────────────────────────────────────────────────
export const REGION_CURRENCY: Record<string, string> = {
  AR: 'ARS', US: 'USD', GB: 'GBP', BR: 'BRL',
  CL: 'CLP', MX: 'MXN', UY: 'UYU', CO: 'COP',
  PE: 'PEN', BO: 'BOB', PY: 'PYG', VE: 'VES',
  ES: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR',
  PT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
}

// Símbolos para mostrar al usuario
export const CURRENCY_SYMBOL: Record<string, string> = {
  ARS: '$', USD: 'US$', EUR: '€', BRL: 'R$',
  CLP: '$', MXN: '$', UYU: '$U', COP: '$',
  PEN: 'S/', BOB: 'Bs', PYG: '₲', VES: 'Bs.S',
  GBP: '£',
}

export function detectUserCurrency(): string {
  if (typeof navigator === 'undefined') return 'USD'
  const lang = navigator.language || 'en-US'
  const region = lang.split('-')[1]?.toUpperCase() ?? ''
  return REGION_CURRENCY[region] ?? 'USD'
}

// ─── Convierte amount de fromCurrency a toCurrency usando tasas vs USD ───────
export function convertir(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number | null {
  if (from === to) return amount
  const fromRate = rates[from] // 1 USD = fromRate FROM
  const toRate   = rates[to]   // 1 USD = toRate TO
  if (!fromRate || !toRate) return null
  // amount FROM → USD → TO
  return (amount / fromRate) * toRate
}

// ─── Formatea un número como precio en la moneda dada ───────────────────────
export function formatMoneda(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? ''
  const abs = Math.abs(amount)
  let display: string
  if (currency === 'ARS' || currency === 'CLP' || currency === 'PYG' || currency === 'COP') {
    display = Math.round(abs).toLocaleString('es-AR')
  } else if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
    display = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } else {
    display = abs.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }
  return `${sym} ${display} ${currency}`.trim()
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useTasas() {
  const [rates, setRates]       = useState<Record<string, number>>({})
  const [userCurrency, setUserCurrency] = useState<string>('USD')

  useEffect(() => {
    setUserCurrency(detectUserCurrency())

    const CACHE_KEY = 'tasas_cache'
    const CACHE_TTL = 60 * 60 * 1000

    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { rates: r, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) { setRates(r); return }
      } catch { /* ignorar */ }
    }

    fetch('/api/tasas')
      .then(r => r.json())
      .then((r: Record<string, number>) => {
        setRates(r)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: r, ts: Date.now() }))
      })
      .catch(() => { /* sin tasas: no mostrar conversión */ })
  }, [])

  return { rates, userCurrency }
}
