import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['Fabrication', 'Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate']

export default function PostRequirement() {
    const { user, profile } = useAuth()
    const [form, setForm] = useState({
        category: CATEGORIES[0], title: '', details: '', quantity: '',
        city: profile?.city ?? '', pincode: '',
    })
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)
    const [busy, setBusy] = useState(false)

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    function pickFile(e) {
        const f = e.target.files[0]
        if (f && f.size > 3 * 1024 * 1024) {
            setError('Photo 3 MB se chhoti honi chahiye')
            e.target.value = ''
            return
        }
        setError('')
        setFile(f ?? null)
    }

    async function submit(e) {
        e.preventDefault()
        setError(''); setDone(false); setBusy(true)

        let photo_url = null
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase()
            const path = `${user.id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('request-photos').upload(path, file)
            if (upErr) { setError(upErr.message); setBusy(false); return }
            photo_url = supabase.storage.from('request-photos').getPublicUrl(path).data.publicUrl
        }

        const { error: insErr } = await supabase.from('requests').insert({
            customer_id: user.id, ...form, photo_url,
        })
        setBusy(false)
        if (insErr) { setError(insErr.message); return }

        setDone(true)
        setForm({ ...form, title: '', details: '', quantity: '' })
        setFile(null)
        e.target.reset()
    }

    const input = 'w-full rounded-xl border border-slate-300 px-4 py-3 text-base bg-white'

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                <h1 className="text-2xl font-bold text-slate-brand">Requirement daalein / Post Requirement</h1>

                <select className={input} value={form.category} onChange={set('category')}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input className={input} placeholder="Kya chahiye? (jaise Main gate, 50 bori cement)" value={form.title} onChange={set('title')} required />
                <textarea className={input} rows={3} placeholder="Detail: size, design, kab tak chahiye" value={form.details} onChange={set('details')} />
                <input className={input} placeholder="Matra / Quantity (jaise 10x6 feet, 50 bags)" value={form.quantity} onChange={set('quantity')} />
                <input className={input} placeholder="Sheher / City" value={form.city} onChange={set('city')} required />
                <input className={input} placeholder="Pincode" value={form.pincode} onChange={set('pincode')} required />

                <label className="block text-sm font-semibold text-slate-500">
                    Photo (optional)
                    <input type="file" accept="image/*" onChange={pickFile} className="mt-1 block w-full text-sm" />
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {done && <p className="text-sm font-semibold text-green-600">Requirement post ho gayi. Providers ab quote bhejenge.</p>}

                <button disabled={busy} className="w-full rounded-xl bg-amber-brand py-3 text-lg font-bold text-white disabled:opacity-60">
                    {busy ? 'Ruko...' : 'Post karein'}
                </button>
            </form>
        </div>
    )
}