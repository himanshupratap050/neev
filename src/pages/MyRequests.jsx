import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function MyRequests() {
    const { user } = useAuth()
    const [requests, setRequests] = useState([])
    const [phones, setPhones] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    async function load() {
        const { data, error } = await supabase
            .from('requests')
            .select('*, quotes(*, providers(shop_name, category, city, verified))')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false })
        if (error) { setError(error.message); setLoading(false); return }
        setRequests(data ?? [])

        const acceptedIds = (data ?? [])
            .flatMap((r) => r.quotes.filter((q) => q.status === 'accepted'))
            .map((q) => q.provider_id)
        if (acceptedIds.length) {
            const { data: profs } = await supabase.from('profiles').select('id, name, phone').in('id', acceptedIds)
            setPhones(Object.fromEntries((profs ?? []).map((p) => [p.id, p])))
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function accept(req, quote) {
        setError('')
        const a = await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quote.id)
        if (a.error) { setError(a.error.message); return }
        await supabase.from('quotes').update({ status: 'rejected' }).eq('request_id', req.id).neq('id', quote.id)
        const r = await supabase.from('requests').update({ status: 'accepted' }).eq('id', req.id)
        if (r.error) { setError(r.error.message); return }
        load()
    }

    async function complete(req) {
        const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', req.id)
        if (error) { setError(error.message); return }
        load()
    }

    function waLink(phone, title) {
        const digits = (phone ?? '').replace(/\D/g, '').slice(-10)
        const text = encodeURIComponent(`Namaste, NEEV pe aapka quote accept kiya hai: ${title}`)
        return `https://wa.me/91${digits}?text=${text}`
    }

    if (loading) return <p className="p-6">Loading...</p>

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto max-w-md space-y-4">
                <h1 className="text-2xl font-bold text-slate-brand">Meri Requests</h1>
                {error && <p className="text-sm text-red-600">{error}</p>}

                {requests.length === 0 && (
                    <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
                        Abhi koi requirement nahi daali.
                    </p>
                )}

                {requests.map((r) => {
                    const quotes = [...r.quotes].sort((a, b) => a.price - b.price)
                    const lowest = quotes[0]?.id
                    const chosen = quotes.find((q) => q.status === 'accepted')
                    return (
                        <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            {r.photo_url && <img src={r.photo_url} alt="" className="mb-3 h-32 w-full rounded-xl object-cover" />}
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-slate-brand">{r.title}</h3>
                                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {r.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">{r.category} · {r.city}</p>

                            {r.status === 'open' && quotes.length === 0 && (
                                <p className="mt-3 text-sm text-slate-500">Quotes ka intezaar hai...</p>
                            )}

                            {r.status === 'open' && quotes.map((q) => (
                                <div key={q.id} className="mt-3 rounded-xl border border-slate-200 p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{q.providers?.shop_name}</p>
                                        <p className="text-lg font-bold text-slate-brand">₹{q.price}</p>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {q.providers?.verified ? 'Verified' : 'Verify nahi hua'}
                                        {q.id === lowest && quotes.length > 1 ? ' · Sabse kam rate' : ''}
                                    </p>
                                    {q.message && <p className="mt-1 text-sm">{q.message}</p>}
                                    <button
                                        onClick={() => accept(r, q)}
                                        className="mt-2 w-full rounded-xl bg-amber-brand py-3 font-bold text-white"
                                    >
                                        Accept karein
                                    </button>
                                </div>
                            ))}

                            {chosen && (
                                <div className="mt-3 rounded-xl bg-green-50 p-3">
                                    <p className="text-sm font-semibold text-green-700">
                                        Accepted: {chosen.providers?.shop_name} · ₹{chosen.price}
                                    </p>
                                    {phones[chosen.provider_id]?.phone && (
                                        <a
                                            href={waLink(phones[chosen.provider_id].phone, r.title)}
                                            target="_blank" rel="noreferrer"
                                            className="mt-2 block rounded-xl bg-green-600 py-3 text-center font-bold text-white"
                                        >
                                            WhatsApp pe baat karein
                                        </a>
                                    )}
                                    {r.status === 'accepted' && (
                                        <button
                                            onClick={() => complete(r)}
                                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-brand"
                                        >
                                            Kaam ho gaya (Complete)
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}