import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, BadgeCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Page, Grid, Card, Button, Badge, StatusBadge, Facts, Empty, Spinner, timeAgo } from '../components/ui'

export default function MyRequests() {
    const { user } = useAuth()
    const [requests, setRequests] = useState([])
    const [contacts, setContacts] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    async function load() {
        const { data, error } = await supabase
            .from('requests')
            .select('*, quotes(*, providers(shop_name, verified))')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false })
        if (error) { setError(error.message); setLoading(false); return }
        setRequests(data ?? [])

        const ids = (data ?? [])
            .flatMap((r) => r.quotes.filter((q) => q.status === 'accepted'))
            .map((q) => q.provider_id)
        if (ids.length) {
            const { data: profs } = await supabase.from('profiles').select('id, name, phone').in('id', ids)
            setContacts(Object.fromEntries((profs ?? []).map((p) => [p.id, p])))
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function accept(quote) {
        if (!window.confirm(`Accept the quote of ₹${quote.price} from ${quote.providers?.shop_name}?`)) return
        setError('')
        const { error } = await supabase.rpc('accept_quote', { p_quote_id: quote.id })
        if (error) { setError(error.message); return }
        load()
    }

    async function complete(req) {
        const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', req.id)
        if (error) { setError(error.message); return }
        load()
    }

    function waLink(phone, title) {
        const digits = (phone ?? '').replace(/\D/g, '').slice(-10)
        const text = encodeURIComponent(`Hello, I accepted your quote on NEEV for: ${title}`)
        return `https://wa.me/91${digits}?text=${text}`
    }

    if (loading) return <Spinner />

    return (
        <Page size="wide" title="My requests" subtitle="Track your requirements and compare quotes.">
            {error && <p className="text-sm text-red-600">{error}</p>}

            {requests.length === 0 && (
                <>
                    <Empty icon={ClipboardList} text="You haven't posted any requirements yet." />
                    <Link to="/post" className="block max-w-xs"><Button>Post a requirement</Button></Link>
                </>
            )}

            <Grid>
                {requests.map((r) => {
                    const quotes = [...r.quotes].sort((a, b) => a.price - b.price)
                    const lowest = quotes[0]?.id
                    const chosen = quotes.find((q) => q.status === 'accepted')
                    const contact = chosen && contacts[chosen.provider_id]

                    return (
                        <Card key={r.id}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
                                <StatusBadge status={r.status} />
                            </div>
                            <Facts items={[
                                { label: 'Category', value: r.category },
                                { label: 'Quantity', value: r.quantity },
                                { label: 'Location', value: `${r.city} ${r.pincode ?? ''}` },
                                { label: 'Posted', value: timeAgo(r.created_at) },
                            ]} />
                            {r.photo_url && (
                                <img
                                    src={r.photo_url} alt=""
                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                    className="mt-3 h-32 w-full rounded-xl object-cover"
                                />
                            )}

                            {r.status === 'open' && (
                                <div className="mt-4 border-t border-slate-100 pt-3">
                                    <p className="text-sm font-semibold">
                                        {quotes.length === 0 ? 'Waiting for quotes' : `${quotes.length} quote${quotes.length > 1 ? 's' : ''} received`}
                                    </p>
                                    <div className="mt-2 space-y-2">
                                        {quotes.map((q) => (
                                            <div key={q.id} className="rounded-xl border border-slate-200 p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold">{q.providers?.shop_name}</p>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {q.providers?.verified
                                                                ? <Badge tone="green">Verified</Badge>
                                                                : <Badge tone="gray">Not verified</Badge>}
                                                            {q.id === lowest && quotes.length > 1 && <Badge tone="blue">Lowest price</Badge>}
                                                        </div>
                                                    </div>
                                                    <p className="text-xl font-bold">₹{q.price}</p>
                                                </div>
                                                {q.message && <p className="mt-2 text-sm text-muted">{q.message}</p>}
                                                <Button className="mt-3" onClick={() => accept(q)}>Accept quote</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {chosen && (
                                <div className="mt-4 rounded-xl bg-green-50 p-3">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <BadgeCheck className="h-5 w-5" />
                                        <p className="font-semibold">{chosen.providers?.shop_name} · ₹{chosen.price}</p>
                                    </div>
                                    {contact?.phone && (
                                        <>
                                            <p className="mt-1 text-sm text-green-800">{contact.name} · {contact.phone}</p>
                                            <a href={waLink(contact.phone, r.title)} target="_blank" rel="noreferrer">
                                                <Button variant="success" className="mt-3">Chat on WhatsApp</Button>
                                            </a>
                                        </>
                                    )}
                                    {r.status === 'accepted' && (
                                        <Button variant="outline" className="mt-2" onClick={() => complete(r)}>Mark as completed</Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    )
                })}
            </Grid>
        </Page>
    )
}