/** Full pages opened from the navbar. Each one reuses a section from Home.jsx. */
import { Tools, Trust, Faq } from './Home'
import { useLang } from '../context/LangContext'

export { default as ProductsPage } from './ProductList'
export const ToolsPage = () => <div className="min-h-[70vh]"><Tools /></div>
export const FaqPage = () => <div className="min-h-[70vh]"><Faq /></div>

// About page: intro text + the trust cards
export function AboutPage() {
    const { t } = useLang()
    return (
        <div className="min-h-[70vh]">
            <div className="mx-auto max-w-3xl px-4 pt-14">
                <h1 className="text-3xl font-bold">{t('about.title')}</h1>
                <p className="mt-2 text-lg text-muted">{t('about.lead')}</p>
                {['what', 'how', 'scope'].map(k => (
                    <div key={k} className="mt-5"><h2 className="font-semibold">{t(`about.${k}.t`)}</h2><p className="text-muted">{t(`about.${k}.d`)}</p></div>
                ))}
            </div>
            <Trust />
        </div>
    )
}
