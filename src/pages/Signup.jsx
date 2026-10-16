import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['Fabrication', 'Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate']

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
            email: form.email,
            password: form.password,
        })
        if (authErr) { setError(authErr.message); setBusy(false); return }
        if (!data.session) {
            setError('Email confirmation abhi ON hai. Supabase mein Confirm email OFF kar.')
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

    const input = 'w-full rounded-xl border border-slate-300 px-4 py-3 text-base bg-white'

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                <h1 className="text-2xl font-bold text-slate-brand">Account banayein / Sign up</h1>

                <div className="grid grid-cols-2 gap-3">
                    {['customer', 'provider'].map((r) => (
                        <button
                            type="button" key={r}
                            onClick={() => setForm({ ...form, role: r })}
                            className={`rounded-xl border px-4 py-3 font-semibold ${form.role === r ? 'bg-amber-brand text-white border-amber-brand' : 'bg-white text-slate-brand border-slate-300'
                                }`}
                        >
                            {r === 'customer' ? 'Customer (Grahak)' : 'Provider (Dukaan/Karigar)'}
                        </button>
                    ))}
                </div>

                <input className={input} placeholder="Naam / Name" value={form.name} onChange={set('name')} required />
                <input className={input} placeholder="Phone number" value={form.phone} onChange={set('phone')} required />
                <input className={input} placeholder="Sheher / City (jaise Siwan)" value={form.city} onChange={set('city')} required />
                <input className={input} type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
                <input className={input} type="password" placeholder="Password (min 6 akshar)" value={form.password} onChange={set('password')} minLength={6} required />

                {form.role === 'provider' && (
                    <>
                        <input className={input} placeholder="Dukaan / Shop ka naam" value={form.shop_name} onChange={set('shop_name')} required />
                        <select className={input} value={form.category} onChange={set('category')}>
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <input className={input} placeholder="Pincode" value={form.pincode} onChange={set('pincode')} required />
                    </>
                )}

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button disabled={busy} className="w-full rounded-xl bg-amber-brand py-3 text-lg font-bold text-white disabled:opacity-60">
                    {busy ? 'Ruko...' : 'Sign up'}
                </button>
            </form>
        </div>
    )
}