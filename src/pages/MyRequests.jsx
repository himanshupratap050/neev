/**
 * MyRequests.jsx: CUSTOMER REQUESTS MODULE
 * ---------------------------------------------------------------
 * Purpose : The customer's dashboard. Shows every requirement they
 *           posted and lets them:
 *             - compare quotes and accept one   (open requests)
 *             - cancel the request              (open requests)
 *             - chat with the winner on WhatsApp, mark the job
 *               completed, then leave a review  (accepted requests)
 * Route   : /my-requests (customer role only, see App.jsx)
 * Tables  : requests (+ nested quotes + providers), profiles (contact
 *           of the accepted provider), reviews (ratings and "reviewed" flag)
 * RPC     : accept_quote(p_quote_id)  see schema.sql Module 6
 * Parts   : 1) ReviewForm     star rating + comment after completion
 *           2) RatingStars    small average-rating label on quote cards
 *           3) MyRequests     the page (load data, actions, cards)
 *
 * DEBUG: Cancel button error "Invalid status change" = the request is
 *        no longer 'open'. Refresh the page.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, BadgeCheck, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Page, Grid, Card, Button, Input, Badge, StatusBadge, Facts, Empty, Spinner, timeAgo } from '../components/ui'

/* ===============================================================
 * PART 1: ReviewForm
 * Inserts one row into `reviews`. The database allows it only when the
 * request is completed and the provider is the accepted one.
 * DEBUG: "duplicate key" = this request was already reviewed.
 * =============================================================== */
function ReviewForm({ requestId, providerId, onDone }) {
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    async function submit(e) {
        e.preventDefault()
        setError('')
        setBusy(true)
        const { error } = await supabase.from('reviews').insert({
            request_id: requestId, provider_id: providerId, rating, comment,
        })
        setBusy(false)
        if (error) { setError(error.message); return }
        onDone()
    }

    return (
        <form onSubmit={submit} className="mt-3 space-y-2">
            <p className="text-sm font-semibold text-green-800">Rate this provider</p>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                        <Star className={`h-8 w-8 ${n <= rating ? 'fill-amber-brand text-amber-brand' : 'text-slate-300'}`} />
                    </button>
                ))}
            </div>
            <Input placeholder="Share your experience (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button disabled={busy}>{busy ? 'Submitting...' : 'Submit review'}</Button>
        </form>
    )
}

/* ===============================================================
 * PART 2: RatingStars
 * Shows "4.5 (3)" or "No reviews yet". `stats` = { sum, count } or undefined.
 * =============================================================== */
function RatingStars({ stats }) {
    if (!stats) return <span className="text-xs text-muted">No reviews yet</span>
    return (
        <span className="flex items-center gap-1 text-xs font-semibold">
            <Star className="h-4 w-4 fill-amber-brand text-amber-brand" />
            {(stats.sum / stats.count).toFixed(1)} ({stats.count})
        </span>
    )
}

/* ===============================================================
 * PART 3: MyRequests (the page)
 * =============================================================== */
