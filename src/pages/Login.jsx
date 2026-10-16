import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    async function submit(e) {
        e.preventDefault()
        setError('')
        setBusy(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        setBusy(false)
        if (error) { setError(error.message); return }
        navigate('/')
    }

    const input = 'w-full rounded-xl border border-slate-300 px-4 py-3 text-base bg-white'

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                <h1 className="text-2xl font-bold text-slate-brand">Login</h1>
                <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button disabled={busy} className="w-full rounded-xl bg-amber-brand py-3 text-lg font-bold text-white disabled:opacity-60">
                    {busy ? 'Ruko...' : 'Login'}
                </button>
                <p className="text-center text-sm text-slate-500">
                    Account nahi hai? <Link to="/signup" className="font-semibold text-blue-brand">Sign up</Link>
                </p>
            </form>
        </div>
    )
}