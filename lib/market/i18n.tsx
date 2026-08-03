'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import es from '@/messages/es.json'
import en from '@/messages/en.json'
import de from '@/messages/de.json'

export type Lang = 'es' | 'en' | 'de'

const MESSAGES: Record<Lang, Record<string, string>> = { es, en, de }

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const Ctx = createContext<LangCtx>({
  lang: 'es',
  setLang: () => {},
  t: (k) => k,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved && ['es', 'en', 'de'].includes(saved)) setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let str = MESSAGES[lang][key] ?? MESSAGES['es'][key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useLanguage() {
  return useContext(Ctx)
}