export default function MyRequests() {
    const { user } = useAuth()

    // ---- Page state ----
    const [requests, setRequests] = useState([])   // requests with nested quotes
    const [contacts, setContacts] = useState({})   // { providerId: {name, phone} } for accepted quotes
    const [ratings, setRatings] = useState({})     // { providerId: {sum, count} }
    const [reviewed, setReviewed] = useState(new Set()) // request ids that already have a review
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // ---- Data loading: runs on page open and after every action ----
    async function load() {
        // Step 1: my requests, each with its quotes and the quoting provider's shop info
        const { data, error } = await supabase
            .from('requests')
            .select('*, quotes(*, providers(shop_name, verified))')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false })
        if (error) { setError(error.message); setLoading(false); return }
        setRequests(data ?? [])

        // Step 2: name and phone of providers whose quote I accepted
        // (allowed by the RLS policy "customer reads accepted provider profile")
        const acceptedIds = (data ?? [])
            .flatMap((r) => r.quotes.filter((q) => q.status === 'accepted'))
            .map((q) => q.provider_id)
        if (acceptedIds.length) {
            const { data: profs } = await supabase.from('profiles').select('id, name, phone').in('id', acceptedIds)
            setContacts(Object.fromEntries((profs ?? []).map((p) => [p.id, p])))
        }

        // Step 3: ratings of every provider who quoted, and which requests are already reviewed
        const providerIds = [...new Set((data ?? []).flatMap((r) => r.quotes.map((q) => q.provider_id)))]
        if (providerIds.length) {
            const { data: revs } = await supabase
                .from('reviews').select('request_id, provider_id, rating').in('provider_id', providerIds)
            const stats = {}
            const done = new Set()
            for (const v of revs ?? []) {
                const s = stats[v.provider_id] ?? { sum: 0, count: 0 }
                s.sum += v.rating
                s.count += 1
                stats[v.provider_id] = s
                done.add(v.request_id)
            }
            setRatings(stats)
            setReviewed(done)
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    // ---- Action: accept a quote (one atomic database function) ----
    async function accept(quote) {
        if (!window.confirm(`Accept the quote of ₹${quote.price} from ${quote.providers?.shop_name}?`)) return
        setError('')
        const { error } = await supabase.rpc('accept_quote', { p_quote_id: quote.id })
        if (error) { setError(error.message); return }
        load()
    }

    // ---- Action: cancel an open request (allowed only while status = 'open') ----
    async function cancel(req) {
        if (!window.confirm('Cancel this requirement? Providers will no longer see it.')) return
        setError('')
        const { error } = await supabase.from('requests').update({ status: 'cancelled' }).eq('id', req.id)
        if (error) { setError(error.message); return }
        load()
    }

    // ---- Action: mark an accepted job as completed ----
    async function complete(req) {
        setError('')
        const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', req.id)
        if (error) { setError(error.message); return }
        load()
    }

    // ---- Helper: build a WhatsApp link from a phone number ----
    function waLink(phone, title) {
        const digits = (phone ?? '').replace(/\D/g, '').slice(-10)
        const text = encodeURIComponent(`Hello, I accepted your quote on NEEV for: ${title}`)
        return `https://wa.me/91${digits}?text=${text}`
    }

    // ---- Early return while loading ----
    if (loading) return <Spinner />

    // ---- UI ----
    return (
        <Page size="wide" title="My requests" subtitle="Track your requirements and compare quotes.">
            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Empty state */}
            {requests.length === 0 && (
                <>
                    <Empty icon={ClipboardList} text="You haven't posted any requirements yet." />
                    <Link to="/post" className="block max-w-xs"><Button>Post a requirement</Button></Link>
                </>
            )}

            {/* One card per request */}
            <Grid>
                {requests.map((r) => {
                    const quotes = [...r.quotes].sort((a, b) => a.price - b.price) // cheapest first
                    const lowest = quotes[0]?.id
                    const chosen = quotes.find((q) => q.status === 'accepted')
                    const contact = chosen && contacts[chosen.provider_id]

                    return (
                        <Card key={r.id} className={r.status === 'cancelled' ? 'opacity-70' : ''}>

                            {/* Card header: title + status badge */}
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
                                {r.status === 'cancelled'
                                    ? <Badge tone="gray">Cancelled</Badge>
                                    : <StatusBadge status={r.status} />}
                            </div>

                            {/* Key facts grid */}
                            <Facts items={[
                                { label: 'Category', value: r.category },
                                { label: 'Quantity', value: r.quantity },
                                { label: 'Location', value: `${r.city} ${r.pincode ?? ''}` },
                                { label: 'Posted', value: timeAgo(r.created_at) },
                            ]} />

                            {/* Photo (hides itself if the URL fails) */}
                            {r.photo_url && (
                                <img
                                    src={r.photo_url} alt=""
                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                    className="mt-3 h-32 w-full rounded-xl object-cover"
                                />
                            )}

                            {/* OPEN: list of quotes + cancel button */}
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
                                                        <div className="mt-1 flex flex-wrap items-center gap-1">
                                                            {q.providers?.verified
                                                                ? <Badge tone="green">Verified</Badge>
                                                                : <Badge tone="gray">Not verified</Badge>}
                                                            {q.id === lowest && quotes.length > 1 && <Badge tone="blue">Lowest price</Badge>}
                                                        </div>
                                                        <div className="mt-1"><RatingStars stats={ratings[q.provider_id]} /></div>
                                                    </div>
                                                    <p className="text-xl font-bold">₹{q.price}</p>
                                                </div>
                                                {q.message && <p className="mt-2 text-sm text-muted">{q.message}</p>}
                                                <Button className="mt-3" onClick={() => accept(q)}>Accept quote</Button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Cancel is available while the request is still open */}
                                    <Button variant="outline" className="mt-3" onClick={() => cancel(r)}>
                                        Cancel requirement
                                    </Button>
                                </div>
                            )}

                            {/* ACCEPTED / COMPLETED: winner box, WhatsApp, complete, review */}
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

                                    {r.status === 'completed' && (
                                        reviewed.has(r.id)
                                            ? <p className="mt-3 text-sm font-semibold text-green-800">Thank you, your review has been submitted.</p>
                                            : <ReviewForm requestId={r.id} providerId={chosen.provider_id} onDone={load} />
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