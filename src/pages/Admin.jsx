import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    async function load() {
        const { data: provs, error } = await supabase
            .from('providers').select('*').order('verified', { ascending: true })
        if (error) { setError(error.message); setLoading(false); return }

        const ids = (provs ?? []).map((p) => p.id)
        const { data: profs } = ids.length
            ? await supabase.from('profiles').select('id, name, phone').in('id', ids)
            : { data: [] }
        const byId = Object.fromEntries((profs ?? []).map((p) => [p.id, p]))
        setRows((provs ?? []).map((p) => ({ ...p, profile: byId[p.id] })))
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function toggle(p) {
        setError('')
        const { error } = await supabase
            .from('providers').update({ verified: !p.verified }).eq('id', p.id)
        if (error) { setError(error.message); return }
        load()
    }

    if (loading) return <p className="p-6">Loading...</p>

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto max-w-md space-y-4">
                <h1 className="text-2xl font-bold text-slate-brand">Admin: Providers</h1>
                <p className="text-sm text-slate-500">
                    Verify karne se pehle phone karke dukaan/kaam confirm kar lein.
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}

                {rows.length === 0 && (
                    <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
                        Abhi koi provider nahi hai.
                    </p>
                )}

                {rows.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-semibold text-slate-brand">{p.shop_name}</p>
                                <p className="text-sm text-slate-500">{p.category} · {p.city} · {p.pincode}</p>
                                <p className="text-sm">{p.profile?.name} · {p.profile?.phone}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${p.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {p.verified ? 'Verified' : 'Pending'}
                            </span>
                        </div>
                        <button
                            onClick={() => toggle(p)}
                            className={`mt-3 w-full rounded-xl py-3 font-bold ${p.verified ? 'border border-slate-300 bg-white text-slate-brand' : 'bg-amber-brand text-white'
                                }`}
                        >
                            {p.verified ? 'Verify hatayein' : 'Verify karein'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}