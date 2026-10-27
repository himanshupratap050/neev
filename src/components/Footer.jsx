/** Footer: tagline + short about text + link columns + copyright */
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'

export default function Footer() {
    const { t } = useLang()
    return (
        <footer className="mt-16 bg-slate-brand text-slate-300">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
                <div className="md:col-span-2">
                    <p className="text-xl font-bold text-amber-brand">NEEV <span className="text-sm text-slate-300">नींव</span></p>
                    <p className="mt-1 font-semibold text-white">{t('footer.tagline')}</p>
                    <p className="mt-2 max-w-md text-sm">{t('footer.about')}</p>
                </div>
                <div className="text-sm">
                    <p className="mb-2 font-semibold text-white">{t('footer.marketplace')}</p>
                    <a href="/#products" className="block py-1 hover:text-white">{t('nav.products')}</a>
                    <Link to="/post" className="block py-1 hover:text-white">{t('footer.fab')}</Link>
                </div>
                <div className="text-sm">
                    <p className="mb-2 font-semibold text-white">{t('footer.providers')}</p>
                    <Link to="/signup" className="block py-1 hover:text-white">{t('nav.joinProvider')}</Link>
                    <Link to="/login" className="block py-1 hover:text-white">{t('nav.signin')}</Link>
                </div>
            </div>
            <p className="border-t border-slate-700 py-4 text-center text-xs">© 2026 NEEV. {t('footer.rights')}</p>
        </footer>
    )
}
