import { useEffect, useState } from 'react'
import { Inbox } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Page, Card, Input, Button, Badge, Facts, Empty, Spinner, timeAgo } from '../components/ui'

function QuoteForm({ requestId, providerId, onSent }) {
    const [price, setPrice] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    async function submit(e) {
        e.preventDefault()
        setError('')
        setBusy(true)
        const { error } = await supabase.from('quotes').insert({
            request_id: requestId, provider_id: providerId, price: Number(price), message,
        })
        setBusy(false)
        if (error) { setError(error.message); return }
        onSent()
    }

    return (
        <form onSubmit={submit} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <Input type="number" min="1" placeholder="Your price (₹)" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input placeholder="Note: delivery time, what is included" value={message} onChange={(e) => setMessage(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button disabled={busy}>{busy ? 'Sending...' : 'Send quote'}</Button>
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

    if (loading) return <Spinner />
    if (!provider) return <Page title="Leads"><Empty text="Provider profile not found." /></Page>

    return (
        <Page title="New leads" subtitle={`${provider.shop_name} · ${provider.category} · ${provider.city}`}>
            {!provider.verified && (
                <Card className="border-amber-200 bg-amber-50">
                    <p className="text-sm font-semibold text-amber-800">Verification pending</p>
                    <p className="text-sm text-amber-800">You can send quotes now. Customers will see a "Verified" badge once our team approves your profile.</p>
                </Card>
            )}

            {leads.length === 0 && (
                <Empty icon={Inbox} text="No open requirements in your category and city right now." />
            )}

            {leads.map((r) => (
                <Card key={r.id}>
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
                        <Badge tone="blue">New</Badge>
                    </div>
                    <Facts items={[
                        { label: 'Quantity', value: r.quantity },
                        { label: 'Location', value: `${r.city} ${r.pincode ?? ''}` },
                        { label: 'Posted', value: timeAgo(r.created_at) },
                    ]} />
                    {r.details && <p className="mt-3 text-sm text-muted">{r.details}</p>}
                    {r.photo_url && <img src={r.photo_url} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />}

                    {sent[r.id] ? (
                        <div className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                            Quote sent: ₹{sent[r.id].price}
                        </div>
                    ) : (
                        <QuoteForm requestId={r.id} providerId={user.id} onSent={load} />
                    )}
                </Card>
            ))}
        </Page>
    )
}