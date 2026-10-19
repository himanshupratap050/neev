import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Page, Card, Button, Badge, Facts, Empty, Spinner } from '../components/ui'

export default function Admin() {
    const [rows, setRows] = useState([])
    const [filter, setFilter] = useState('pending')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    async function load() {
        const { data: provs, error } = await supabase.from('providers').select('*')
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
        const { error } = await supabase.from('providers').update({ verified: !p.verified }).eq('id', p.id)
        if (error) { setError(error.message); return }
        load()
    }

    if (loading) return <Spinner />

    const pending = rows.filter((r) => !r.verified).length
    const shown = rows.filter((r) =>
        filter === 'all' ? true : filter === 'pending' ? !r.verified : r.verified)

    const tabs = [
        { key: 'pending', label: `Pending (${pending})` },
        { key: 'verified', label: `Verified (${rows.length - pending})` },
        { key: 'all', label: 'All' },
    ]

    return (
        <Page title="Provider verification" subtitle="Call the provider and confirm the shop or workshop before verifying.">
            <div className="flex gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setFilter(t.key)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === t.key ? 'bg-slate-brand text-white' : 'border border-slate-300 bg-white'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {shown.length === 0 && <Empty icon={ShieldCheck} text="No providers in this list." />}

            {shown.map((p) => (
                <Card key={p.id}>
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold">{p.shop_name}</h3>
                        <Badge tone={p.verified ? 'green' : 'amber'}>{p.verified ? 'Verified' : 'Pending'}</Badge>
                    </div>
                    <Facts items={[
                        { label: 'Category', value: p.category },
                        { label: 'Location', value: `${p.city} ${p.pincode ?? ''}` },
                        { label: 'Owner', value: p.profile?.name },
                        { label: 'Phone', value: p.profile?.phone },
                    ]} />
                    <Button variant={p.verified ? 'outline' : 'primary'} className="mt-3" onClick={() => toggle(p)}>
                        {p.verified ? 'Remove verification' : 'Verify provider'}
                    </Button>
                </Card>
            ))}
        </Page>
    )
}