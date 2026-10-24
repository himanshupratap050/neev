import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Page, Grid, Card, Button, StatusBadge, Facts, Empty, Spinner, timeAgo } from '../components/ui'

function waLink(phone, title) {
    const digits = (phone ?? '').replace(/\D/g, '').slice(-10)
    const text = encodeURIComponent(`Hello, my quote on NEEV was accepted for: ${title}`)
    return `https://wa.me/91${digits}?text=${text}`
}

export default function ProviderQuotes() {
    const { user } = useAuth()
    const [quotes, setQuotes] = useState([])
    const [contacts, setContacts] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function load() {
            const { data, error } = await supabase
                .from('quotes')
                .select('*, requests(*)')
                .eq('provider_id', user.id)
                .order('created_at', { ascending: false })
            if (error) { setError(error.message); setLoading(false); return }
            setQuotes(data ?? [])

            const ids = [...new Set(
                (data ?? [])
                    .filter((q) => q.status === 'accepted' && q.requests)
                    .map((q) => q.requests.customer_id)
            )]
            if (ids.length) {
                const { data: profs } = await supabase.from('profiles').select('id, name, phone').in('id', ids)
                setContacts(Object.fromEntries((profs ?? []).map((p) => [p.id, p])))
            }
            setLoading(false)
        }
        load()
    }, [user.id])

    if (loading) return <Spinner />

    return (
        <Page size="wide" title="My quotes" subtitle="Track the quotes you have sent and the jobs you have won.">
            {error && <p className="text-sm text-red-600">{error}</p>}

            {quotes.length === 0 && (
                <>
                    <Empty icon={ClipboardList} text="You haven't sent any quotes yet." />
                    <Link to="/leads" className="block max-w-xs"><Button>Browse new leads</Button></Link>
                </>
            )}

            <Grid>
                {quotes.map((q) => {
                    const r = q.requests
                    const contact = q.status === 'accepted' && r ? contacts[r.customer_id] : null
                    return (
                        <Card key={q.id}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-semibold leading-snug">{r?.title ?? 'Requirement'}</h3>
                                <StatusBadge status={q.status === 'accepted' ? r?.status : q.status} />
                            </div>
                            <Facts items={[
                                { label: 'Your quote', value: `₹${q.price}` },
                                { label: 'Category', value: r?.category },
                                { label: 'Quantity', value: r?.quantity },
                                { label: 'Location', value: r ? `${r.city} ${r.pincode ?? ''}` : '' },
                                { label: 'Quoted', value: timeAgo(q.created_at) },
                            ]} />
                            {q.message && <p className="mt-3 text-sm text-muted">{q.message}</p>}

                            {contact?.phone && (
                                <div className="mt-4 rounded-xl bg-green-50 p-3">
                                    <p className="text-sm font-semibold text-green-700">You won this job</p>
                                    <p className="mt-1 text-sm text-green-800">{contact.name} · {contact.phone}</p>
                                    <a href={waLink(contact.phone, r.title)} target="_blank" rel="noreferrer">
                                        <Button variant="success" className="mt-3">Chat on WhatsApp</Button>
                                    </a>
                                </div>
                            )}
                        </Card>
                    )
                })}
            </Grid>
        </Page>
    )
}