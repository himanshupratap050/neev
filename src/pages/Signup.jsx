import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Store } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Page, Card, Input, Select, Button } from '../components/ui'

const CATEGORIES = ['Fabrication', 'Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate']

function Field({ label, children }) {
    return (
        <label className="block text-sm font-semibold">
            {label}
            <div className="mt-1">{children}</div>
        </label>
    )
}

export default function Signup() {
    const navigate = useNavigate()
    const { reloadProfile } = useAuth()
    const [form, setForm] = useState({
        email: '', password: '', name: '', phone: '', city: '',
        role: 'customer', shop_name: '', category: CATEGORIES[0], pincode: '',
    })
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    async function submit(e) {
        e.preventDefault()
        setError('')
        setBusy(true)

        const { data, error: authErr } = await supabase.auth.signUp({
            email: form.email, password: form.password,
        })
        if (authErr) { setError(authErr.message); setBusy(false); return }
        if (!data.session) {
            setError('Email confirmation is still enabled in Supabase. Turn off "Confirm email" for testing.')
            setBusy(false); return
        }

        const uid = data.user.id
        const { error: pErr } = await supabase.from('profiles').insert({
            id: uid, name: form.name, phone: form.phone, city: form.city, role: form.role,
        })
        if (pErr) { setError(pErr.message); setBusy(false); return }

        if (form.role === 'provider') {
            const { error: prErr } = await supabase.from('providers').insert({
                id: uid, shop_name: form.shop_name, category: form.category,
                city: form.city, pincode: form.pincode,
            })
            if (prErr) { setError(prErr.message); setBusy(false); return }
        }

        await reloadProfile()
        setBusy(false)
        navigate('/')
    }

    const roles = [
        { value: 'customer', label: 'Customer', hint: 'I need materials or fabrication work', icon: User },
        { value: 'provider', label: 'Provider', hint: 'I run a store or workshop', icon: Store },
    ]

    return (
        <Page title="Create your account" subtitle="Join NEEV in a minute">
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    {roles.map(({ value, label, hint, icon: Icon }) => {
                        const on = form.role === value
                        return (
                            <button
                                type="button" key={value}
                                onClick={() => setForm({ ...form, role: value })}
                                className={`rounded-2xl border-2 p-4 text-left transition ${on ? 'border-amber-brand bg-amber-50' : 'border-slate-200 bg-white'
                                    }`}
                            >
                                <Icon className={`mb-2 h-6 w-6 ${on ? 'text-amber-brand' : 'text-muted'}`} />
                                <p className="font-semibold">{label}</p>
                                <p className="text-xs text-muted">{hint}</p>
                            </button>
                        )
                    })}
                </div>

                <Card className="space-y-4">
                    <Field label="Full name">
                        <Input value={form.name} onChange={set('name')} required />
                    </Field>
                    <Field label="Phone number">
                        <Input type="tel" inputMode="numeric" value={form.phone} onChange={set('phone')} required />
                    </Field>
                    <Field label="City">
                        <Input placeholder="e.g. Siwan" value={form.city} onChange={set('city')} required />
                    </Field>
                    <Field label="Email">
                        <Input type="email" value={form.email} onChange={set('email')} required />
                    </Field>
                    <Field label="Password (minimum 6 characters)">
                        <Input type="password" minLength={6} value={form.password} onChange={set('password')} required />
                    </Field>
                </Card>

                {form.role === 'provider' && (
                    <Card className="space-y-4">
                        <p className="font-semibold">Business details</p>
                        <Field label="Shop or workshop name">
                            <Input value={form.shop_name} onChange={set('shop_name')} required />
                        </Field>
                        <Field label="Primary category">
                            <Select value={form.category} onChange={set('category')}>
                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </Select>
                        </Field>
                        <Field label="Pincode">
                            <Input inputMode="numeric" value={form.pincode} onChange={set('pincode')} required />
                        </Field>
                        <p className="text-xs text-muted">
                            Our team will verify your details. Once approved, you will receive a "Verified" badge.
                        </p>
                    </Card>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button disabled={busy}>{busy ? 'Creating account...' : 'Sign up'}</Button>
            </form>

            <p className="text-center text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-brand">Log in</Link>
            </p>
        </Page>
    )
}