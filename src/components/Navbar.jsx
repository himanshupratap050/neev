/**
 * Navbar: logo (left) | section links (middle) | search, language, cart, account (right)
 * Account button opens the profile menu: sign in / signup for guests, role links + logout for users.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, UserCircle, ChevronDown, LogOut, Globe, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function Navbar() {
    const { user, profile } = useAuth()
    const { t, lang, toggle } = useLang()
    const { count } = useCart()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const [menu, setMenu] = useState(false) // mobile hamburger panel
    // Pages opened by the header links
    const NAV = [['/products', 'nav.products'], ['/tools', 'nav.tools'], ['/about', 'nav.about'], ['/faq', 'nav.faq']]

    // Close the profile menu when clicking anywhere outside it
    useEffect(() => {
        const h = e => ref.current && !ref.current.contains(e.target) && setOpen(false)
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    // Links shown inside the profile menu depend on the user's role
    const roleLinks = {
        customer: [['/post', 'nav.post'], ['/my-requests', 'nav.myRequests']],
        provider: [['/leads', 'nav.leads'], ['/my-quotes', 'nav.myQuotes']],
        admin: [['/admin', 'nav.admin']],
    }[profile?.role] ?? []

    async function logout() { setOpen(false); await supabase.auth.signOut(); navigate('/') }
    const item = 'block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-slate-50'

    return (
        <header className="sticky top-0 z-30 bg-slate-brand text-white shadow">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
                {/* LEFT: logo */}
                <Link to="/" className="shrink-0 text-xl font-bold">
                    <span className="text-amber-brand">NEEV</span>
                    <span className="ml-2 text-sm font-medium text-slate-300">नींव</span>
                </Link>

                {/* MIDDLE: anchor links that scroll to Home sections */}
                <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-300 lg:flex">
                    {NAV.map(([to, k]) => <Link key={to} to={to} className="hover:text-white">{t(k)}</Link>)}
                </nav>

                {/* SEARCH: visual only for now (site-wide search logic comes next) */}
                <div className="relative hidden flex-1 md:block">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input placeholder={t('nav.search')}
                        className="w-full rounded-full bg-slate-800 py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-brand" />
                </div>

                {/* RIGHT: language toggle, cart, account */}
                <div className="ml-auto flex items-center gap-4 md:ml-0">
                    <button className="lg:hidden" onClick={() => setMenu(!menu)} aria-label={t(menu ? 'nav.closeMenu' : 'nav.openMenu')}>{menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
                    <button onClick={toggle} className="flex items-center gap-1 text-sm font-semibold">
                        <Globe className="h-5 w-5" />{lang === 'en' ? 'हिंदी' : 'EN'}
                    </button>
                    <Link to="/cart" className="relative" aria-label={t('nav.cart')}>
                        <ShoppingCart className="h-6 w-6" />
                        {count > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-amber-brand px-1.5 text-xs font-bold">{count}</span>}
                    </Link>
                    <div ref={ref} className="relative">
                        <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-sm font-semibold">
                            <UserCircle className="h-6 w-6" />
                            <span className="hidden sm:inline">{user ? t('nav.account') : t('nav.signin')}</span>
                            <ChevronDown className="h-4 w-4" />
                        </button>
                        {open && (
                            <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl bg-white p-3 text-slate-brand shadow-lg">
                                {!user ? (<>
                                    <Link to="/login" onClick={() => setOpen(false)} className="block rounded-xl bg-amber-brand py-3 text-center font-semibold text-white">{t('nav.signin')}</Link>
                                    <p className="mt-2 text-center text-sm text-muted">{t('nav.newToNeev')} <Link to="/signup" onClick={() => setOpen(false)} className="font-semibold text-blue-brand">{t('nav.joinNow')}</Link></p>
                                </>) : (<>
                                    <p className="px-3 font-semibold">{profile?.name ?? t('nav.yourAccount')}</p>
                                    <p className="px-3 pb-2 text-xs text-muted">{t('role.' + profile?.role)}</p>
                                    {roleLinks.map(([to, k]) => <Link key={to} to={to} onClick={() => setOpen(false)} className={item}>{t(k)}</Link>)}
                                    <button onClick={logout} className={item + ' flex w-full items-center gap-2 text-red-600'}><LogOut className="h-4 w-4" />{t('nav.logout')}</button>
                                </>)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* MOBILE / TABLET MENU: same links + search, opened by the hamburger */}
            {menu && (
                <div className="space-y-1 border-t border-slate-700 px-4 py-3 lg:hidden">
                    <input placeholder={t('nav.search')} className="mb-2 w-full rounded-full bg-slate-800 px-4 py-2 text-sm outline-none" />
                    {NAV.map(([to, k]) => <Link key={to} to={to} onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2.5 font-semibold hover:bg-slate-800">{t(k)}</Link>)}
                    <Link to="/post" onClick={() => setMenu(false)} className="block rounded-xl bg-amber-brand px-3 py-2.5 text-center font-semibold">{t('nav.post')}</Link>
                </div>
            )}
        </header>
    )
}
