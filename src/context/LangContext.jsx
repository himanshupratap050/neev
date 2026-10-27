/** LangContext: English/Hindi toggle. Use anywhere: const { t, lang, toggle } = useLang() */
import { createContext, useContext, useState } from 'react'
import { T } from '../i18n/translations'

const LangContext = createContext()
export const useLang = () => useContext(LangContext)

export function LangProvider({ children }) {
    // Remember the chosen language even after refresh
    const [lang, setLang] = useState(() => localStorage.getItem('neev-lang') || 'en')
    const toggle = () => setLang(l => {
        const n = l === 'en' ? 'hi' : 'en'
        localStorage.setItem('neev-lang', n)
        return n
    })
    // t('key') -> text in current language; falls back to English, then to the key itself
    const t = key => T[key]?.[lang] ?? T[key]?.en ?? key
    return <LangContext.Provider value={{ lang, toggle, t }}>{children}</LangContext.Provider>
}
