import { Link, NavLink } from 'react-router-dom'
import { Home, PlusCircle, ClipboardList, Inbox, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Navbar() {
    const { user, profile } = useAuth()

    const links = [{ to: '/', label: 'Home', icon: Home }]
    if (profile?.role === 'customer') {
        links.push({ to: '/post', label: 'Post Request', icon: PlusCircle })
        links.push({ to: '/my-requests', label: 'My Requests', icon: ClipboardList })
    }
    if (profile?.role === 'provider') links.push({ to: '/leads', label: 'Leads', icon: Inbox })
    if (profile?.role === 'admin') links.push({ to: '/admin', label: 'Admin', icon: ShieldCheck })

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
                        {links.map(({ to, label }) => (
                            <NavLink key={to} to={to} end className={active}>{label}</NavLink>
                        ))}
                    </nav>

                    {user ? (
                        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-sm font-semibold text-slate-300">
                            <LogOut className="h-4 w-4" /> Log out
                        </button>
                    ) : (
                        <Link to="/login" className="rounded-lg bg-amber-brand px-4 py-2 text-sm font-semibold">Log in</Link>
                    )}
                </div>
            </header>

            {user && (
                <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-slate-700 bg-slate-brand py-2 md:hidden">
                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} end className={(s) => `flex flex-col items-center gap-0.5 px-3 text-xs font-semibold ${active(s)}`}>
                            <Icon className="h-6 w-6" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            )}
        </>
    )
}