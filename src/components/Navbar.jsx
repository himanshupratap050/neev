import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Navbar() {
    const { user, profile } = useAuth()
    return (
        <nav className="flex items-center justify-between bg-slate-brand px-4 py-3 text-white">
            <Link to="/" className="text-xl font-bold text-amber-brand">NEEV</Link>
            <div className="flex items-center gap-4 text-sm font-semibold">
                {profile?.role === 'customer' && <Link to="/post">Requirement daalein</Link>}
                {user ? (
                    <button onClick={() => supabase.auth.signOut()}>Logout</button>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </div>
        </nav>
    )
}