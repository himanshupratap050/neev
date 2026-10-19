import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
    Home, PlusCircle, ClipboardList, Inbox, ShieldCheck,
    LogOut, UserCircle, ChevronDown, Store,
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

function AccountMenu({ user, profile, links }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        function onDown(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [])

    async function logout() {
        setOpen(false)
        await supabase.auth.signOut()
        navigate('/')
    }

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
                                <p className="text-xs text-muted">{ROLE_LABEL[profile?.role] ?? ''}{profile?.city ? ` · ${profile.city}` : ''}</p>
                            </div>
                            <div className="border-t border-slate-100 pt-2">
                                {links.map(({ to, label, icon }) => (
                                    <MenuItem key={to} to={to} icon={icon} onClick={close}>{label}</MenuItem>
                                ))}
                                <button
                                    onClick={logout}
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

    const links = [{ to: '/', label: 'Home', icon: Home }]
    if (profile?.role === 'customer') {
        links.push({ to: '/post', label: 'Post a requirement', icon: PlusCircle })
        links.push({ to: '/my-requests', label: 'My requests', icon: ClipboardList })
    }
    if (profile?.role === 'provider') links.push({ to: '/leads', label: 'Leads', icon: Inbox })
    if (profile?.role === 'admin') links.push({ to: '/admin', label: 'Admin panel', icon: ShieldCheck })

    const active = ({ isActive }) => (isActive ? 'text-amber-brand' : 'text-slate-300')

    return (
        <>
            <header className="sticky top-0 z-20 bg-slate-brand text-white">
                <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
                    <Link to="/" className="text-xl font-bold">
                        <span className="text-amber-brand">NEEV</span>
                        <span className="ml-2 text-sm font-medium text-slate-300">नींव</span>
                    </Link>

                    <nav className="hidden items-center gap-5 text-sm font-semibold md:flex">
                        {user && links.map(({ to, label }) => (
                            <NavLink key={to} to={to} end className={active}>{label}</NavLink>
                        ))}
                    </nav>

                    <AccountMenu user={user} profile={profile} links={links} />
                </div>
            </header>

            {user && (
                <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-slate-700 bg-slate-brand py-2 md:hidden">
                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to} to={to} end
                            className={(s) => `flex flex-col items-center gap-0.5 px-3 text-xs font-semibold ${active(s)}`}
                        >
                            <Icon className="h-6 w-6" />
                            {label.replace('Post a requirement', 'Post').replace('My requests', 'Requests')}
                        </NavLink>
                    ))}
                </nav>
            )}
        </>
    )
}