/**
 * ProviderLayout: separate dashboard for providers (no customer navbar/footer).
 * Desktop = left sidebar. Mobile = the same links as a scrollable top strip.
 */
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Inbox, ClipboardList, Package, Store, ExternalLink, LogOut, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'

export default function ProviderLayout() {
    const { user, profile } = useAuth()
    const { t, lang, toggle } = useLang()
    const navigate = useNavigate()

    // [path, icon, text, only-highlight-on-exact-path]
    const links = [
        ['/provider', LayoutDashboard, 'Dashboard', true],
        ['/leads', Inbox, t('nav.leads')],
        ['/my-quotes', ClipboardList, t('nav.myQuotes')],
        ['/provider/products', Package, t('side.products')],
        ['/provider/profile', Store, 'Shop profile'],
    ]
    const cls = ({ isActive }) => `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-amber-brand text-white' : 'text-slate-300 hover:bg-slate-800'}`
    async function logout() { await supabase.auth.signOut(); navigate('/') }

    return (
        <div className="min-h-screen md:flex">
            <aside className="bg-slate-brand p-3 text-white md:sticky md:top-0 md:h-screen md:w-60">
                <p className="px-2 py-2 text-xl font-bold text-amber-brand">NEEV <span className="text-xs text-slate-300">{t('side.dashboard')}</span></p>
                <p className="hidden px-2 pb-3 text-sm text-slate-300 md:block">{profile?.name}</p>
                <nav className="flex gap-1 overflow-x-auto md:flex-col">
                    {links.map(([to, Icon, text, end]) => (
                        <NavLink key={to} to={to} end={end} className={cls}><Icon className="h-4 w-4" />{text}</NavLink>
                    ))}
                    <Link to={`/shop/${user.id}`} className={cls({ isActive: false })}><ExternalLink className="h-4 w-4" />My shop page</Link>
                    <button onClick={toggle} className={cls({ isActive: false })}><Globe className="h-4 w-4" />{lang === 'en' ? 'हिंदी' : 'EN'}</button>
                    <Link to="/products" className={cls({ isActive: false })}>{t('side.website')}</Link>
                    <button onClick={logout} className={cls({ isActive: false }) + ' !text-red-400'}><LogOut className="h-4 w-4" />{t('nav.logout')}</button>
                </nav>
            </aside>
            <main className="flex-1"><Outlet /></main>
        </div>
    )
}