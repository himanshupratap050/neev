import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Page, Card, Input, Button } from '../components/ui'

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
        if (error) { setError('Incorrect email or password.'); return }
        navigate('/')
    }

    return (
        <Page title="Log in" subtitle="Welcome back to NEEV">
            <Card>
                <form onSubmit={submit} className="space-y-4">
                    <label className="block text-sm font-semibold">
                        Email
                        <div className="mt-1">
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    </label>
                    <label className="block text-sm font-semibold">
                        Password
                        <div className="mt-1">
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                    </label>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</Button>
                </form>
            </Card>
            <p className="text-center text-sm text-muted">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-blue-brand">Sign up</Link>
            </p>
        </Page>
    )
}