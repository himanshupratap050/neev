import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function QuoteForm({ requestId, providerId, onSent }) {
    const [price, setPrice] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    async function submit(e) {
        e.preventDefault()
        setError(''); setBusy(true)
        const { error } = await supabase.from('quotes').insert({
            request_id: requestId, provider_id: providerId, price: Number(price), message,
        })
        setBusy(false)
        if (error) { setError(error.message); return }
        onSent()
    }

    const input = 'w-full rounded-xl border border-slate-300 px-4 py-3 text-base bg-white'

    return (
        <form onSubmit={submit} className="mt-3 space-y-2">
            <input className={input} type="number" min="1" placeholder="Aapka rate (₹)" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <input className={input} placeholder="Message (kab tak, kya shamil hai)" value={message} onChange={(e) => setMessage(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-amber-brand py-3 font-bold text-white disabled:opacity-60">
                {busy ? 'Ruko...' : 'Quote bhejein'}
            </button>
        </form>
    )
}

export default function ProviderLeads() {
    const { user } = useAuth()
    const [provider, setProvider] = useState(null)
    const [leads, setLeads] = useState([])
    const [sent, setSent] = useState({})
    const [loading, setLoading] = useState(true)

    async function load() {
        const { data: p } = await supabase.from('providers').select('*').eq('id', user.id).maybeSingle()
        setProvider(p)
        if (!p) { setLoading(false); return }

        const { data: reqs } = await supabase.from('requests').select('*')
            .eq('status', 'open').eq('category', p.category).ilike('city', p.city)
            .order('created_at', { ascending: false })
        setLeads(reqs ?? [])

        const { data: qs } = await supabase.from('quotes').select('*').eq('provider_id', user.id)
        setSent(Object.fromEntries((qs ?? []).map((q) => [q.request_id, q])))
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    if (loading) return <p className="p-6">Loading...</p>
    if (!provider) return <p className="p-6">Provider profile nahi mili.</p>

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto max-w-md space-y-4">
                <h1 className="text-2xl font-bold text-slate-brand">Naye Leads</h1>
                <p className="text-sm text-slate-500">{provider.category} · {provider.city}</p>

                {leads.length === 0 && (
                    <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
                        Abhi aapki category aur sheher mein koi open requirement nahi hai.
                    </p>
                )}

                {leads.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        {r.photo_url && <img src={r.photo_url} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />}
                        <h3 className="font-semibold text-slate-brand">{r.title}</h3>
                        {r.quantity && <p className="text-sm text-slate-500">Matra: {r.quantity}</p>}
                        {r.details && <p className="mt-1 text-sm">{r.details}</p>}
                        <p className="mt-1 text-xs text-slate-500">{r.city} · {r.pincode}</p>

                        {sent[r.id] ? (
                            <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                                Quote bhej diya: ₹{sent[r.id].price}
                            </p>
                        ) : (
                            <QuoteForm requestId={r.id} providerId={user.id} onSent={load} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}