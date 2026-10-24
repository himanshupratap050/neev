/**
 * Signup.jsx: REGISTRATION MODULE
 * ---------------------------------------------------------------
 * Purpose : Creates an account for a customer or a provider.
 * Route   : /signup (public)
 * Tables  : profiles (insert), providers (insert, providers only)
 * Auth    : supabase.auth.signUp (email + password)
 * Flow    : validate -> create auth user -> insert profile
 *           -> (provider) insert provider row -> reload profile -> Home
 *
 * DEBUG: "Email confirmation is still enabled" = turn off
 *        Authentication -> Sign In / Providers -> Email -> Confirm email.
 *        Half-created user (login works, no profile) = profile insert
 *        failed after signUp. Validation below prevents most causes;
 *        the profile trigger planned next removes the risk completely.
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Store } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { friendlyError, isValidPhone, isValidPincode } from '../lib/errors'
import { Page, Card, Input, Select, Button, Field } from '../components/ui'

const CATEGORIES = ['Fabrication', 'Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate']

export default function Signup() {
    const navigate = useNavigate()
    const { reloadProfile } = useAuth()

    // ---- Form state ----
    const [form, setForm] = useState({
        email: '', password: '', name: '', phone: '', city: '',
        role: 'customer', shop_name: '', category: CATEGORIES[0], pincode: '',
    })
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    // ---- Submit ----
    async function submit(e) {
        e.preventDefault()
        setError('')

        // Step 0: validate BEFORE creating the account, so a bad phone or
        // pincode can never leave a half-registered user behind.
        if (!isValidPhone(form.phone)) {
            setError('Please enter a valid phone number (10 to 15 digits).')
            return
        }
        if (form.role === 'provider' && !isValidPincode(form.pincode)) {
            setError('Please enter a valid 6-digit pincode.')
            return
        }

        setBusy(true)

        // Step 1: create the login account
        const { data, error: authErr } = await supabase.auth.signUp({
            email: form.email.trim(), password: form.password,
        })
        if (authErr) { setError(friendlyError(authErr)); setBusy(false); return }
        if (!data.session) {
            setError('Email confirmation is still enabled in Supabase. Turn off "Confirm email" for testing.')
            setBusy(false); return
        }

        // Step 2: save the profile (name, phone, city, role)
        const uid = data.user.id
        const { error: pErr } = await supabase.from('profiles').insert({
            id: uid, name: form.name.trim(), phone: form.phone.trim(),
            city: form.city.trim(), role: form.role,
        })
        if (pErr) { setError(friendlyError(pErr)); setBusy(false); return }

        // Step 3 (providers only): save the business details
        if (form.role === 'provider') {
            const { error: prErr } = await supabase.from('providers').insert({
                id: uid, shop_name: form.shop_name.trim(), category: form.category,
                city: form.city.trim(), pincode: form.pincode.trim(),
            })
            if (prErr) { setError(friendlyError(prErr)); setBusy(false); return }
        }

        await reloadProfile()
        setBusy(false)
        navigate('/')
    }

    // ---- Role cards ----
    const roles = [
        { value: 'customer', label: 'Customer', hint: 'I need materials or fabrication work', icon: User },
        { value: 'provider', label: 'Provider', hint: 'I run a store or workshop', icon: Store },
    ]

    // ---- UI ----
    return (
        <Page title="Create your account" subtitle="Join NEEV in a minute">
            <form onSubmit={submit} className="space-y-4">

                {/* Role chooser */}
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

                {/* Personal details */}
                <Card className="space-y-4">
                    <Field label="Full name">
                        <Input value={form.name} onChange={set('name')} required />
                    </Field>
                    <Field label="Phone number">
                        <Input type="tel" inputMode="numeric" maxLength={15} placeholder="10-digit mobile number"
                            value={form.phone} onChange={set('phone')} required />
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

                {/* Business details (providers only) */}
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
                        <Field label="Pincode (6 digits)">
                            <Input inputMode="numeric" maxLength={6} placeholder="e.g. 841226"
                                value={form.pincode} onChange={set('pincode')} required />
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