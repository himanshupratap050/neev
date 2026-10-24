import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
    Home, PlusCircle, ClipboardList, Inbox, ShieldCheck,
    LogOut, UserCircle, ChevronDown, Store, Menu, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ROLE_LABEL = { customer: 'Customer', provider: 'Provider', admin: 'Admin' }

function MenuItem({ to, icon: Icon, children, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-slate-50"
        >
            <Icon className="h-5 w-5 text-muted" />
            {children}
        </Link>
    )
}

function AccountMenu({ user, profile, links, onLogout }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        function onDown(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [])

    const close = () => setOpen(false)

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 text-sm font-semibold text-white"
                aria-expanded={open}
            >
                <UserCircle className="h-6 w-6" />
                <span>{user ? 'Account' : 'Sign in'}</span>
                <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-30 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-3 text-slate-brand shadow-lg">
                    {!user ? (
                        <>
                            <Link
                                to="/login" onClick={close}
                                className="block rounded-xl bg-amber-brand py-3 text-center font-semibold text-white"
                            >
                                Sign in
                            </Link>
                            <p className="mt-2 text-center text-sm text-muted">
                                New to NEEV?{' '}
                                <Link to="/signup" onClick={close} className="font-semibold text-blue-brand">Join now</Link>
                            </p>
                            <div className="mt-3 border-t border-slate-100 pt-2">
                                <MenuItem to="/" icon={Home} onClick={close}>Home</MenuItem>
                                <MenuItem to="/post" icon={PlusCircle} onClick={close}>Post a requirement</MenuItem>
                                <MenuItem to="/signup" icon={Store} onClick={close}>Join as a provider</MenuItem>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="px-3 pb-2">
                                <p className="font-semibold">{profile?.name ?? 'Your account'}</p>
                                <p className="text-xs text-muted">
                                    {ROLE_LABEL[profile?.role] ?? ''}{profile?.city ? ` · ${profile.city}` : ''}
                                </p>
                            </div>
                            <div className="border-t border-slate-100 pt-2">
                                {links.map(({ to, label, icon }) => (
                                    <MenuItem key={to} to={to} icon={icon} onClick={close}>{label}</MenuItem>
                                ))}
                                <button
                                    onClick={() => { close(); onLogout() }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Log out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default function Navbar() {
    const { user, profile } = useAuth()
    const [open, setOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => { setOpen(false) }, [location.pathname])

    async function logout() {
        setOpen(false)
        await supabase.auth.signOut()
        navigate('/')
    }

    const links = [{ to: '/', label: 'Home', icon: Home }]
    if (profile?.role === 'customer') {
        links.push({ to: '/post', label: 'Post a requirement', icon: PlusCircle })
        links.push({ to: '/my-requests', label: 'My requests', icon: ClipboardList })
    }
    if (profile?.role === 'provider') {
        links.push({ to: '/leads', label: 'Leads', icon: Inbox })
        links.push({ to: '/my-quotes', label: 'My quotes', icon: ClipboardList })
    }
    if (profile?.role === 'admin') links.push({ to: '/admin', label: 'Admin panel', icon: ShieldCheck })

    const guestLinks = [
        { to: '/', label: 'Home', icon: Home },
        { to: '/post', label: 'Post a requirement', icon: PlusCircle },
        { to: '/signup', label: 'Join as a provider', icon: Store },
    ]
    const mobileLinks = user ? links : guestLinks

    const desktopActive = ({ isActive }) => (isActive ? 'text-amber-brand' : 'text-slate-300 hover:text-white')
    const mobileActive = ({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold ${isActive ? 'bg-slate-800 text-amber-brand' : 'text-slate-200'
        }`

    return (
        <header className="sticky top-0 z-20 bg-slate-brand text-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <Link to="/" className="text-xl font-bold">
                    <span className="text-amber-brand">NEEV</span>
                    <span className="ml-2 text-sm font-medium text-slate-300">नींव</span>
                </Link>

                {/* Desktop navigation */}
                <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
                    {user && links.map(({ to, label }) => (
                        <NavLink key={to} to={to} end className={desktopActive}>{label}</NavLink>
                    ))}
                </nav>

                <div className="hidden md:block">
                    <AccountMenu user={user} profile={profile} links={links} onLogout={logout} />
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden"
                    onClick={() => setOpen(!open)}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                >
                    {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                </button>
            </div>

            {/* Mobile menu panel */}
            {open && (
                <div className="border-t border-slate-700 md:hidden">
                    <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
                        {user && (
                            <div className="px-3 pb-2">
                                <p className="font-semibold">{profile?.name ?? 'Your account'}</p>
                                <p className="text-xs text-slate-400">
                                    {ROLE_LABEL[profile?.role] ?? ''}{profile?.city ? ` · ${profile.city}` : ''}
                                </p>
                            </div>
                        )}

                        {mobileLinks.map(({ to, label, icon: Icon }) => (
                            <NavLink key={to} to={to} end className={mobileActive}>
                                <Icon className="h-5 w-5" />
                                {label}
                            </NavLink>
                        ))}

                        <div className="border-t border-slate-700 pt-3">
                            {user ? (
                                <button
                                    onClick={logout}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-red-400"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Log out
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <Link to="/login" className="block rounded-xl bg-amber-brand py-3 text-center font-semibold text-white">
                                        Sign in
                                    </Link>
                                    <p className="text-center text-sm text-slate-400">
                                        New to NEEV?{' '}
                                        <Link to="/signup" className="font-semibold text-white underline">Join now</Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}