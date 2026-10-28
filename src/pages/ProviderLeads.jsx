/**
 * ProviderLeads.jsx: PROVIDER LEADS MODULE
 * ---------------------------------------------------------------
 * Purpose : Shows a provider the open requirements that match their
 *           category and area, and lets them send ONE quote per request.
 * Route   : /leads (provider role only, see App.jsx)
 * Tables  : providers (read own profile), requests (read open leads),
 *           quotes (read own quotes, insert new quote)
 * Parts   : 1) QuoteForm  = small form inside each lead card
 *           2) ProviderLeads = the page (loads data, renders cards)
 *
 * DEBUG: Empty list although a request exists? Check in order:
 *   1. request status is 'open'
 *   2. request category equals provider category (exact text)
 *   3. first 3 digits of both pincodes are the same (see load())
 *   4. RLS policy "requests providers read open" exists in Supabase
 */
import { useEffect, useState } from 'react'
import { Inbox } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../lib/errors'
import { Page, Grid, Card, Input, Button, Badge, Facts, Empty, Spinner, timeAgo } from '../components/ui'

/* ===============================================================
 * PART 1: QuoteForm
 * Inserts a row into `quotes` for one request.
 * DEBUG: "duplicate key" error = this provider already quoted on
 *        this request (the DB allows only one quote per provider).
 *        "row-level security" error = the request is no longer open.
 * =============================================================== */
function QuoteForm({ requestId, providerId, onSent }) {
    // ---- Local form state ----
    const [price, setPrice] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    // ---- Action: save the quote ----
    async function submit(e) {
        e.preventDefault()
        setError('')
        setBusy(true)
        const { error } = await supabase.from('quotes').insert({
            request_id: requestId,
            provider_id: providerId,
            price: Number(price),
            message,
        })
        setBusy(false)
        if (error) { setError(friendlyError(error)); return }
        onSent() // tell the parent page to reload the list
    }

    // ---- UI ----
    return (
        <form onSubmit={submit} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <Input type="number" min="1" placeholder="Your price (₹)" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input maxLength={500} placeholder="Note: delivery time, what is included" value={message} onChange={(e) => setMessage(e.target.value)} />            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button disabled={busy}>{busy ? 'Sending...' : 'Send quote'}</Button>
        </form>
    )
}

/* ===============================================================
 * PART 2: ProviderLeads (the page)
 * =============================================================== */
export default function ProviderLeads() {
    const { user } = useAuth()

    // ---- Page state ----
    const [provider, setProvider] = useState(null) // this provider's own profile row
    const [leads, setLeads] = useState([])         // matching open requests
    const [sent, setSent] = useState({})           // { requestId: quoteRow } already quoted
    const [loading, setLoading] = useState(true)

    // ---- Data loading: runs on page open and after each quote ----
    async function load() {
        // Step 1: get this provider's category, pincode and verification status
        const { data: p } = await supabase
            .from('providers').select('*').eq('id', user.id).maybeSingle()
        setProvider(p)
        if (!p) { setLoading(false); return }

        // Step 2: find open requests in the same category and the same
        // pincode district. The first 3 digits of an Indian pincode identify
        // the postal district, so "841226" and "841301" both match "841%".
        const district = (p.pincode ?? '').slice(0, 3)
        const { data: reqs } = await supabase
            .from('requests').select('*')
            .eq('status', 'open')
            .eq('category', p.category)
            .like('pincode', `${district}%`)
            .order('created_at', { ascending: false })
        setLeads(reqs ?? [])

        // Step 3: find which of these the provider has already quoted on
        const { data: qs } = await supabase
            .from('quotes').select('*').eq('provider_id', user.id)
        setSent(Object.fromEntries((qs ?? []).map((q) => [q.request_id, q])))
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    // ---- Early returns ----
    if (loading) return <Spinner />
    if (!provider) return <Page title="Leads"><Empty text="Provider profile not found." /></Page>

    // ---- UI ----
    return (
        <Page size="wide" title="New leads" subtitle={`${provider.shop_name} · ${provider.category} · ${provider.city}`}>

            {/* Notice shown until the admin verifies this provider */}
            {!provider.verified && (
                <Card className="border-amber-200 bg-amber-50">
                    <p className="text-sm font-semibold text-amber-800">Verification pending</p>
                    <p className="text-sm text-amber-800">
                        You can send quotes now. Customers will see a "Verified" badge once our team approves your profile.
                    </p>
                </Card>
            )}

            {/* Empty state when no lead matches */}
            {leads.length === 0 && (
                <Empty icon={Inbox} text="No open requirements in your category and area right now." />
            )}

            {/* One card per matching request */}
            <Grid>
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

                        {/* Photo hides itself if the image URL fails to load */}
                        {r.photo_url && (
                            <img
                                src={r.photo_url} alt=""
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                                className="mt-3 h-40 w-full rounded-xl object-cover"
                            />
                        )}

                        {/* Already quoted: show the price. Otherwise: show the form */}
                        {sent[r.id] ? (
                            <div className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                                Quote sent: ₹{sent[r.id].price}
                            </div>
                        ) : (
                            <QuoteForm requestId={r.id} providerId={user.id} onSent={load} />
                        )}
                    </Card>
                ))}
            </Grid>
        </Page>
    )
}